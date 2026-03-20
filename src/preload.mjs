import { contextBridge } from "electron";
import { ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("wscan", {
  version: "0.1.0",
  runAdbPreflight: () => ipcRenderer.invoke("adb:preflight"),
});
