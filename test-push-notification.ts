#!/usr/bin/env npx tsx

/**
 * Test script for sending push notifications to the mobile app
 * Usage: npx tsx test-push-notification.ts
 *
 * This script will send notifications to all registered devices in the database
 */

import { init } from "@instantdb/core";
import { Expo } from "expo-server-sdk";
import type { ExpoPushMessage } from "expo-server-sdk";

// Initialize InstantDB
const db = init({
  appId: process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

// Create a new Expo SDK client
const expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional, if you have push security enabled
  useFcmV1: true, // Use the new FCM v1 API (recommended)
});

interface Device {
  id: string;
  pushToken: string;
  platform: string;
  updatedAt: number;
  createdAt?: number;
}

async function getAllPushTokens(): Promise<string[]> {
  try {
    console.log("🔍 Fetching all push tokens from database...");
    const { data } = await db.queryOnce({
      devices: {},
    });

    const devices = data?.devices || [];
    if (devices.length === 0) {
      console.log("⚠️ No devices found in database");
      return [];
    }

    console.log(`📱 Found ${devices.length} device(s) in database`);

    // Extract unique push tokens
    const tokens = devices
      .filter((device: any) => device.pushToken)
      .map((device: any) => {
        console.log(
          `  - ${device.platform}: ${device.pushToken.substring(0, 30)}...`,
        );
        return device.pushToken;
      });

    return [...new Set(tokens)]; // Remove duplicates
  } catch (error) {
    console.error("❌ Error fetching push tokens from database:", error);
    return [];
  }
}

async function sendNotificationToAll(title: string, body: string, data?: any) {
  const pushTokens = await getAllPushTokens();

  if (pushTokens.length === 0) {
    console.error("\n❌ No push tokens available!");
    console.log("\nTo use this script:");
    console.log("1. Open the mobile app on your iOS device");
    console.log("2. Grant notification permissions when prompted");
    console.log("3. The app will automatically save the token to the database");
    console.log("4. Run this script again");
    return;
  }

  // Create messages for all tokens
  const messages: ExpoPushMessage[] = [];

  for (const pushToken of pushTokens) {
    // Check that all push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(
        `❌ Push token ${pushToken} is not a valid Expo push token`,
      );
      continue;
    }

    // Construct a message
    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data: data || {},
      priority: "high",
      badge: 1,
    });
  }

  if (messages.length === 0) {
    console.error("❌ No valid push tokens to send to");
    return;
  }

  // The Expo push notification service accepts batches of notifications
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  console.log(`\n📤 Sending notifications to ${messages.length} device(s)...`);

  // Send the chunks to the Expo push notification service
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("📨 Ticket chunk received:", ticketChunk);
      tickets.push(...ticketChunk);

      // Check for errors in tickets
      for (const ticket of ticketChunk) {
        if (ticket.status === "error") {
          console.error(`❌ Error sending notification: ${ticket.message}`);
          if (ticket.details) {
            console.error("   Details:", ticket.details);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error sending notification chunk:", error);
    }
  }

  // Process receipts (optional - you can check these later)
  const receiptIds = [];
  for (const ticket of tickets) {
    if (ticket.status === "ok" && ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  if (receiptIds.length > 0) {
    console.log(`\n✅ Successfully sent ${receiptIds.length} notification(s)`);
    console.log("🎫 Receipt IDs:", receiptIds);

    // Optionally, check receipts after a delay
    console.log("\n⏳ Waiting 5 seconds before checking receipts...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log("\n📋 Receipts:", receipts);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          if (!receipt) continue;

          if (receipt.status === "ok") {
            console.log(
              `✅ Notification ${receiptId} was delivered successfully`,
            );
          } else if (receipt.status === "error") {
            console.error(
              `❌ Notification ${receiptId} failed: ${(receipt as any).message || "Unknown error"}`,
            );
            if ((receipt as any).details) {
              console.error("   Details:", (receipt as any).details);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching receipts:", error);
      }
    }
  }
}

async function main() {
  console.log("🚀 Push Notification Test Script (Expo Server SDK)");
  console.log("==================================================\n");

  // Test 1: Simple "Hello" notification
  console.log("📬 Test 1: Simple Hello notification to all devices");
  await sendNotificationToAll(
    "👋 Hello!",
    "This is a simple test notification from the Expo Server SDK",
  );

  // Wait a bit between notifications
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 2: Notification with data
  console.log("\n📬 Test 2: Notification with conversation data");
  await sendNotificationToAll(
    "💬 New Message from Claude",
    "Claude has responded to your conversation",
    {
      conversationId: "test-conversation-" + Date.now(),
      messageCount: 5,
      timestamp: Date.now(),
    },
  );

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 3: Rich notification
  console.log("\n📬 Test 3: Rich notification with emoji");
  await sendNotificationToAll(
    "🎉 Task Completed!",
    "Your code has been successfully deployed 🚀\n✅ All tests passing\n📊 Performance improved by 25%",
    {
      type: "task_complete",
      taskId: "deploy-" + Date.now(),
    },
  );

  console.log("\n✨ All test notifications sent!");
  console.log("Check your iOS device(s) for the notifications.");
  console.log(
    "\nNote: Notifications will appear in Notification Center if the app is in foreground.",
  );
  console.log("Swipe down from the top of your screen to see them.");

  // Give time for final receipt checks
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("\n👍 Test complete!");
  process.exit(0);
}

// Run the test
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
