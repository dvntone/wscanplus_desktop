import { EventEmitter } from "node:events";

const APS_MAX = 2000;
const APS_TTL_MS = 10 * 60_000; // 10 minutes
const RISK_LOG_MAX = 1000;
const RISK_LOG_TTL_MS = 60_000;

class Store extends EventEmitter {
  #state;

  constructor() {
    super();
    this.#state = {
      scanning: false,
      scanIntervalMs: 30_000,
      interface: null,
      aps: new Map(),       // bssid -> ap object (last seen)
      riskLog: [],          // bounded, TTL-managed risk entries
      errors: [],           // bounded error log
      companionDevices: new Map(), // deviceId -> session metadata
    };
  }

  get state() {
    return this.#state;
  }

  update(patch) {
    Object.assign(this.#state, patch);
    this.emit("change", this.#state);
  }

  addAps(newAps) {
    const now = Date.now();

    // Drop stale APs to keep memory bounded and avoid sending long-dead entries.
    for (const [bssid, ap] of this.#state.aps) {
      if (now - ap.lastSeen > APS_TTL_MS) {
        this.#state.aps.delete(bssid);
      }
    }

    for (const ap of newAps) {
      this.#state.aps.set(ap.bssid, { ...ap, lastSeen: now });
    }

    // Enforce a hard cap; evict the oldest entries first.
    if (this.#state.aps.size > APS_MAX) {
      const sorted = Array.from(this.#state.aps.entries()).sort(
        (a, b) => a[1].lastSeen - b[1].lastSeen,
      );
      while (sorted.length > APS_MAX) {
        const [oldestBssid] = sorted.shift();
        this.#state.aps.delete(oldestBssid);
      }
    }

    this.emit("aps", Array.from(this.#state.aps.values()));
  }

  addRiskEntries(entries) {
    const now = Date.now();

    // Prune TTL-expired entries
    this.#state.riskLog = this.#state.riskLog.filter(
      (e) => now - e.ts < RISK_LOG_TTL_MS,
    );

    // Upsert by BSSID (latest severity wins)
    const existing = new Map(
      this.#state.riskLog.map((entry) => [entry.bssid, entry]),
    );

    for (const entry of entries) {
      existing.set(entry.bssid, { ...entry, ts: now });
    }

    const deduped = Array.from(existing.values()).sort(
      (a, b) => a.ts - b.ts,
    );

    // Enforce max bound (keep most recent)
    this.#state.riskLog =
      deduped.length > RISK_LOG_MAX
        ? deduped.slice(-RISK_LOG_MAX)
        : deduped;

    this.emit("riskLog", this.#state.riskLog);
  }

  addError(err) {
    const entry = {
      message: err instanceof Error ? err.message : String(err),
      ts: Date.now(),
    };
    this.#state.errors.push(entry);
    if (this.#state.errors.length > 100) {
      this.#state.errors = this.#state.errors.slice(-100);
    }
    this.emit("appError", entry);
  }
}

export const store = new Store();
