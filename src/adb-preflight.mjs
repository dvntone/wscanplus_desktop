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

export function summarizePreflight(versionOutput, devicesOutput) {
  const adbVersion = versionOutput.split(/\r?\n/)[0]?.trim() ?? "";
  const devices = parseAdbDevices(devicesOutput);

  return {
    ok: true,
    adbVersion,
    devices,
  };
}
