# 2026-03-20 Desktop Review Triage

## Purpose

This note records the desktop-side findings from a cross-repo review pass so future Claude/Codex sessions can treat them as established context instead of rediscovering them.

Primary sources used:

- Electron security checklist: [electronjs.org/docs/latest/tutorial/security](https://www.electronjs.org/docs/latest/tutorial/security)
- Electron process sandboxing: [electronjs.org/docs/latest/tutorial/sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox)
- Electron context isolation: [electronjs.org/docs/latest/tutorial/context-isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

## Finding D1. Electron shell is only partially hardened

Who:

- `wscanplus_desktop` main process and static renderer shell
- any future agent working on Electron security, preload exposure, or renderer expansion

What:

- The current `BrowserWindow` sets `contextIsolation: true` and `nodeIntegration: false`, which is good.
- The app does not explicitly set `sandbox: true`.
- The static renderer HTML does not define a Content Security Policy.

Where:

- [src/main.mjs](/Users/Devia/Documents/GitHub/wscanplus_desktop/src/main.mjs)
- [src/index.html](/Users/Devia/Documents/GitHub/wscanplus_desktop/src/index.html)
- [test/scaffold.test.mjs](/Users/Devia/Documents/GitHub/wscanplus_desktop/test/scaffold.test.mjs)

Why this matters:

- Electron's security checklist recommends both context isolation and process sandboxing, and also recommends a restrictive CSP.
- The repo currently describes the BrowserWindow defaults as "hardened" and tests only for `contextIsolation` and `nodeIntegration`, so future agents could overestimate the current defense level.

Direct evidence:

- `src/main.mjs` sets `contextIsolation: true` and `nodeIntegration: false`.
- `src/main.mjs` does not contain an explicit `sandbox: true` setting.
- `src/index.html` does not contain a CSP meta tag.
- `test/scaffold.test.mjs` enforces `contextIsolation` and `nodeIntegration`, but not `sandbox` or CSP.

Repo-doc status:

- Partially documented in [docs/SESSION_STATE.md](/Users/Devia/Documents/GitHub/wscanplus_desktop/docs/SESSION_STATE.md) as "hardened BrowserWindow defaults".
- Not documented as a remaining hardening gap.
- No CSP note exists in current desktop docs.

Assessment:

- Defense-in-depth issue, not a proven exploit in the current minimal UI.
- Better handled before the renderer grows beyond the current preflight shell.

Status update:

- Resolved on 2026-03-20 in PR `#22`.
- Merged as commit `47922b827ed54bcfc43b037cc55e3d352aab4c6b`.
- Copilot review requested removal of `'unsafe-inline'` from the initial CSP and stronger test assertions; both were applied before merge.

Recommended next step:

1. Preserve explicit `sandbox: true` in `BrowserWindow`.
2. Preserve a restrictive CSP for the static renderer shell.
3. Keep `test/scaffold.test.mjs` enforcing both expectations.
4. Re-verify preload compatibility if future renderer work changes the bridge surface.

Priority:

- `Resolved`

## Verification status

Verified locally on March 20, 2026:

- `npm test` passed
- `npm run lint` passed

This note is documentation only. No desktop code changes were made as part of this review pass.
