import { EventEmitter } from "node:events";

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
    for (const ap of newAps) {
      this.#state.aps.set(ap.bssid, { ...ap, lastSeen: now });
    }
    this.emit("aps", Array.from(this.#state.aps.values()));
  }

  addRiskEntries(entries) {
    const now = Date.now();

    // Prune TTL-expired entries
    this.#state.riskLog = this.#state.riskLog.filter(
      (e) => now - e.ts < RISK_LOG_TTL_MS,
    );

    // Upsert by dedupe key: bssid only (one entry per AP)
    for (const entry of entries) {
      const key = entry.bssid;
      const idx = this.#state.riskLog.findIndex(
        (e) => e.bssid === key,
      );
      if (idx >= 0) {
        this.#state.riskLog[idx] = { ...entry, ts: now };
      } else {
        this.#state.riskLog.push({ ...entry, ts: now });
      }
    }

    // Enforce max bound
    if (this.#state.riskLog.length > RISK_LOG_MAX) {
      this.#state.riskLog = this.#state.riskLog.slice(-RISK_LOG_MAX);
    }

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
