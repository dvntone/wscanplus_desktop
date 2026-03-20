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
});
