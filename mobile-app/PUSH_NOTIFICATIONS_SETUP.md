# iOS Push Notifications Setup with EAS Build

## Current Issue
The error `no valid "aps-environment" entitlement string found for application` occurs because:
1. Push notifications require proper iOS credentials
2. Expo Go doesn't support push notifications - you need a development build
3. The app needs to be built with push notification entitlements

## Solution: Create a Development Build with EAS

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to your Expo account
```bash
eas login
```

### Step 3: Configure EAS Build (if not already done)
```bash
cd mobile-app
eas build:configure
```

### Step 4: Trigger a new iOS build with push notifications
```bash
eas build --profile development --platform ios
```

This will:
- Automatically generate push notification credentials
- Create an iOS build with proper entitlements
- Upload the build to EAS servers

### Step 5: Check your credentials
Visit your project credentials page:
https://expo.dev/accounts/halfjew22/projects/mobile-app/credentials?platform=ios

You should see:
- Push Notification Key (automatically created during build)
- Provisioning Profile with push notification capability

### Step 6: Install the development build on your device
1. Wait for the build to complete (you'll get an email)
2. Download the build from the EAS dashboard
3. Install it on your iOS device:
   - For simulators: Drag and drop the .app file
   - For physical devices: Use TestFlight or install directly

### Step 7: Run the development build
```bash
# Start the development server
cd mobile-app
npx expo start --dev-client

# Scan the QR code with your device that has the development build installed
```

## Testing Push Notifications

Once you have the development build installed:

1. **Open the app** on your iOS device (the development build, not Expo Go)

2. **Navigate to Conversations screen**
   - The app will request notification permissions
   - Grant the permissions

3. **Verify token is saved**
   - Check the console for: `✅ Push token saved to database`

4. **Send a test notification**:
   ```bash
   cd ..  # Go back to project root
   npx tsx test-push-notification.ts
   ```

## What's Already Implemented

✅ **Server-side (test-push-notification.ts)**:
- Uses Expo Server SDK
- Fetches all device tokens from database
- Sends notifications to all registered devices
- Handles errors and checks receipts

✅ **Client-side (conversations.tsx)**:
- Requests notification permissions
- Obtains push token
- Saves token to InstantDB with device info
- Shows push notification status in UI

## Troubleshooting

### If you still get the entitlement error:
1. Make sure you're using the development build, not Expo Go
2. Rebuild with `eas build --clear-cache --profile development --platform ios`
3. Check that push notifications are enabled in your Apple Developer account

### If notifications don't appear:
1. Check that the device has internet connection
2. Ensure notifications are enabled in iOS Settings > Your App > Notifications
3. Check the test script output for any errors
4. Notifications appear in Notification Center if app is in foreground

## Quick Test Without Building

To test the server-side logic without a proper build, you can manually add a test token:

```bash
npx tsx -e "
import { init } from '@instantdb/core';
const db = init({ appId: '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad' });
await db.transact([
  db.tx.devices['test-device'].update({
    pushToken: 'ExponentPushToken[YOUR_TOKEN_HERE]',
    platform: 'ios',
    updatedAt: Date.now(),
    createdAt: Date.now(),
  }),
]);
console.log('Test token saved!');
process.exit(0);
"
```

Then run the test script to verify the server-side logic works.

## Resources
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Your Project Credentials](https://expo.dev/accounts/halfjew22/projects/mobile-app/credentials?platform=ios)
- [Expo Notifications with EAS Video](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)