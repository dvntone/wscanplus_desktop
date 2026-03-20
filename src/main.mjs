import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { summarizePreflight } from "./adb-preflight.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

ipcMain.handle("adb:preflight", async () => {
  try {
    await runAdb(["start-server"]);
    const versionOutput = await runAdb(["version"]);
    const devicesOutput = await runAdb(["devices", "-l"]);
    return summarizePreflight(versionOutput, devicesOutput);
  } catch (error) {
    const failure = {
      ok: false,
      error: error instanceof Error ? error.message : "ADB preflight failed.",
    };
    return {
      ...failure,
      classification: {
        level: "adb-missing",
        title: "ADB unavailable",
        guidance:
          "Install Android Platform Tools and ensure `adb` is on your PATH before continuing.",
      },
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
