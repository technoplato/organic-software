#!/usr/bin/env npx tsx

/**
 * Send a push notification to a specific Expo push token
 * Usage: npx tsx send-push-to-token.ts
 */

import { Expo } from "expo-server-sdk";
import type { ExpoPushMessage } from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo({
  useFcmV1: true, // Use the new FCM v1 API (recommended)
});

async function sendNotificationToToken(
  pushToken: string,
  title: string,
  body: string,
  data?: any,
) {
  console.log(`📱 Sending notification to: ${pushToken.substring(0, 30)}...`);

  // Check that the push token appears to be valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`❌ Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  // Construct the message
  const message: ExpoPushMessage = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data: data || {},
    priority: "high",
    badge: 1,
  };

  try {
    // Send the notification
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log("📨 Ticket received:", tickets[0]);

    // Check for errors in ticket
    const ticket = tickets[0];
    if (ticket.status === "error") {
      console.error(`❌ Error sending notification: ${ticket.message}`);
      if (ticket.details) {
        console.error("   Details:", ticket.details);
      }
      return;
    }

    if (ticket.status === "ok" && ticket.id) {
      console.log(`✅ Successfully sent notification!`);
      console.log("🎫 Receipt ID:", ticket.id);

      // Check receipt after a delay
      console.log("\n⏳ Waiting 5 seconds before checking receipt...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      try {
        const receipts = await expo.getPushNotificationReceiptsAsync([
          ticket.id,
        ]);
        const receipt = receipts[ticket.id];

        if (receipt) {
          if (receipt.status === "ok") {
            console.log(`✅ Notification was delivered successfully!`);
          } else if (receipt.status === "error") {
            console.error(
              `❌ Notification delivery failed: ${(receipt as any).message || "Unknown error"}`,
            );
            if ((receipt as any).details) {
              console.error("   Details:", (receipt as any).details);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching receipt:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
}

async function main() {
  const pushToken = "ExponentPushToken[83MXeMIUvyFEQEvACoI8MQ]";

  console.log("🚀 Sending Push Notification to Your Device");
  console.log("============================================\n");

  // Send a test notification
  await sendNotificationToToken(
    pushToken,
    "🎉 Test Notification from Organic Software",
    "Hello! This is a test push notification sent directly to your device. The supervisor and instant message handler are working together! 🤖",
    {
      type: "test",
      timestamp: Date.now(),
      source: "organic-software",
      message: "Push notifications are working!",
    },
  );

  console.log("\n✨ Notification sent!");
  console.log("Check your iOS device for the notification.");
  console.log(
    "\nNote: If the app is in foreground, check the Notification Center (swipe down from top).",
  );

  // Give time for final receipt check
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("\n👍 Complete!");
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
