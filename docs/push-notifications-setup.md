# Push Notifications Setup Guide for iOS

## Current Status
✅ Server-side code is ready (using Expo Server SDK)
✅ Client-side code is ready (saves tokens to database)
❌ App needs proper entitlements (requires development build)

## The Issue
The error `no valid "aps-environment" entitlement string found for application` means the app needs to be built with push notification capabilities enabled. This cannot be done with Expo Go - you need a development build.

## Solution: Create a Development Build

### Option 1: EAS Build (Recommended)
1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS** (if not already done):
   ```bash
   cd mobile-app
   eas build:configure
   ```

3. **Create a development build for iOS**:
   ```bash
   eas build --profile development --platform ios
   ```

4. **Install the build on your device**:
   - Download the build from the EAS dashboard
   - Install it on your iOS device using TestFlight or direct installation

### Option 2: Local Development Build
1. **Ensure you have Xcode installed**

2. **Run prebuild**:
   ```bash
   cd mobile-app
   npx expo prebuild --platform ios
   ```

3. **Open in Xcode**:
   ```bash
   open ios/*.xcworkspace
   ```

4. **Enable Push Notifications**:
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Click "+" and add "Push Notifications"
   - Ensure you have a valid provisioning profile

5. **Build and run on your device**:
   ```bash
   npx expo run:ios --device
   ```

## Testing After Setup

Once you have a development build with push notifications enabled:

1. **Open the app on your iOS device**
2. **Navigate to Conversations screen**
3. **Grant notification permissions**
4. **Check the console** - you should see:
   ```
   📱 Push token obtained: ExponentPushToken[...]
   ✅ Push token saved to database: ExponentPushToken[...]
   ```

5. **Run the test script**:
   ```bash
   npx tsx test-push-notification.ts
   ```

## Temporary Workaround (Testing without notifications)

If you want to test the token flow without actual notifications:

1. The push token IS being obtained (as shown in your logs)
2. You can manually save a test token to the database:
   ```bash
   npx tsx -e "
   import { init } from '@instantdb/core';
   const db = init({ appId: '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad' });
   await db.transact([
     db.tx.devices['test-device'].update({
       pushToken: 'ExponentPushToken[1DOgTzI8eDs2D3Jb4NbCQ8]',
       platform: 'ios',
       updatedAt: Date.now(),
       createdAt: Date.now(),
     }),
   ]);
   console.log('Test token saved!');
   "
   ```

3. Then test the notification sending logic (it will attempt to send but may fail without proper entitlements)

## Next Steps

1. **For production**: You'll need an Apple Developer account ($99/year) to enable push notifications
2. **For development**: EAS Build offers free builds for development
3. **Alternative**: Use a physical device with a development build instead of Expo Go

## Resources
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)