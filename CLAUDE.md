# CLAUDE.md

## Project: wscan+ Desktop Hub

Linux-first Electron desktop companion for the wscan+ Android app.

## Architecture

- Electron 41.0.x, Node.js ESM only
- All `package.json` files must have `"type": "module"`. No CommonJS.
- Exact version pins only (no `^` or `+` prefixes)

## Hard Rules

- NEVER hardcode `localhost:3000` — use `process.env`
- NEVER use `app.use(cors())` without an origin whitelist
- NEVER use `innerHTML` with user-controlled data
- NEVER add `^` or `+` prefixes to dependency versions
- NEVER add Capacitor
- Squash merge only — merge commits and rebase disabled
- 1 PR open at a time across all agents

## ADB Transport (deferred)

- `@u4/adbkit` is CJS-only — incompatible without `createRequire` shim
- Tango ADB to be evaluated for ESM compatibility before any adbkit is added
- ya-webadb reserved for future web dashboard only

## AI Split (locked)

- Claude / Copilot = coding agents
- Desktop uses `ANTHROPIC_API_KEY` from `.env`

## Workflow

1. Create branch: `git checkout -b claude/<name>` or `copilot/<name>`
2. Make changes, commit
3. Push: `git push -u origin <branch>`
4. Open PR: `gh pr create ...`
5. Run `npm test` and `npm run lint`, then wait for CI to pass
6. Merge: `gh pr merge --admin --squash`
7. Sync: `git checkout main && git pull origin main`

## Required checks before merge

- `npm test`
- `npm run lint`
- `npm audit --json` when dependency changes are part of the PR
