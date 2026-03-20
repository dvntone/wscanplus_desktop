export function parseAdbDevices(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices attached"))
    .map((line) => {
      const segments = line.split(/\s+/);
      const [serial = "", state = "unknown", ...details] = segments;
      const metadata = Object.fromEntries(
        details
          .filter((segment) => segment.includes(":"))
          .map((segment) => {
            const separatorIndex = segment.indexOf(":");
            return [
              segment.slice(0, separatorIndex),
              segment.slice(separatorIndex + 1),
            ];
          }),
      );

      return {
        serial,
        state,
        model: metadata.model ?? "",
        product: metadata.product ?? "",
        device: metadata.device ?? "",
      };
    });
}

export const PRELIGHT_CLASSIFICATIONS = {
  adbMissing: {
    level: "adb-missing",
    title: "ADB unavailable",
    guidance:
      "Install Android Platform Tools and ensure `adb` is on your PATH before continuing.",
  },
  preflightFailed: {
    level: "preflight-failed",
    title: "ADB preflight failed",
    guidance:
      "ADB appears to be installed, but a preflight command failed. Check that the ADB server can start, that devices are connected and authorized, and that you have permission to run `adb`.",
  },
  noDevices: {
    level: "no-devices",
    title: "No Android devices detected",
    guidance:
      "Connect a device over USB, enable USB debugging, and confirm the desktop is an allowed host.",
  },
  unauthorized: {
    level: "unauthorized",
    title: "Device authorization required",
    guidance:
      "Unlock the device, accept the USB debugging prompt, and use 'Always allow from this computer' on trusted systems.",
  },
  offline: {
    level: "offline",
    title: "ADB device offline",
    guidance:
      "Reconnect the USB cable, verify USB debugging stays enabled, and retry the preflight.",
  },
  ready: {
    level: "ready",
    title: "ADB ready",
    guidance:
      "At least one device is connected and authorized. The desktop can proceed to later companion checks.",
  },
  notReady: {
    level: "not-ready",
    title: "ADB devices not ready",
    guidance:
      "Connected devices are not in a normal ADB session state. Put at least one device into the OS with USB debugging enabled and retry.",
  },
};

export function classifyPreflight(result) {
  if (result.ok === false) {
    return result.classification ?? PRELIGHT_CLASSIFICATIONS.adbMissing;
  }

  const devices = Array.isArray(result.devices) ? result.devices : [];

  if (devices.length === 0) {
    return PRELIGHT_CLASSIFICATIONS.noDevices;
  }

  if (devices.some((device) => device.state === "unauthorized")) {
    return PRELIGHT_CLASSIFICATIONS.unauthorized;
  }

  if (devices.some((device) => device.state === "offline")) {
    return PRELIGHT_CLASSIFICATIONS.offline;
  }

  if (devices.some((device) => device.state === "device")) {
    return PRELIGHT_CLASSIFICATIONS.ready;
  }

  return PRELIGHT_CLASSIFICATIONS.notReady;
}

export function summarizePreflight(versionOutput, devicesOutput) {
  const adbVersion = versionOutput.split(/\r?\n/)[0]?.trim() ?? "";
  const devices = parseAdbDevices(devicesOutput);
  const summary = {
    ok: true,
    adbVersion,
    devices,
  };

  return {
    ...summary,
    classification: classifyPreflight(summary),
  };
}
