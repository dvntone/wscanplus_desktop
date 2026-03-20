# SESSION_STATE

Repo: https://github.com/dvntone/wscanplus_desktop
Name: wscan+ Desktop Hub
Audience: operator desktop companion for the Android scanner app

---

## Purpose

- Linux-first Electron desktop companion for the `wscanplus` Android app
- Current scope is scaffold hardening, local verification, and documentation clarity
- ADB transport and scan orchestration remain deferred work

---

## Locked decisions

- Electron 41.0.x
- Node.js ESM only
- All `package.json` files must keep `"type": "module"`
- Exact dependency pins only; no `^` or `+`
- No CommonJS workarounds unless explicitly approved
- No Capacitor
- Squash merge only

---

## Current main-branch state (2026-03-20)

- `main` includes:
  - initial Electron scaffold
  - repo guardrails in `CLAUDE.md`
  - dependency/CI hardening from PR `#4`
  - system-`adb` preflight UI for device detection / authorization checks
  - readiness-state classification for missing adb, no devices, unauthorized devices, offline devices, and ready devices
- CI now runs:
  - `npm ci`
  - `npm test`
  - `npm run lint`
- Local hardening verification on 2026-03-20:
  - `npm ci`
  - `npm test`
  - `npm run lint`
  - `npm audit --json`
- `npm audit` is clean (`0` vulnerabilities) after upgrading `electron-builder` to `26.8.1`
- adb workflow and Android beta-device notes are documented in `docs/ADB_WORKFLOW.md`

---

## Current file roles

- `src/main.mjs` — Electron main process with hardened `BrowserWindow` defaults
- `src/preload.mjs` — minimal preload bridge plus ADB preflight IPC surface
- `src/index.html` — static shell with ADB preflight entry point
- `src/adb-preflight.mjs` — pure parser/summarizer for `adb devices -l` output
- `src/renderer.mjs` — minimal renderer for local ADB preflight feedback and operator guidance
- `test/scaffold.test.mjs` — baseline regression tests for ESM-only package shape, secure window defaults, and ADB preflight parsing
- `.github/workflows/ci.yml` — minimal CI gate for install, test, and lint
- `CLAUDE.md` — repo-local agent rules and workflow constraints

---

## Deferred work

### Phase 3+ desktop work

- Evaluate native ESM-safe ADB transport library options before adding any ADB package
- `@u4/adbkit` remains deferred because it is CJS-only
- Tango ADB is the preferred future evaluation candidate
- No scan orchestration UI, no live Android bridge, and no local web dashboard yet
- Current desktop ADB scope is limited to preflight only: no device selection, no install flow, no port forwarding, and no shell orchestration yet
- Current preflight guidance explicitly classifies: adb missing, no devices, unauthorized, offline, and ready
- Future desktop ADB implementation should start from the validated host-side command set in `docs/ADB_WORKFLOW.md`
- Newer Pixel devices may run with Advanced Protection enabled and a built-in Linux terminal VM present; neither should be treated as edge-case-only

### Quality / architecture follow-ups

- Add Electron startup smoke coverage if the repo later adopts a GUI-capable CI strategy
- Add packaging validation once desktop release targets are defined
- Add docs for environment variables and runtime modes as real desktop features land

---

## Session handoff guidance

- Start with `CLAUDE.md`, then this file
- For Android bridge work, read `docs/ADB_WORKFLOW.md` before evaluating transport libraries
- Prefer small PRs tied to a single issue
- Keep changes traceable and avoid mixing dependency work with feature work
- If a future audit flags vulnerabilities again, re-run `npm audit --json` **after** install has fully completed; do not trust results captured concurrently with package installation
