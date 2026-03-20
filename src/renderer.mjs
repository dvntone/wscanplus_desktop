const statusElement = document.getElementById("status");
const runButton = document.getElementById("run-preflight");
const deviceList = document.getElementById("device-list");

function clearDeviceList() {
  while (deviceList.firstChild) {
    deviceList.removeChild(deviceList.firstChild);
  }
}

function renderDevices(devices) {
  clearDeviceList();

  for (const device of devices) {
    const item = document.createElement("li");
    const parts = [
      device.model || "Unknown model",
      `state=${device.state}`,
    ];

    if (device.product) {
      parts.push(`product=${device.product}`);
    }

    if (device.device) {
      parts.push(`device=${device.device}`);
    }

    item.textContent = parts.join(" | ");
    deviceList.appendChild(item);
  }
}

async function runPreflight() {
  statusElement.textContent = "Running ADB preflight...";
  runButton.disabled = true;
  clearDeviceList();

  try {
    const result = await window.wscan.runAdbPreflight();

    if (!result.ok) {
      statusElement.textContent = result.error;
      return;
    }

    if (result.devices.length === 0) {
      statusElement.textContent = `${result.adbVersion} | No Android devices detected.`;
      return;
    }

    statusElement.textContent = `${result.adbVersion} | ${result.devices.length} device(s) detected.`;
    renderDevices(result.devices);
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener("click", () => {
  void runPreflight();
});
