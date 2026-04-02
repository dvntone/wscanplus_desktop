import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("wscan", {
  version: "0.1.0",

  // --- ADB ---

  runAdbPreflight: () =>
    ipcRenderer.invoke("adb:preflight"),

  // --- Scanner ---

  /** Start the scan loop. Pass an interface name or omit to auto-detect. */
  startScan: (iface) =>
    ipcRenderer.invoke("scan:start", iface),

  stopScan: () =>
    ipcRenderer.invoke("scan:stop"),

  /** Trigger one immediate scan cycle (single-flight shared with the loop). */
  manualScan: () =>
    ipcRenderer.invoke("scan:manual"),

  /** Returns { scanning, interface, scanIntervalMs, apCount, riskCount }. */
  getScanState: () =>
    ipcRenderer.invoke("scan:state"),

  /** Returns { ok, interfaces[] } listing available wireless interfaces. */
  getInterfaces: () =>
    ipcRenderer.invoke("scan:interfaces"),

  // --- Companion ---

  /** Generate a pairing token and start the companion WebSocket server. */
  pairCompanion: () =>
    ipcRenderer.invoke("companion:pair"),

  /** Returns { running, address, token }. */
  getCompanionStatus: () =>
    ipcRenderer.invoke("companion:status"),

  // --- Push events (main → renderer) ---
  // Each on* registers a listener for a fixed channel and returns a cleanup
  // function. Call the returned function to remove the listener.

  /** Fired after each scan cycle with the full AP array. */
  onAps: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("scan:aps", handler);
    return () => ipcRenderer.removeListener("scan:aps", handler);
  },

  /** Fired when the risk log changes (flagged APs only). */
  onRiskLog: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("scan:risklog", handler);
    return () => ipcRenderer.removeListener("scan:risklog", handler);
  },

  /** Fired when scanning starts, stops, or the interval changes. */
  onScanState: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("scan:statechange", handler);
    return () => ipcRenderer.removeListener("scan:statechange", handler);
  },

  /** Fired when an authenticated Android companion sends a scan payload. */
  onCompanionUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("companion:update", handler);
    return () => ipcRenderer.removeListener("companion:update", handler);
  },

  /** Fired when the main process records a non-fatal error. */
  onAppError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("app:error", handler);
    return () => ipcRenderer.removeListener("app:error", handler);
  },
});
