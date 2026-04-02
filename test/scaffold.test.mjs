import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

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
  assert.match(mainSource, /sandbox:\s*true/);
  assert.match(mainSource, /loadFile\(path\.join\(__dirname,\s*"index\.html"\)\)/);
  assert.match(mainSource, /spawn\("adb",\s*args/);
  assert.doesNotMatch(mainSource, /\bexec\(/);
});

test("renderer shell defines a restrictive CSP", () => {
  const htmlSource = readText("src", "index.html");

  assert.match(htmlSource, /Content-Security-Policy/);
  assert.match(htmlSource, /default-src 'self'/);
  assert.match(htmlSource, /script-src 'self'/);
  assert.match(htmlSource, /style-src 'self'/);
  assert.match(htmlSource, /object-src 'none'/);
  assert.match(htmlSource, /base-uri 'none'/);
  assert.doesNotMatch(htmlSource, /style-src[^;]*'unsafe-inline'/);
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

// ── scanner.mjs unit tests ────────────────────────────────────────────────

test("freqToChannel maps 2.4 GHz, 5 GHz, and 6 GHz frequencies correctly", async () => {
  const { freqToChannel } = await import("../src/scanner.mjs");

  // 2.4 GHz band
  assert.equal(freqToChannel(2412), 1);
  assert.equal(freqToChannel(2437), 6);
  assert.equal(freqToChannel(2462), 11);
  assert.equal(freqToChannel(2484), 14);

  // 5 GHz band
  assert.equal(freqToChannel(5180), 36);
  assert.equal(freqToChannel(5745), 149);

  // 6 GHz band
  assert.equal(freqToChannel(5955), 1);
  assert.equal(freqToChannel(6415), 93);

  // Unknown
  assert.equal(freqToChannel(9999), 0);
});

test("parseScanOutput parses a multi-AP iw scan block into AP objects", async () => {
  const { parseScanOutput } = await import("../src/scanner.mjs");

  const raw = `BSS aa:bb:cc:dd:ee:ff(on wlan0)
\tfreq: 2412
\tsignal: -55.00 dBm
\tSSID: HomeNetwork
\tRSN:\t * Version: 1
BSS 11:22:33:44:55:66(on wlan0)
\tfreq: 5745
\tsignal: -72.00 dBm
\tSSID:
\tcapability: ESS Privacy ShortSlotTime (0x0411)
BSS aa:11:22:33:44:55(on wlan0)
\tfreq: 2437
\tsignal: -40.00 dBm
\tSSID: WepNet
\tcapability: ESS Privacy (0x0011)
`;

  const aps = parseScanOutput(raw);
  assert.equal(aps.length, 3);

  const home = aps.find((a) => a.bssid === "aa:bb:cc:dd:ee:ff");
  assert.ok(home, "first AP present");
  assert.equal(home.ssid, "HomeNetwork");
  assert.equal(home.channel, 1);
  assert.equal(home.signal, -55);
  assert.equal(home.security, "wpa2");

  const hidden = aps.find((a) => a.bssid === "11:22:33:44:55:66");
  assert.ok(hidden, "hidden AP present");
  assert.equal(hidden.ssid, "");
  assert.equal(hidden.channel, 149);
  assert.equal(hidden.security, "wep");

  const wep = aps.find((a) => a.bssid === "aa:11:22:33:44:55");
  assert.ok(wep, "WEP AP present");
  assert.equal(wep.ssid, "WepNet");
  assert.equal(wep.security, "wep");
});

test("parseScanOutput returns empty array for empty input", async () => {
  const { parseScanOutput } = await import("../src/scanner.mjs");
  assert.deepEqual(parseScanOutput(""), []);
  assert.deepEqual(parseScanOutput("List of devices attached\n"), []);
});

test("runCommand rejects with ScanError on timeout", async () => {
  const { runCommand, ScanError } = await import("../src/scanner.mjs");

  await assert.rejects(
    () => runCommand("sleep", ["10"], 50),
    (err) => {
      assert.ok(err instanceof ScanError, "is ScanError");
      assert.ok(
        err.signal === "SIGTERM" || err.signal === "SIGKILL",
        `signal is SIGTERM or SIGKILL, got ${err.signal}`,
      );
      return true;
    },
  );
});

test("runCommand rejects with ScanError when command not found", async () => {
  const { runCommand, ScanError } = await import("../src/scanner.mjs");

  await assert.rejects(
    () => runCommand("_wscan_no_such_binary_xyz", []),
    (err) => {
      assert.ok(err instanceof ScanError, "is ScanError");
      assert.equal(err.code, "ENOENT");
      return true;
    },
  );
});

// ── detector.mjs unit tests ───────────────────────────────────────────────

test("scoreAP returns info with no reasons for a clean AP", async () => {
  const { scoreAP, SEVERITY } = await import("../src/detector.mjs");

  const ap = { bssid: "aa:bb:cc:dd:ee:ff", ssid: "SafeNet", signal: -60, security: "wpa2" };
  const result = scoreAP(ap);
  assert.equal(result.severity, SEVERITY.INFO);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.confidence, 0);
});

test("scoreAP flags hidden SSID as LOW", async () => {
  const { scoreAP, SEVERITY } = await import("../src/detector.mjs");

  const ap = { bssid: "aa:bb:cc:dd:ee:ff", ssid: "", signal: -60, security: "wpa2" };
  const result = scoreAP(ap);
  assert.equal(result.severity, SEVERITY.LOW);
  assert.ok(result.reasons.some((r) => r.includes("Hidden SSID")));
});

test("scoreAP flags open network as LOW", async () => {
  const { scoreAP, SEVERITY } = await import("../src/detector.mjs");

  const ap = { bssid: "aa:bb:cc:dd:ee:ff", ssid: "CafeWifi", signal: -65, security: "open" };
  const result = scoreAP(ap);
  assert.equal(result.severity, SEVERITY.LOW);
  assert.ok(result.reasons.some((r) => r.includes("open")));
});

test("scoreAP flags WEP as MEDIUM", async () => {
  const { scoreAP, SEVERITY } = await import("../src/detector.mjs");

  const ap = { bssid: "aa:bb:cc:dd:ee:ff", ssid: "OldNet", signal: -65, security: "wep" };
  const result = scoreAP(ap);
  assert.equal(result.severity, SEVERITY.MEDIUM);
  assert.ok(result.reasons.some((r) => r.includes("WEP")));
});

test("scoreAP flags exceptionally strong signal as MEDIUM", async () => {
  const { scoreAP, SEVERITY } = await import("../src/detector.mjs");

  const ap = { bssid: "aa:bb:cc:dd:ee:ff", ssid: "CloseAP", signal: -20, security: "wpa2" };
  const result = scoreAP(ap);
  assert.equal(result.severity, SEVERITY.MEDIUM);
  assert.ok(result.reasons.some((r) => r.includes("strong signal")));
});

test("scoreAP flags SSID collision as HIGH", async () => {
  const { scoreAP, SEVERITY } = await import("../src/detector.mjs");

  const baseline = new Map([
    ["aa:bb:cc:dd:ee:ff", { bssid: "aa:bb:cc:dd:ee:ff", ssid: "CorpWifi" }],
  ]);
  const rogue = { bssid: "11:22:33:44:55:66", ssid: "CorpWifi", signal: -65, security: "wpa2" };
  const result = scoreAP(rogue, baseline);
  assert.equal(result.severity, SEVERITY.HIGH);
  assert.ok(result.reasons.some((r) => r.includes("SSID collision")));
});

test("scoreAPs returns only APs with at least one reason", async () => {
  const { scoreAPs } = await import("../src/detector.mjs");

  const aps = [
    { bssid: "aa:bb:cc:dd:ee:ff", ssid: "Clean", signal: -60, security: "wpa2" },
    { bssid: "11:22:33:44:55:66", ssid: "", signal: -70, security: "wpa2" },
    { bssid: "22:33:44:55:66:77", ssid: "OpenNet", signal: -65, security: "open" },
  ];
  const results = scoreAPs(aps);
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.reasons.length > 0));
  assert.ok(!results.some((r) => r.bssid === "aa:bb:cc:dd:ee:ff"));
});
