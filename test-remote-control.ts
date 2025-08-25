#!/usr/bin/env bun

import { init, id } from "@instantdb/node";

// Initialize InstantDB client
const db = init({
  appId: process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

async function testRemoteControl() {
  console.log("🧪 Testing Claude Code Remote Control...");

  try {
    // Find an existing conversation or create a new one
    const conversationsQuery = await db.query({
      conversations: {}
    });

    let conversationId: string;
    
    if (conversationsQuery.conversations && conversationsQuery.conversations.length > 0) {
      conversationId = conversationsQuery.conversations[0].id;
      console.log(`📋 Using existing conversation: ${conversationsQuery.conversations[0].title}`);
    } else {
      // Create a new conversation
      conversationId = id();
      await db.transact([
        db.tx.conversations[conversationId].update({
          userId: "test-user",
          title: "Remote Control Test",
          status: "active",
        }),
      ]);
      console.log(`📝 Created new test conversation`);
    }

    // Send a test message that should trigger Claude Code response
    const testMessage = {
      id: id(),
      conversationId,
      role: "user",
      content: "Hello Claude! This is a test message from the remote control system. Can you tell me what 2+2 equals?",
    };

    console.log(`📱 Sending test message: "${testMessage.content}"`);
    
    await db.transact([
      db.tx.messages[testMessage.id].update(testMessage),
    ]);

    console.log("✅ Test message sent!");
    console.log("\n🔍 Expected workflow:");
    console.log("   1. Host app should detect this message");
    console.log("   2. Host app sends message to Claude Code");
    console.log("   3. Claude's response appears in the database");
    console.log("   4. Mobile app shows the response in real-time");
    
    console.log("\n💡 To verify:");
    console.log("   - Check host app console for processing logs");
    console.log("   - Check mobile app for new Claude response");
    console.log("   - Or run: bun run check-messages.ts");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testRemoteControl();