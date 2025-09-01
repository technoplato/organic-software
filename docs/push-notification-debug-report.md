# Push Notification Debug Report

## Current Status Summary

### ✅ What's Working:
1. **Client-side code** - The mobile app correctly:
   - Requests push notification permissions
   - Generates an Expo push token
   - Saves the token to InstantDB database
   - Token found: `ExponentPushToken[83MXeMIUvyFEQEvACoI8MQ]`

2. **Server-side code** - The notification system correctly:
   - Fetches tokens from the database
   - Sends notifications via Expo's API
   - Receives tickets successfully
   - Checks receipts for delivery status

3. **Database integration** - InstantDB correctly:
   - Stores device information and push tokens
   - Device registered at: 8/31/2025, 12:36:01 PM

### ❌ What's Not Working:
1. **Push Notification Delivery** - Error: `BadDeviceToken`
   - Apple's APNs rejected the token with status code 400
   - This indicates the token is not associated with valid push credentials

## Root Cause Analysis

The `BadDeviceToken` error occurs because:

1. **Missing Push Notification Entitlements**: The app doesn't have the required `aps-environment` entitlement
2. **Development Build Required**: Push notifications cannot work in:
   - Expo Go app
   - iOS Simulator (for remote notifications)
   - Apps without proper provisioning profiles

## Solution: Create a Development Build

You need to create a development build with push notification capabilities. Here are your options:

### Option 1: EAS Build (Recommended)
```bash
# From the mobile-app directory
cd mobile-app

# Create a development build for physical iOS device
eas build --profile development --platform ios

# Or for simulator (local notifications only)
eas build --profile development-simulator --platform ios
```

**Note**: There's currently an SSL certificate issue with EAS CLI on your machine. To fix this:
```bash
# Try setting Node to ignore certificate errors temporarily
export NODE_TLS_REJECT_UNAUTHORIZED=0
eas build --profile development --platform ios

# Or update certificates
npm config set strict-ssl false
```

### Option 2: Local Development Build
```bash
cd mobile-app

# Generate native iOS project
npx expo prebuild --platform ios

# Open in Xcode
open ios/*.xcworkspace

# In Xcode:
# 1. Select your project
# 2. Go to "Signing & Capabilities"
# 3. Add "Push Notifications" capability
# 4. Build and run on your device
```

### Option 3: Use TestFlight
If you have an existing build:
1. Upload to TestFlight
2. Ensure push notifications are enabled in App Store Connect
3. Install via TestFlight on your device

## Quick Verification Steps

Once you have a development build installed:

1. **Verify the build type**:
   - Open the app (NOT Expo Go)
   - Check that it's your custom development build

2. **Re-register the device**:
   ```bash
   # Clear old tokens
   npx tsx -e "
   import { init } from '@instantdb/core';
   const db = init({ appId: '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad' });
   await db.transact(db.tx.devices['049cc493-6431-480c-8848-411bcb74f042'].delete());
   console.log('Cleared old device token');
   "
   ```

3. **Open the app and navigate to Conversations**:
   - Grant notification permissions
   - Check console for new token registration

4. **Test with the new token**:
   ```bash
   # Check for new device
   npx tsx check-devices.ts
   
   # Update send-push-to-token.ts with new token
   # Then test
   npx tsx send-push-to-token.ts
   ```

## Alternative Testing Methods

### Test with Expo's Push Tool
While waiting for a proper build, you can test the token directly:
```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[83MXeMIUvyFEQEvACoI8MQ]",
  "title": "Test",
  "body": "Testing push notifications"
}'
```

### Expected Error Response
You'll get the same `BadDeviceToken` error until you have a proper development build.

## Current Configuration Review

### app.json ✅
- Has `expo-notifications` plugin configured
- Has proper bundle identifier: `ai.mycel.organic-software`
- Has EAS project ID: `2ec7cfb8-9161-4998-b8e2-c0c71aedf1aa`

### eas.json ✅
- Development profile configured for physical devices
- Development-simulator profile available for simulator testing

### Code Implementation ✅
- Push token registration in `conversations.tsx`
- Notification handler configured
- Server-side sending logic implemented

## Next Steps

1. **Immediate**: Fix the SSL certificate issue for EAS CLI
2. **Build**: Create a development build with push notifications enabled
3. **Test**: Install on physical device and re-test
4. **Verify**: Confirm notifications are received

## Useful Commands

```bash
# Check registered devices
npx tsx check-devices.ts

# Test push notification sending
npx tsx test-push-notification.ts

# Send to specific token
npx tsx send-push-to-token.ts

# Monitor InstantDB for new devices
npx tsx -e "
import { init } from '@instantdb/core';
const db = init({ appId: '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad' });
db.subscribeQuery({ devices: {} }, (result) => {
  console.clear();
  console.log('Devices:', result.data?.devices);
});
"
```

## Resources

- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Apple's BadDeviceToken Documentation](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/handling_notification_responses_from_apns)
- [EAS Build Guide](https://docs.expo.dev/build/setup/)