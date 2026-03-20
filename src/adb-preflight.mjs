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

export function classifyPreflight(result) {
  if (result.ok === false) {
    return {
      level: "adb-missing",
      title: "ADB unavailable",
      guidance:
        "Install Android Platform Tools and ensure `adb` is on your PATH before continuing.",
    };
  }

  const { devices } = result;

  if (devices.length === 0) {
    return {
      level: "no-devices",
      title: "No Android devices detected",
      guidance:
        "Connect a device over USB, enable USB debugging, and confirm the desktop is an allowed host.",
    };
  }

  if (devices.some((device) => device.state === "unauthorized")) {
    return {
      level: "unauthorized",
      title: "Device authorization required",
      guidance:
        "Unlock the device, accept the USB debugging prompt, and use 'Always allow from this computer' on trusted systems.",
    };
  }

  if (devices.some((device) => device.state === "offline")) {
    return {
      level: "offline",
      title: "ADB device offline",
      guidance:
        "Reconnect the USB cable, verify USB debugging stays enabled, and retry the preflight.",
    };
  }

  return {
    level: "ready",
    title: "ADB ready",
    guidance:
      "At least one device is connected and authorized. The desktop can proceed to later companion checks.",
    };
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
