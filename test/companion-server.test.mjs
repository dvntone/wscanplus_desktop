import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { once } from "node:events";
import { WebSocket } from "ws";
import {
  CompanionServer,
  isSequenceMonotonic,
  isTimestampFresh,
} from "../src/companion-server.mjs";

let server = null;

afterEach(async () => {
  if (server) {
    await server.stop();
    server = null;
  }
});

const toWsUrl = (address) => {
  if (typeof address === "string") return address;
  const host =
    address.address && address.address.includes(":")
      ? `[${address.address}]`
      : address.address || "127.0.0.1";
  return `ws://${host}:${address.port}`;
};

test("timestamp and sequence helpers validate bounds", () => {
  const now = Date.now();
  assert.ok(isTimestampFresh(now, now, 1_000));
  assert.ok(!isTimestampFresh(now - 2_000, now, 1_000));
  assert.ok(!isTimestampFresh(now + 2_000, now, 1_000));

  const sessions = new Map();
  assert.ok(isSequenceMonotonic("dev", 1, sessions));
  sessions.set("dev", { sequence: 1 });
  assert.ok(!isSequenceMonotonic("dev", 1, sessions));
  assert.ok(isSequenceMonotonic("dev", 2, sessions));
});

test("start cleans up after listen errors so restart succeeds", async () => {
  server = new CompanionServer();
  server.generateToken();

  let startError = null;
  try {
    await server.start(0, "256.256.256.256");
  } catch (err) {
    startError = err;
  }
  assert.ok(startError);

  const addr = await server.start(0, "127.0.0.1");
  assert.ok(addr);
  assert.ok(addr.port);
});

test("rate limiting applies even to invalid payloads", async () => {
  server = new CompanionServer();
  const token = server.generateToken();
  const addr = await server.start(0, "127.0.0.1");
  const ws = new WebSocket(toWsUrl(addr));

  await once(ws, "open");
  ws.send(JSON.stringify({ type: "auth", token }));
  await once(ws, "message"); // auth_ok

  const closePromise = new Promise((resolve, reject) => {
    ws.on("close", (code, reason) => {
      resolve({ code, reason: reason.toString() });
    });
    ws.on("error", reject);
    setTimeout(() => reject(new Error("timeout waiting for close")), 2_000);
  });

  for (let i = 0; i < 12; i += 1) {
    ws.send(
      JSON.stringify({
        type: "scan",
        payload: {
          deviceId: "dev1",
          sequence: i,
          timestamp: Date.now(),
          networks: "not-an-array", // invalid but still rate-limited
        },
      }),
    );
  }

  const result = await closePromise;
  assert.equal(result.code, 1008);
  assert.ok(result.reason.includes("Rate limit"));
});

test("sequence monotonicity resets after token regeneration", async () => {
  const received = [];
  server = new CompanionServer({
    onData: (payload) => received.push(payload),
  });
  let token = server.generateToken();
  const addr = await server.start(0, "127.0.0.1");
  const url = toWsUrl(addr);

  const sendScan = async (tokenToUse, seq) => {
    const ws = new WebSocket(url);
    await once(ws, "open");
    ws.send(JSON.stringify({ type: "auth", token: tokenToUse }));
    await once(ws, "message"); // auth_ok
    ws.send(
      JSON.stringify({
        type: "scan",
        payload: {
          deviceId: "dev1",
          sequence: seq,
          timestamp: Date.now(),
          networks: [],
        },
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    ws.close();
    await once(ws, "close");
  };

  await sendScan(token, 1);

  token = server.generateToken();
  await sendScan(token, 1);

  assert.equal(received.length, 2);
  assert.equal(received[0].sequence, 1);
  assert.equal(received[1].sequence, 1);
});
