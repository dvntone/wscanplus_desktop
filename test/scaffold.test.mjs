import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readText(...segments) {
  return fs.readFileSync(path.join(root, ...segments), "utf8");
}

test("package.json stays ESM-only with exact dependency pins", () => {
  const packageJson = JSON.parse(readText("package.json"));

  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.scripts.test, "node --test");

  for (const version of Object.values(packageJson.devDependencies)) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
  }
});

test("main process keeps hardened BrowserWindow defaults", () => {
  const mainSource = readText("src", "main.mjs");

  assert.match(mainSource, /contextIsolation:\s*true/);
  assert.match(mainSource, /nodeIntegration:\s*false/);
  assert.match(mainSource, /loadFile\(path\.join\(__dirname,\s*"index\.html"\)\)/);
  assert.match(mainSource, /spawn\("adb",\s*args/);
  assert.doesNotMatch(mainSource, /\bexec\(/);
});

test("adb preflight parser extracts state and metadata from adb devices output", async () => {
  const { parseAdbDevices, summarizePreflight } = await import("../src/adb-preflight.mjs");
  const devices = parseAdbDevices(`List of devices attached
DEVICE123456\tdevice product:grail model:Pixel_10_Pro_XL device:grail
UNAUTHORIZED1\tunauthorized usb:1-1 transport_id:3
`);

  assert.deepEqual(devices, [
    {
      serial: "DEVICE123456",
      state: "device",
      model: "Pixel_10_Pro_XL",
      product: "grail",
      device: "grail",
    },
    {
      serial: "UNAUTHORIZED1",
      state: "unauthorized",
      model: "",
      product: "",
      device: "",
    },
  ]);

  const summary = summarizePreflight(
    "Android Debug Bridge version 1.0.41\nVersion 36.0.0-13206524",
    "List of devices attached\n\n",
  );

  assert.equal(summary.ok, true);
  assert.equal(summary.adbVersion, "Android Debug Bridge version 1.0.41");
  assert.deepEqual(summary.devices, []);
});
