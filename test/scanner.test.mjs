import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  ScanError,
  freqToChannel,
  parseScanOutput,
  processScanResults,
  runCommand,
} from "../src/scanner.mjs";
import { store } from "../src/store.mjs";

beforeEach(() => {
  store.state.aps.clear();
  store.state.riskLog.length = 0;
  store.state.errors.length = 0;
});

test("freqToChannel maps 2.4/5/6 GHz and unknown frequencies", () => {
  assert.equal(freqToChannel(2412), 1);
  assert.equal(freqToChannel(5180), 36);
  assert.equal(freqToChannel(5955), 1);
  assert.equal(freqToChannel(6115), 33);
  assert.equal(freqToChannel(7115), 233);
  assert.equal(freqToChannel(1234), 0);
});

test("parseScanOutput extracts SSID, security, signal, and channel", () => {
  const sample = `
BSS aa:bb:cc:dd:ee:ff(on wlan0)
        freq: 2412
        beacon interval: 100 TUs
        signal: -40.00 dBm
        SSID: TestAP
        RSN:     * Version: 1
BSS 11:22:33:44:55:66(on wlan0)
        freq: 5180
        signal: -80.0 dBm
        SSID:
        capability: ESS Privacy
`;

  const aps = parseScanOutput(sample);
  assert.equal(aps.length, 2);
  const [first, second] = aps;

  assert.equal(first.bssid, "aa:bb:cc:dd:ee:ff");
  assert.equal(first.ssid, "TestAP");
  assert.equal(first.security, "wpa2");
  assert.equal(first.channel, 1);
  assert.equal(first.signal, -40);

  assert.equal(second.ssid, "");
  assert.equal(second.security, "wep");
  assert.equal(second.channel, 36);
});

test("runCommand resolves output and enforces timeout", async () => {
  const out = await runCommand(
    process.execPath,
    ["-e", "console.log('ok')"],
    1_000,
  );
  assert.equal(out.trim(), "ok");

  await assert.rejects(
    runCommand(
      process.execPath,
      ["-e", "setTimeout(() => {}, 1000)"],
      50,
    ),
    (err) =>
      err instanceof ScanError &&
      err.message.includes("Command timed out"),
  );
});

test("processScanResults scores against pre-scan baseline", async () => {
  const aps = [
    {
      bssid: "aa:bb:cc:dd:ee:01",
      ssid: "Cafe",
      frequency: 2412,
      channel: 1,
      signal: -45,
      security: "wpa2",
    },
    {
      bssid: "aa:bb:cc:dd:ee:02",
      ssid: "Cafe",
      frequency: 2412,
      channel: 1,
      signal: -47,
      security: "wpa2",
    },
  ];

  processScanResults(aps);

  assert.equal(store.state.aps.size, 2);
  assert.equal(store.state.riskLog.length, 0);
});
