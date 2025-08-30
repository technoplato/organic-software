# iOS Device Setup for Development

## Current Device Status
- Device: Michael Lustig Phone (iPhone 14 Pro)
- UDID: 00008120-000660690278C01E
- State: Connected and paired

## Setup Steps

### 1. Prepare Device in Xcode
1. Open Xcode (already opened via workspace)
2. Go to **Window → Devices and Simulators** (or press Shift+Cmd+2)
3. Select your iPhone in the left sidebar
4. If you see "Preparing Device for Development", wait for it to complete
5. If prompted on iPhone, tap "Trust This Computer" and enter passcode

### 2. Enable Developer Mode on iPhone (iOS 16+)
On your iPhone:
1. Go to **Settings → Privacy & Security**
2. Scroll down to **Developer Mode**
3. Toggle it ON
4. Your phone will restart
5. After restart, unlock and confirm enabling Developer Mode

### 3. Verify Development Team
In Xcode:
1. Select the project in navigator
2. Select "mobileapp" target
3. Go to "Signing & Capabilities" tab
4. Ensure "Automatically manage signing" is checked
5. Team should be set to your Apple Developer account

## Running the App

### Option 1: Via Expo CLI
```bash
cd mobile-app
npx expo run:ios --device "00008120-000660690278C01E"
```

### Option 2: Via Helper Script
```bash
./mobile-app/run-on-device.sh
```

### Option 3: Via Xcode
1. Select your device in the device selector (top bar)
2. Press the Play button (Cmd+R)

## Common Issues

### "Device needs to be prepared for development"
- Unlock your iPhone
- Open Xcode and wait for preparation to complete
- Trust the computer when prompted

### "Developer Mode disabled"
- Enable Developer Mode in Settings (see step 2 above)

### "No provisioning profile"
- Ensure you're signed into Xcode with your Apple ID
- Let Xcode automatically manage signing

### "Device is busy"
- Disconnect and reconnect the USB cable
- Restart the iPhone
- Restart Xcode

## Verification Commands

Check device connection:
```bash
xcrun devicectl list devices
```

Check Xcode selected device:
```bash
xcodebuild -showBuildSettings -workspace ios/mobileapp.xcworkspace -scheme mobileapp | grep TARGETED_DEVICE