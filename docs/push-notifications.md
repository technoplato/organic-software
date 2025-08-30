# Push Notifications Setup for iOS (Expo Go)

This document explains how to set up and test push notifications for iOS devices using Expo Go.

## Overview

The mobile app is configured to support push notifications on iOS devices through Expo's push notification service. The implementation uses the sandbox APNs environment for testing in Expo Go.

## Features

- ✅ Automatic push token registration on app launch
- ✅ Permission request handling
- ✅ Foreground notification display
- ✅ Background notification handling
- ✅ Notification tap handling with deep linking
- ✅ Push token storage in InstantDB
- ✅ Test script for sending notifications

## Setup Instructions

### 1. Prerequisites

- iOS device with Expo Go installed
- Node.js and npm installed on your development machine
- Access to the InstantDB database

### 2. Mobile App Configuration

The app automatically:
1. Requests notification permissions on first launch
2. Registers for push notifications
3. Obtains an Expo push token
4. Stores the token in InstantDB for server-side use

### 3. Testing Push Notifications

#### Method 1: Using the Test Script

Run the test script to send notifications to your device:

```bash
# Fetch token from database automatically
npx tsx test-push-notification.ts

# Or provide token directly
npx tsx test-push-notification.ts ExponentPushToken[xxxxxx]
```

The script will send several test notifications:
- Simple text notification
- Notification with conversation data
- Rich notification with emojis
- Scheduled notification (5 seconds delay)

#### Method 2: Manual Testing with curl

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[xxxxxx]",
  "title": "Test Notification",
  "body": "This is a test message",
  "sound": "default",
  "badge": 1
}'
```

## Implementation Details

### Token Registration (mobile-app/app/index.tsx)

```typescript
async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  
  // Configure for iOS sandbox (Expo Go)
  const tokenOptions: Notifications.ExpoPushTokenOptions = {
    development: Platform.OS === 'ios', // Use sandbox APNs
    ...(projectId && { projectId })
  };
  
  // Get token
  const token = (await Notifications.getExpoPushTokenAsync(tokenOptions)).data;
  
  // Store in database
  await db.transact([
    tx.devices[token].update({
      id: token,
      pushToken: token,
      platform: Platform.OS,
      updatedAt: Date.now(),
    }),
  ]);
  
  return token;
}
```

### Notification Handler Configuration

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

### Notification Listeners

```typescript
// Foreground notifications
Notifications.addNotificationReceivedListener(notification => {
  console.log('📬 Notification received:', notification);
});

// Notification taps
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  // Handle deep linking based on data
});
```

## Troubleshooting

### Common Issues

1. **"No push token obtained"**
   - Ensure you've granted notification permissions
   - Check that you're using a physical iOS device (not simulator)
   - Verify Expo Go is up to date

2. **"Push notification not received"**
   - Check that the token format is correct (starts with `ExponentPushToken[`)
   - Ensure the device has an internet connection
   - Check notification settings in iOS Settings > Expo Go

3. **"Notifications not showing in foreground"**
   - This is expected behavior - check Notification Center
   - Swipe down from the top of the screen to see notifications

4. **"Invalid push token format"**
   - Token should look like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
   - Ensure you're copying the complete token including brackets

### Debug Commands

```bash
# Check if device is registered
npx tsx -e "
import { init } from '@instantdb/core';
const db = init({ appId: '54d69382-c27c-4e54-b2ac-c3dcaef2f0ad' });
db.queryOnce({ devices: {} }).then(({ data }) => {
  console.log('Registered devices:', data.devices);
});
"

# Send a simple test notification
npx tsx -e "
fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'YOUR_TOKEN_HERE',
    title: 'Debug Test',
    body: 'If you see this, notifications are working!'
  })
}).then(r => r.json()).then(console.log);
"
```

## Production Considerations

For production apps (not using Expo Go):

1. **EAS Build Required**: You'll need to create a development build with EAS
2. **Project ID**: Set up an EAS project and configure the project ID
3. **APNs Certificates**: Configure proper Apple Push Notification certificates
4. **Remove Development Flag**: Set `development: false` for production APNs

## API Reference

### Expo Push API

Endpoint: `https://exp.host/--/api/v2/push/send`

Request format:
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Notification Title",
  "body": "Notification body text",
  "data": { "custom": "data" },
  "sound": "default",
  "badge": 1,
  "priority": "high"
}
```

Response format:
```json
{
  "data": [{
    "id": "ticket-id",
    "status": "ok"
  }]
}
```

## Next Steps

- [ ] Implement notification categories for interactive notifications
- [ ] Add custom notification sounds
- [ ] Implement notification scheduling on device
- [ ] Add notification analytics tracking
- [ ] Create server-side notification service