import assert from "node:assert/strict";
import { test } from "node:test";
import { SEVERITY, scoreAP, scoreAPs } from "../src/detector.mjs";

test("scores hidden and open networks with appropriate severity", () => {
  const result = scoreAP({
    bssid: "aa:bb:cc:dd:ee:ff",
    ssid: "",
    security: "open",
    signal: -55,
  });

  assert.equal(result.severity, SEVERITY.LOW);
  assert.ok(result.reasons.includes("Hidden SSID"));
  assert.ok(result.reasons.some((r) => r.includes("No encryption")));
});

test("bumps severity for weak encryption and strong signals", () => {
  const wep = scoreAP({
    bssid: "11:22:33:44:55:66",
    ssid: "legacy",
    security: "wep",
    signal: -60,
  });
  assert.equal(wep.severity, SEVERITY.MEDIUM);
  assert.ok(
    wep.reasons.some((r) => r.includes("WEP encryption")),
  );

  const strong = scoreAP({
    bssid: "22:33:44:55:66:77",
    ssid: "office",
    security: "wpa2",
    signal: -20,
  });
  assert.equal(strong.severity, SEVERITY.MEDIUM);
  assert.ok(
    strong.reasons.some((r) => r.includes("Exceptionally strong signal")),
  );
});

test("detects SSID collisions against baseline", () => {
  const baseline = new Map([
    [
      "00:11:22:33:44:55",
      { bssid: "00:11:22:33:44:55", ssid: "cafe", security: "wpa2", signal: -50 },
    ],
  ]);

  const result = scoreAP(
    {
      bssid: "aa:aa:aa:aa:aa:aa",
      ssid: "cafe",
      security: "wpa2",
      signal: -60,
    },
    baseline,
  );

  assert.equal(result.severity, SEVERITY.HIGH);
  assert.ok(
    result.reasons.some((r) => r.includes("SSID collision")),
  );
});

test("scoreAPs filters to entries with reasons", () => {
  const scored = scoreAPs([
    { bssid: "11:11:11:11:11:11", ssid: "open", security: "open", signal: -40 },
    { bssid: "22:22:22:22:22:22", ssid: "secure", security: "wpa2", signal: -50 },
  ]);

  assert.equal(scored.length, 1);
  assert.equal(scored[0].bssid, "11:11:11:11:11:11");
});
