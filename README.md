# wscan+ Desktop Hub

Linux-first Electron desktop companion for the wscan+ Android app.

## Session Bootstrap

Read these first when resuming work:

- [CLAUDE.md](CLAUDE.md)
- [docs/SESSION_STATE.md](docs/SESSION_STATE.md)
- [docs/ADB_WORKFLOW.md](docs/ADB_WORKFLOW.md)

## Setup

```bash
nvm use
npm ci
npm test
npm run lint
npm start
```

## Current Desktop Slice

The desktop app now includes a minimal ADB preflight path:

- checks that the system `adb` CLI is available
- starts the adb server if needed
- lists connected Android devices and their authorization state
- classifies onboarding state for missing adb, no devices, unauthorized, offline, and ready
- checks whether `com.wscanplus.app` is installed on authorized devices

This uses the host `adb` binary through Electron main-process `spawn()` and does not add any npm ADB library yet.
