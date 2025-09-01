#!/usr/bin/env bun

import { init, tx, id } from "@instantdb/node";
import process from "process";

// Set up environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ID for app: Claude Code Remote Control
const APP_ID = "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("📱 Test Message Sender");
console.log("=".repeat(50));

// Initialize the database
const db = init({
  appId: APP_ID,
});

async function sendTestMessage() {
  try {
    // Create a conversation ID
    const conversationId = id();
    const messageId = id();

    // Create the test message
    const testMessage = process.argv[2] || "What is the capital of France?";

    console.log("📝 Creating conversation:", conversationId);

    // Create a conversation
    await db.transact(
      tx.conversations[conversationId].update({
        userId: "test-user",
        title: "Test Conversation",
        status: "active",
      }),
    );

    console.log("💬 Sending message:", testMessage);
    console.log("   Message ID:", messageId);
    console.log("   Conversation ID:", conversationId);

    // Add the user message
    await db.transact(
      tx.messages[messageId].update({
        conversationId: conversationId,
        role: "user",
        content: testMessage,
        timestamp: Date.now(),
      }),
    );

    console.log("✅ Message sent successfully!");
    console.log("\n⏳ The remote control server should now:");
    console.log("   1. Detect this message");
    console.log("   2. Send it to Claude");
    console.log("   3. Store Claude's response");

    // Wait a moment to see the response
    console.log("\n🔍 Waiting 10 seconds for response...");

    setTimeout(() => {
      // Subscribe to check for responses
      const unsubscribe = db.subscribeQuery(
        {
          messages: {
            $: {
              where: {
                conversationId: conversationId,
              },
            },
          },
        },
        (resp) => {
          if (!resp.error && resp.data && resp.data.messages) {
            console.log("\n📬 Messages in conversation:");
            resp.data.messages.forEach((msg: any) => {
              const preview = msg.content.substring(0, 100);
              console.log(
                `   [${msg.role}]: ${preview}${msg.content.length > 100 ? "..." : ""}`,
              );
            });
          }
          unsubscribe();
          db.shutdown();
          process.exit(0);
        },
      );
    }, 10000);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    db.shutdown();
    process.exit(1);
  }
}

// Run the script
sendTestMessage();
