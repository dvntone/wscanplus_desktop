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
  const {
    parseAdbDevices,
    describeDeviceReadiness,
    parseCompanionPackagePath,
    parseCompanionVersionInfo,
    summarizePreflight,
    classifyPreflight,
    PRELIGHT_CLASSIFICATIONS,
    validateDeviceSelector,
  } = await import("../src/adb-preflight.mjs");
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
      companion: {
        status: "unchecked",
        packageName: "",
        versionName: "",
        versionCode: "",
      },
    },
    {
      serial: "UNAUTHORIZED1",
      state: "unauthorized",
      model: "",
      product: "",
      device: "",
      companion: {
        status: "unchecked",
        packageName: "",
        versionName: "",
        versionCode: "",
      },
    },
  ]);

  const summary = summarizePreflight(
    "Android Debug Bridge version 1.0.41\nVersion 36.0.0-13206524",
    "List of devices attached\n\n",
  );

  assert.equal(summary.ok, true);
  assert.equal(summary.adbVersion, "Android Debug Bridge version 1.0.41");
  assert.deepEqual(summary.devices, []);
  assert.equal(summary.classification.level, "no-devices");

  assert.deepEqual(
    classifyPreflight({
      ok: true,
      devices: [{ state: "unauthorized" }],
    }),
    PRELIGHT_CLASSIFICATIONS.unauthorized,
  );

  assert.deepEqual(
    classifyPreflight({
      ok: true,
      devices: [{ state: "offline" }],
    }),
    PRELIGHT_CLASSIFICATIONS.offline,
  );

  assert.deepEqual(
    classifyPreflight({
      ok: false,
    }),
    PRELIGHT_CLASSIFICATIONS.adbMissing,
  );

  assert.deepEqual(
    classifyPreflight({
      ok: true,
      devices: [{ state: "device" }],
    }),
    PRELIGHT_CLASSIFICATIONS.ready,
  );

  assert.deepEqual(
    classifyPreflight({
      ok: true,
      devices: [{ state: "recovery" }],
    }),
    PRELIGHT_CLASSIFICATIONS.notReady,
  );

  assert.deepEqual(
    classifyPreflight({
      ok: true,
    }),
    PRELIGHT_CLASSIFICATIONS.noDevices,
  );

  assert.equal(validateDeviceSelector("DEVICE123456"), true);
  assert.equal(validateDeviceSelector("device.serial-01"), true);
  assert.equal(validateDeviceSelector("bad serial"), false);

  assert.deepEqual(
    parseCompanionPackagePath("package:com.wscanplus.app\n", "com.wscanplus.app"),
    {
      status: "installed",
      packageName: "com.wscanplus.app",
      versionName: "",
      versionCode: "",
    },
  );

  assert.deepEqual(
    parseCompanionPackagePath("", "com.wscanplus.app"),
    {
      status: "missing",
      packageName: "com.wscanplus.app",
      versionName: "",
      versionCode: "",
    },
  );

  assert.deepEqual(
    parseCompanionVersionInfo("Packages:\n  Package [com.wscanplus.app] (1234):\n    versionCode=2 minSdk=24 targetSdk=36\n    versionName=0.1.0\n"),
    {
      versionName: "0.1.0",
      versionCode: "2",
    },
  );

  assert.deepEqual(
    describeDeviceReadiness({
      state: "unauthorized",
    }),
    {
      label: "Authorization required",
      guidance:
        "Unlock the device, accept the USB debugging prompt, and only use 'Always allow from this computer' on a private trusted desktop.",
    },
  );

  assert.deepEqual(
    describeDeviceReadiness({
      state: "device",
      companion: {
        status: "missing",
        packageName: "com.wscanplus.app",
      },
    }),
    {
      label: "Companion missing",
      guidance:
        "The device is authorized, but `com.wscanplus.app` is not installed yet. Install the companion app before later desktop checks.",
    },
  );

  assert.deepEqual(
    describeDeviceReadiness({
      state: "device",
      companion: {
        status: "installed",
        versionName: "0.1.0",
      },
    }),
    {
      label: "Companion ready",
      guidance:
        "The device is authorized and the Android companion is installed. Version 0.1.0 is present.",
    },
  );
});
