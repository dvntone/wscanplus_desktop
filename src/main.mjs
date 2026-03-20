import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRELIGHT_CLASSIFICATIONS,
  parseCompanionPackagePath,
  summarizePreflight,
  validateDeviceSelector,
} from "./adb-preflight.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPANION_PACKAGE = "com.wscanplus.app";

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
      results.push(device);
      continue;
    }

    if (!validateDeviceSelector(device.serial)) {
      results.push({
        ...device,
        companion: {
          status: "unknown",
          packageName: COMPANION_PACKAGE,
        },
      });
      continue;
    }

    try {
      const output = await runAdb([
        "-s",
        device.serial,
        "shell",
        "pm",
        "list",
        "packages",
        COMPANION_PACKAGE,
      ]);

      results.push({
        ...device,
        companion: parseCompanionPackagePath(output, COMPANION_PACKAGE),
      });
    } catch {
      results.push({
        ...device,
        companion: {
          status: "unknown",
          packageName: COMPANION_PACKAGE,
        },
      });
    }
  }

  return results;
}

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
