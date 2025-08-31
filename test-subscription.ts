#!/usr/bin/env bun

import { init, tx, id } from "@instantdb/node";
import process from "process";

// Set up environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const APP_ID = "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("🧪 Testing InstantDB Subscription");
console.log("=".repeat(50));

const db = init({
  appId: APP_ID,
});

async function testSubscription() {
  console.log("📡 Setting up subscription to messages...");

  let messageCount = 0;
  const startTime = Date.now();

  const unsubscribe = db.subscribeQuery(
    {
      messages: {},
      conversations: {},
    },
    (resp) => {
      messageCount++;
      console.log(`\n🔔 Subscription callback #${messageCount}:`);

      if (resp.error) {
        console.error("   ❌ Error:", resp.error);
      } else if (resp.data) {
        console.log(`   ✅ Data received`);
        console.log(`   • ${resp.data.messages?.length || 0} messages`);
        console.log(
          `   • ${resp.data.conversations?.length || 0} conversations`,
        );

        // Show recent messages
        if (resp.data.messages && resp.data.messages.length > 0) {
          const recentMessages = resp.data.messages
            .filter((m: any) => m.timestamp && m.timestamp > startTime - 60000) // Last minute
            .slice(-3); // Last 3 messages

          if (recentMessages.length > 0) {
            console.log("\n   📬 Recent messages:");
            recentMessages.forEach((msg: any) => {
              const preview = msg.content?.substring(0, 50) || "[no content]";
              console.log(`      [${msg.role}]: ${preview}...`);
            });
          }
        }
      } else {
        console.log("   ⚠️ No data in response");
      }
    },
  );

  console.log("✅ Subscription set up successfully");
  console.log("\n⏳ Waiting for data...");
  console.log("   The subscription should receive data immediately");
  console.log("   and then again whenever data changes\n");

  // After 5 seconds, create a new message to trigger the subscription
  setTimeout(async () => {
    console.log("\n📝 Creating a new message to trigger subscription...");
    const conversationId = id();
    const messageId = id();

    await db.transact([
      tx.conversations[conversationId].update({
        userId: "test-user",
        title: "Subscription Test",
        status: "active",
      }),
      tx.messages[messageId].update({
        conversationId: conversationId,
        role: "user",
        content: "Test message created at " + new Date().toISOString(),
        timestamp: Date.now(),
      }),
    ]);

    console.log("✅ Message created - subscription should trigger now");
  }, 5000);

  // Run for 20 seconds then exit
  setTimeout(() => {
    console.log("\n🛑 Test complete, shutting down...");
    console.log(`   Total subscription callbacks: ${messageCount}`);
    unsubscribe();
    db.shutdown();
    process.exit(0);
  }, 20000);
}

testSubscription().catch((error) => {
  console.error("❌ Test failed:", error);
  db.shutdown();
  process.exit(1);
});
