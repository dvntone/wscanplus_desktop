const statusElement = document.getElementById("status");
const guidanceElement = document.getElementById("guidance");
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

    if (device.companion?.status && device.companion.status !== "unchecked") {
      parts.push(`companion=${device.companion.status}`);
    }

    item.textContent = parts.join(" | ");
    deviceList.appendChild(item);
  }
}

async function runPreflight() {
  statusElement.textContent = "Running ADB preflight...";
  guidanceElement.textContent = "";
  runButton.disabled = true;
  clearDeviceList();

  try {
    const result = await window.wscan.runAdbPreflight();
    const classification = result.classification;

    if (!result.ok) {
      statusElement.textContent = classification.title;
      guidanceElement.textContent = `${classification.guidance} ${result.error}`;
      return;
    }

    statusElement.textContent = `${result.adbVersion} | ${classification.title}`;
    guidanceElement.textContent = classification.guidance;
    renderDevices(result.devices);
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener("click", () => {
  void runPreflight();
});
