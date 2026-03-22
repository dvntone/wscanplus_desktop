# RF / CAM Sweep Tool

Static browser build of the SweepTool UI.

## Why this version
- No Node.js required
- No local build step
- Works well for Android/browser-first use
- Easy to host on GitHub Pages or any static host

## Files
- `index.html` – loads pinned React 18.3.1 / ReactDOM 18.3.1 / Babel 7.26.3 from `vendor/` and mounts the app
- `app.js` – SweepTool React component rendered to `#root`
- `vendor/` – UMD bundles vendored locally for offline/static hosting

## Notes
- Clipboard works best on HTTPS-hosted pages
- Opening local files directly may limit clipboard behavior
