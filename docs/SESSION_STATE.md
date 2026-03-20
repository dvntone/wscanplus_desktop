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
- CI now runs:
  - `npm ci`
  - `npm test`
  - `npm run lint`
- Local hardening verification on 2026-03-20:
  - `npm install`
  - `npm test`
  - `npm run lint`
  - `npm audit --json`
- `npm audit` is clean (`0` vulnerabilities) after upgrading `electron-builder` to `26.8.1`

---

## Current file roles

- `src/main.mjs` — Electron main process with hardened `BrowserWindow` defaults
- `src/preload.mjs` — minimal preload bridge
- `src/index.html` — static shell only
- `test/scaffold.test.mjs` — baseline regression tests for ESM-only package shape and secure window defaults
- `.github/workflows/ci.yml` — minimal CI gate for install, test, and lint
- `CLAUDE.md` — repo-local agent rules and workflow constraints

---

## Deferred work

### Phase 3+ desktop work

- Evaluate native ESM-safe ADB transport library options before adding any ADB package
- `@u4/adbkit` remains deferred because it is CJS-only
- Tango ADB is the preferred future evaluation candidate
- No scan orchestration UI, no live Android bridge, and no local web dashboard yet

### Quality / architecture follow-ups

- Add Electron startup smoke coverage if the repo later adopts a GUI-capable CI strategy
- Add packaging validation once desktop release targets are defined
- Add docs for environment variables and runtime modes as real desktop features land

---

## Session handoff guidance

- Start with `CLAUDE.md`, then this file
- Prefer small PRs tied to a single issue
- Keep changes traceable and avoid mixing dependency work with feature work
- If a future audit flags vulnerabilities again, re-run `npm audit --json` **after** install has fully completed; do not trust results captured concurrently with package installation
