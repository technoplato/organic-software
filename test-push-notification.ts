#!/usr/bin/env npx tsx

/**
 * Test script for sending push notifications to the mobile app
 * Usage: npx tsx test-push-notification.ts [pushToken]
 * 
 * If no push token is provided, it will try to fetch from the database
 */

import { init } from '@instantdb/core';

// Initialize InstantDB
const db = init({
  appId: process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

interface PushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  ttl?: number;
  expiration?: number;
  priority?: 'default' | 'normal' | 'high';
  subtitle?: string;
  badge?: number;
  channelId?: string;
}

interface PushTicket {
  id: string;
  status: 'ok' | 'error';
  message?: string;
  details?: any;
}

async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message: PushMessage = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
    priority: 'high',
    badge: 1,
  };

  try {
    console.log('📤 Sending push notification to:', expoPushToken);
    console.log('📝 Message:', { title, body, data });

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📨 Push notification response:', result);

    // Check if the ticket has an error
    const ticket = result.data?.[0] as PushTicket;
    if (ticket?.status === 'error') {
      console.error('❌ Push notification error:', ticket.message);
      if (ticket.details) {
        console.error('Details:', ticket.details);
      }
      return false;
    }

    console.log('✅ Push notification sent successfully!');
    console.log('🎫 Ticket ID:', ticket?.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    return false;
  }
}

async function getLatestPushToken(): Promise<string | null> {
  try {
    console.log('🔍 Fetching push tokens from database...');
    const { data } = await db.queryOnce({
      devices: {},
    });

    const devices = data?.devices || [];
    if (devices.length === 0) {
      console.log('⚠️ No devices found in database');
      return null;
    }

    // Get the most recently updated device
    const latestDevice = devices.reduce((latest: any, device: any) => {
      if (!latest || (device.updatedAt > latest.updatedAt)) {
        return device;
      }
      return latest;
    }, null);

    if (latestDevice?.pushToken) {
      console.log('📱 Found device:', {
        platform: latestDevice.platform,
        updatedAt: new Date(latestDevice.updatedAt).toLocaleString(),
      });
      return latestDevice.pushToken;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching push token from database:', error);
    return null;
  }
}

async function testScheduledNotification(expoPushToken: string) {
  console.log('\n🕐 Testing scheduled notification (will appear in 5 seconds)...');
  
  setTimeout(async () => {
    await sendPushNotification(
      expoPushToken,
      '⏰ Scheduled Notification',
      'This notification was scheduled 5 seconds ago!',
      { type: 'scheduled', timestamp: Date.now() }
    );
  }, 5000);
}

async function main() {
  console.log('🚀 Push Notification Test Script');
  console.log('================================\n');

  // Get push token from command line or database
  let pushToken = process.argv[2];

  if (!pushToken) {
    console.log('No push token provided, fetching from database...');
    pushToken = await getLatestPushToken() || '';
    
    if (!pushToken) {
      console.error('\n❌ No push token available!');
      console.log('\nTo use this script:');
      console.log('1. Open the mobile app on your iOS device');
      console.log('2. Grant notification permissions when prompted');
      console.log('3. Check the console for "Push token obtained: ExponentPushToken[...]"');
      console.log('4. Run: npx tsx test-push-notification.ts ExponentPushToken[...]');
      console.log('\nOr wait for the app to register and try again without arguments.');
      process.exit(1);
    }
  }

  // Validate push token format
  if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
    console.error('❌ Invalid push token format!');
    console.log('Push tokens should start with "ExponentPushToken[" or "ExpoPushToken["');
    process.exit(1);
  }

  console.log('📱 Using push token:', pushToken);
  console.log('\n');

  // Test 1: Simple notification
  console.log('📬 Test 1: Simple notification');
  await sendPushNotification(
    pushToken,
    '👋 Hello from Node.js!',
    'This is a test push notification from your test script.'
  );

  // Wait a bit between notifications
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Notification with data
  console.log('\n📬 Test 2: Notification with conversation data');
  await sendPushNotification(
    pushToken,
    '💬 New Message from Claude',
    'Claude has responded to your conversation',
    { 
      conversationId: 'test-conversation-123',
      messageCount: 5,
      timestamp: Date.now()
    }
  );

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Rich notification
  console.log('\n📬 Test 3: Rich notification with emoji');
  await sendPushNotification(
    pushToken,
    '🎉 Task Completed!',
    'Your code has been successfully deployed 🚀\n✅ All tests passing\n📊 Performance improved by 25%',
    { 
      type: 'task_complete',
      taskId: 'deploy-123'
    }
  );

  // Test 4: Schedule a notification
  await testScheduledNotification(pushToken);

  console.log('\n✨ All test notifications sent!');
  console.log('Check your iOS device for the notifications.');
  console.log('\nNote: Notifications will appear in Notification Center if the app is in foreground.');
  console.log('Swipe down from the top of your screen to see them.');
  
  // Keep the process alive for scheduled notification
  console.log('\nWaiting for scheduled notification to fire...');
  setTimeout(() => {
    console.log('\n👍 Test complete!');
    process.exit(0);
  }, 7000);
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});