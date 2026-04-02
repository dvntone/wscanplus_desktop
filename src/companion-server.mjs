import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { WebSocketServer } from "ws";

const MAX_STALE_MS = 2 * 60 * 1000;   // 2 minutes
const RATE_LIMIT_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 1_000;

/**
 * Validate that a payload timestamp is within the acceptable staleness window.
 */
export function isTimestampFresh(
  timestamp,
  nowMs = Date.now(),
  maxStalenessMs = MAX_STALE_MS,
) {
  return typeof timestamp === "number" &&
    Math.abs(nowMs - timestamp) <= maxStalenessMs;
}

/**
 * Validate that a sequence number is strictly greater than the last seen
 * sequence for this device (monotonic enforcement).
 */
export function isSequenceMonotonic(deviceId, sequence, sessions) {
  const session = sessions.get(deviceId);
  return !session || sequence > session.sequence;
}

function newSession() {
  return { sequence: -1, rateCount: 0, rateWindowStart: Date.now() };
}

/**
 * WebSocket server for the Android companion sensor.
 *
 * Security model:
 * - Binds to 127.0.0.1 by default (LAN exposure is explicit opt-in)
 * - Requires token-based pairing before any scan data is accepted
 * - Rejects payloads with stale timestamps (>2 min)
 * - Enforces strictly monotonic sequence numbers per device
 * - Rate-limits messages per device per second
 */
export class CompanionServer {
  #token = null;
  #sessions = new Map();
  #httpServer = null;
  #wss = null;
  #onData = null;

  constructor({ onData } = {}) {
    this.#onData = onData ?? null;
  }

  /**
   * Generate (or regenerate) the pairing token.
   * Returns the token string. Share this out-of-band with the Android app.
   */
  generateToken() {
    this.#token = randomBytes(16).toString("hex");
    return this.#token;
  }

  get token() {
    return this.#token;
  }

  get address() {
    return this.#httpServer?.address() ?? null;
  }

  /**
   * Start the WebSocket server.
   * @param {number} port - 0 = OS-assigned. Use process.env.COMPANION_PORT for override.
   * @param {string} host - defaults to 127.0.0.1 (localhost-only)
   */
  start(port = 0, host = "127.0.0.1") {
    if (this.#httpServer) return Promise.resolve(this.address);
    return new Promise((resolve, reject) => {
      this.#httpServer = createServer();
      this.#wss = new WebSocketServer({ server: this.#httpServer });
      this.#wss.on("connection", (ws) => this.#handleConnection(ws));
      this.#httpServer.on("error", reject);
      this.#httpServer.listen(port, host, () => resolve(this.address));
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.#httpServer) {
        resolve();
        return;
      }
      this.#wss?.close();
      this.#httpServer.close(() => {
        this.#httpServer = null;
        this.#wss = null;
        resolve();
      });
    });
  }

  #handleConnection(ws) {
    let authenticated = false;

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.close(1008, "Invalid JSON");
        return;
      }

      // First message must be auth
      if (!authenticated) {
        if (
          msg.type !== "auth" ||
          !this.#token ||
          typeof msg.token !== "string" ||
          msg.token !== this.#token
        ) {
          ws.close(1008, "Authentication failed");
          return;
        }
        authenticated = true;
        ws.send(JSON.stringify({ type: "auth_ok" }));
        return;
      }

      if (msg.type !== "scan") return;

      if (!this.#validatePayload(ws, msg.payload)) return;

      const { deviceId, sequence } = msg.payload;
      const session = this.#sessions.get(deviceId) ?? newSession();
      session.sequence = sequence;
      this.#sessions.set(deviceId, session);

      this.#onData?.(msg.payload);
    });

    ws.on("error", () => {
      /* connection close is handled by the 'close' event */
    });
  }

  #validatePayload(ws, payload) {
    if (!payload || typeof payload !== "object") return false;

    const { deviceId, sequence, timestamp, networks } = payload;

    if (typeof deviceId !== "string" || !deviceId) return false;

    // Rate limit before other checks — invalid payloads count against the limit
    if (!this.#checkRateLimit(deviceId)) {
      ws.close(1008, "Rate limit exceeded");
      return false;
    }

    if (!Number.isInteger(sequence)) return false;
    if (!Array.isArray(networks)) return false;

    // Reject stale timestamps
    if (!isTimestampFresh(timestamp)) return false;

    // Enforce monotonic sequence
    if (!isSequenceMonotonic(deviceId, sequence, this.#sessions)) return false;

    return true;
  }

  #checkRateLimit(deviceId) {
    const session = this.#sessions.get(deviceId) ?? newSession();
    const now = Date.now();

    if (now - session.rateWindowStart > RATE_LIMIT_WINDOW_MS) {
      session.rateCount = 0;
      session.rateWindowStart = now;
    }

    session.rateCount += 1;
    this.#sessions.set(deviceId, session);

    return session.rateCount <= RATE_LIMIT_PER_WINDOW;
  }
}
