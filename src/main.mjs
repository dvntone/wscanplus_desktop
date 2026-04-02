import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRELIGHT_CLASSIFICATIONS,
  describeDeviceReadiness,
  parseCompanionPackagePath,
  parseCompanionVersionInfo,
  summarizePreflight,
  validateDeviceSelector,
} from "./adb-preflight.mjs";
import { store } from "./store.mjs";
import {
  startScanning,
  stopScanning,
  executeScanCycle,
  detectInterfaces,
} from "./scanner.mjs";
import { CompanionServer } from "./companion-server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPANION_PACKAGE = "com.wscanplus.app";
const COMPANION_PORT = parseInt(process.env.COMPANION_PORT ?? "47392", 10);
// Localhost-only by default. Set COMPANION_HOST=0.0.0.0 only for explicit LAN opt-in.
const COMPANION_HOST = process.env.COMPANION_HOST ?? "127.0.0.1";

// --- ADB helpers (unchanged) ---

function unknownCompanion() {
  return {
    status: "unknown",
    packageName: COMPANION_PACKAGE,
    versionName: "",
    versionCode: "",
  };
}

function runAdb(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("adb", args, {
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `adb exited with code ${code}`));
    });
  });
}

async function attachCompanionStatus(devices) {
  const results = [];

  for (const device of devices) {
    if (device.state !== "device") {
      results.push({
        ...device,
        readiness: describeDeviceReadiness(device),
      });
      continue;
    }

    if (!validateDeviceSelector(device.serial)) {
      const companion = unknownCompanion();

      results.push({
        ...device,
        companion,
        readiness: describeDeviceReadiness({
          ...device,
          companion,
        }),
      });
      continue;
    }

    try {
      const packageOutput = await runAdb([
        "-s",
        device.serial,
        "shell",
        "pm",
        "list",
        "packages",
        COMPANION_PACKAGE,
      ]);
      const companion = parseCompanionPackagePath(
        packageOutput,
        COMPANION_PACKAGE,
      );

      if (companion.status === "missing") {
        results.push({
          ...device,
          companion,
          readiness: describeDeviceReadiness({
            ...device,
            companion,
          }),
        });
        continue;
      }

      const dumpOutput = await runAdb([
        "-s",
        device.serial,
        "shell",
        "dumpsys",
        "package",
        COMPANION_PACKAGE,
      ]);

      const companionWithVersion = {
        ...companion,
        ...parseCompanionVersionInfo(dumpOutput),
      };

      results.push({
        ...device,
        companion: companionWithVersion,
        readiness: describeDeviceReadiness({
          ...device,
          companion: companionWithVersion,
        }),
      });
    } catch {
      const companion = unknownCompanion();

      results.push({
        ...device,
        companion,
        readiness: describeDeviceReadiness({
          ...device,
          companion,
        }),
      });
    }
  }

  return results;
}

// --- IPC: ADB preflight (unchanged) ---

ipcMain.handle("adb:preflight", async () => {
  try {
    await runAdb(["start-server"]);
    const versionOutput = await runAdb(["version"]);
    const devicesOutput = await runAdb(["devices", "-l"]);
    const summary = summarizePreflight(versionOutput, devicesOutput);
    return {
      ...summary,
      devices: await attachCompanionStatus(summary.devices),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ADB preflight failed.";
    const failure = {
      ok: false,
      error: message,
      rawError:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              code: error.code,
            }
          : String(error),
    };
    const isAdbMissing =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT";

    return {
      ...failure,
      classification: isAdbMissing
        ? PRELIGHT_CLASSIFICATIONS.adbMissing
        : PRELIGHT_CLASSIFICATIONS.preflightFailed,
    };
  }
});

// --- IPC: Scanner ---

ipcMain.handle("scan:start", async (_, iface) => {
  try {
    await startScanning(iface || undefined);
    return { ok: true, interface: store.state.interface };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

ipcMain.handle("scan:stop", () => {
  stopScanning();
  return { ok: true };
});

ipcMain.handle("scan:manual", async () => {
  try {
    const aps = await executeScanCycle();
    return { ok: true, count: aps.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

ipcMain.handle("scan:state", () => ({
  scanning: store.state.scanning,
  interface: store.state.interface,
  scanIntervalMs: store.state.scanIntervalMs,
  apCount: store.state.aps.size,
  riskCount: store.state.riskLog.length,
}));

ipcMain.handle("scan:interfaces", async () => {
  try {
    const interfaces = await detectInterfaces();
    return { ok: true, interfaces };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      interfaces: [],
    };
  }
});

// --- IPC: Companion ---

let companionServer = null;

ipcMain.handle("companion:pair", async () => {
  if (!companionServer) {
    companionServer = new CompanionServer({
      onData: (payload) => {
        if (Array.isArray(payload.networks) && payload.networks.length > 0) {
          const normalized = payload.networks.map((n) => ({
            bssid: String(n.bssid ?? "").toLowerCase(),
            ssid: String(n.ssid ?? ""),
            signal: Number(n.rssi ?? n.signal ?? -100),
            frequency: Number(n.frequency ?? 0),
            channel: Number(n.channel ?? 0),
            security: String(n.security ?? "open"),
            source: "android",
            deviceId: payload.deviceId,
          }));
          store.addAps(normalized);
        }
        pushToRenderer("companion:update", {
          deviceId: payload.deviceId,
          timestamp: payload.timestamp,
          networkCount: payload.networks?.length ?? 0,
        });
      },
    });
  }

  const token = companionServer.generateToken();

  try {
    const addr = await companionServer.start(COMPANION_PORT, COMPANION_HOST);
    return { ok: true, token, address: addr };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

ipcMain.handle("companion:status", () => ({
  running: companionServer !== null && companionServer.address !== null,
  address: companionServer?.address ?? null,
  token: companionServer?.token ?? null,
}));

// --- Window & store → renderer event bridge ---

let mainWindow = null;

function pushToRenderer(channel, data) {
  if (
    mainWindow !== null &&
    !mainWindow.isDestroyed() &&
    !mainWindow.webContents.isDestroyed()
  ) {
    mainWindow.webContents.send(channel, data);
  }
}

store.on("aps", (aps) => pushToRenderer("scan:aps", aps));
store.on("riskLog", (log) => pushToRenderer("scan:risklog", log));
store.on("change", (state) =>
  pushToRenderer("scan:statechange", {
    scanning: state.scanning,
    interface: state.interface,
    scanIntervalMs: state.scanIntervalMs,
  }),
);
store.on("appError", (entry) => pushToRenderer("app:error", entry));

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  stopScanning();
  companionServer?.stop().catch(() => {});
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Ensure cleanup runs regardless of quit path (SIGTERM, dock quit, etc.).
// stopScanning() is synchronous; companion stop is fire-and-forget since
// we cannot defer quit here without risking a hang.
app.on("before-quit", () => {
  stopScanning();
  companionServer?.stop().catch(() => {});
});
