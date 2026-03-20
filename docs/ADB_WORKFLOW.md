# ADB Workflow Notes

## Purpose

Capture the proven adb command flow and platform notes needed for future desktop bridge work.

Use generic placeholders only in docs:

- `<device-serial>`
- `<package>`
- `<component>`

Do not record real serials, stable Android IDs, or other persistent device identifiers in tracked files.

## Current validated host-side commands

These commands were used successfully during Android 14, 15, and latest-beta Pixel validation.

### Device discovery

```bash
adb devices -l
adb -s <device-serial> shell getprop ro.product.model
adb -s <device-serial> shell getprop ro.build.version.release
adb -s <device-serial> shell getprop ro.build.version.sdk
adb -s <device-serial> shell getprop ro.build.version.codename
```

### Runtime permission state

```bash
adb -s <device-serial> shell pm path com.wscanplus.app
adb -s <device-serial> shell pm grant <package> android.permission.ACCESS_FINE_LOCATION
adb -s <device-serial> shell pm grant <package> android.permission.ACCESS_COARSE_LOCATION
adb -s <device-serial> shell pm grant <package> android.permission.NEARBY_WIFI_DEVICES
adb -s <device-serial> shell pm grant <package> android.permission.ACCESS_BACKGROUND_LOCATION
adb -s <device-serial> shell dumpsys package <package>
adb -s <device-serial> shell cmd appops get <package>
```

### Device state checks

```bash
adb -s <device-serial> shell settings get global wifi_scan_always_enabled
adb -s <device-serial> shell settings get secure location_mode
adb -s <device-serial> shell dumpsys window policy
adb -s <device-serial> shell dumpsys activity activities
adb -s <device-serial> shell dumpsys activity services <component>
```

### Test-state toggles

```bash
adb -s <device-serial> shell settings put secure location_mode 3
adb -s <device-serial> shell settings put secure location_mode 0
adb -s <device-serial> shell svc wifi enable
adb -s <device-serial> shell svc wifi disable
adb -s <device-serial> shell input keyevent KEYCODE_WAKEUP
adb -s <device-serial> shell input keyevent KEYCODE_SLEEP
adb -s <device-serial> shell input keyevent KEYCODE_HOME
adb -s <device-serial> shell am start -n <component>
adb -s <device-serial> shell am start -a android.intent.action.MAIN -c android.intent.category.HOME
```

### Wi-Fi scan checks

```bash
adb -s <device-serial> shell cmd wifi start-scan
adb -s <device-serial> shell cmd wifi list-scan-results
adb -s <device-serial> logcat -c
adb -s <device-serial> logcat -d
```

### High-value log filters

```bash
adb -s <device-serial> logcat -d | grep -E "WifiService|WatchdogService|StandardScanner|ScannerChain|getScanResults|Permission violation|Threats:"
```

On Windows PowerShell the equivalent filter used during validation was:

```powershell
adb -s <device-serial> logcat -d | Select-String "WifiService|WatchdogService|StandardScanner|ScannerChain|getScanResults|Permission violation|Threats:"
```

## Operational lessons from device validation

### 1. Check `location_mode` before concluding the app is broken

This mattered repeatedly during Android device testing.

- `location_mode=0` can produce the same practical outcome as an app-side scan failure.
- A clean matrix should verify device-wide location mode before interpreting `getScanResults()` errors.

### 2. Foreground-service survival is not enough by itself

The Android app required:

- `ACCESS_BACKGROUND_LOCATION`
- a location-typed foreground service

to restore background and secure-keyguard scan access on tested Android 14 and 15 devices.

Desktop bridge work should assume that scan availability depends on app permission state and device mode, not only on adb connectivity.

### 3. OEM differences remain real

- Some devices expose app-side log tags cleanly over adb.
- Others still show mostly framework-side `WifiService` evidence.
- Shell `cmd wifi list-scan-results` behavior can also differ by OEM and state.

Desktop tooling should preserve raw command output and not assume one uniform logging path.

## Latest beta Pixel notes

Latest connected beta-track Pixel validation reported over adb:

- `ro.product.model=Pixel 10 Pro XL`
- `ro.build.version.sdk=36`
- `ro.build.version.codename=CinnamonBun`

Treat the beta label and the adb-reported values as separate facts in future notes unless the platform naming is independently confirmed.

## Advanced Protection implications

Official Android 16+ guidance introduces app-visible Advanced Protection state and tighter device protection posture.

Relevant implications for desktop bridge work:

- apps can detect whether Advanced Protection is enabled and should adapt risky flows accordingly
- USB protection and anti-theft protections can make locked-device data access less predictable
- sideloading and unsafe-install paths are intentionally more constrained
- future desktop pairing/setup docs should assume the operator may need to unlock the device and explicitly trust the host before adb is usable

This is not automatically hostile to adb-based testing, but it raises the baseline expectation that locked-state and trust-state matter more on newer Pixels.

## Linux terminal implications

Android's built-in Linux terminal is not the desktop bridge target.

Current official architecture is a Debian-based virtual machine hosted on Android virtualization infrastructure.

Implications:

- useful for on-device operator utilities and inspection
- not a replacement for the host desktop Electron app
- may be useful later for advanced operator workflows, but it should be treated as a separate environment with its own filesystem, package set, and networking behavior
- desktop bridge design should still assume the primary adb host is an external Linux desktop

## Official references

- Android Advanced Protection help: <https://support.google.com/android/answer/16339980>
- Android developer guide for integrating with Advanced Protection mode: <https://developer.android.com/security/fraud-protection/advanced-protection-mode>
- Android Terminal app / Linux VM overview: <https://source.android.com/docs/core/virtualization/terminal>
