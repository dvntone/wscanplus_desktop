import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("wscan", { version: "0.1.0" });
