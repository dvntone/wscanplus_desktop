export const SEVERITY = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
});

const SEVERITY_ORDER = [SEVERITY.INFO, SEVERITY.LOW, SEVERITY.MEDIUM, SEVERITY.HIGH];

function bumpSeverity(current, next) {
  const a = SEVERITY_ORDER.indexOf(current);
  const b = SEVERITY_ORDER.indexOf(next);
  return SEVERITY_ORDER[Math.max(a, b)];
}

/**
 * Score a single AP against the known AP baseline.
 * Returns a deterministic score object with explicit reasons.
 * No ML, no inference beyond the observed signals.
 */
export function scoreAP(ap, baselineAps = new Map()) {
  const reasons = [];
  let severity = SEVERITY.INFO;

  // Hidden SSID
  if (!ap.ssid || ap.ssid.length === 0) {
    reasons.push("Hidden SSID");
    severity = bumpSeverity(severity, SEVERITY.LOW);
  }

  // Open network (no encryption)
  if (ap.security === "open") {
    reasons.push("No encryption (open network)");
    severity = bumpSeverity(severity, SEVERITY.LOW);
  }

  // WEP — deprecated and trivially broken
  if (ap.security === "wep") {
    reasons.push("WEP encryption (deprecated, trivially broken)");
    severity = bumpSeverity(severity, SEVERITY.MEDIUM);
  }

  // Exceptionally strong signal — may indicate co-located rogue AP
  if (ap.signal > -30) {
    reasons.push(
      `Exceptionally strong signal (${ap.signal} dBm) — possible co-located rogue`,
    );
    severity = bumpSeverity(severity, SEVERITY.MEDIUM);
  }

  // SSID collision — same name as a known AP but different BSSID
  if (ap.ssid && ap.ssid.length > 0) {
    for (const [knownBssid, knownAp] of baselineAps) {
      if (knownBssid !== ap.bssid && knownAp.ssid === ap.ssid) {
        reasons.push(`SSID collision: same name as known AP ${knownBssid}`);
        severity = bumpSeverity(severity, SEVERITY.HIGH);
        break;
      }
    }
  }

  const confidence =
    reasons.length === 0 ? 0 : Math.min(0.9, 0.3 + reasons.length * 0.2);

  return {
    bssid: ap.bssid,
    ssid: ap.ssid,
    severity,
    reasons,
    confidence,
  };
}

/**
 * Score all APs. Returns only entries that have at least one reason.
 */
export function scoreAPs(aps, baselineAps = new Map()) {
  return aps
    .map((ap) => scoreAP(ap, baselineAps))
    .filter((s) => s.reasons.length > 0);
}
