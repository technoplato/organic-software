#!/usr/bin/env bun

/**
 * Test: InstantDB Node SDK Query Test
 * ===================================
 *
 * REASONING:
 * Test the InstantDB Node SDK db.query() function with the same syntax
 * used in instant-message-handler.ts to ensure the database integration works.
 *
 * HYPOTHESIS:
 * A simple query using db.query() should connect to InstantDB and return
 * data from the conversations and messages tables.
 *
 * HOW TO RUN:
 * npx tsx tests/test-instantdb-query.ts
 *
 * EXPECTED RESULTS:
 * - Should connect to InstantDB successfully
 * - Should return conversations and messages data
 * - Should show the structure of the data
 */

import { init } from "@instantdb/node";

// Use the same app ID as instant-message-handler.ts
const APP_ID = process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("🧪 Testing InstantDB Node SDK Query");
console.log("=" .repeat(50));
console.log("📱 App ID:", APP_ID);

// Initialize the database with just the app ID (same as instant-message-handler.ts)
const db = init({
  appId: APP_ID,
});

console.log("✅ InstantDB initialized");

async function testInstantDBQuery() {
  try {
    console.log("\n📊 Testing db.queryOnce() with conversations and messages...");
    
    // Use db.queryOnce() - the correct method for InstantDB Node SDK
    const result = await db.queryOnce({
      conversations: {},
      messages: {}
    });
    
    console.log("\n✅ Query successful!");
    console.log("📈 Results:");
    console.log(`   • Conversations: ${result.data.conversations?.length || 0}`);
    console.log(`   • Messages: ${result.data.messages?.length || 0}`);
    
    if (result.data.conversations && result.data.conversations.length > 0) {
      console.log("\n📋 Sample conversation:");
      const sampleConv = result.data.conversations[0];
      if (sampleConv) {
        console.log(`   • ID: ${sampleConv.id}`);
        console.log(`   • Title: ${sampleConv.title || 'untitled'}`);
        console.log(`   • Status: ${sampleConv.status || 'unknown'}`);
        console.log(`   • Claude Session ID: ${sampleConv.claudeSessionId || 'none'}`);
        console.log(`   • Created: ${sampleConv.createdAt ? new Date(sampleConv.createdAt).toLocaleString() : 'unknown'}`);
      }
    }
    
    if (result.data.messages && result.data.messages.length > 0) {
      console.log("\n💬 Sample message:");
      const sampleMsg = result.data.messages[0];
      if (sampleMsg) {
        console.log(`   • ID: ${sampleMsg.id}`);
        console.log(`   • Role: ${sampleMsg.role || 'unknown'}`);
        console.log(`   • Content: "${(sampleMsg.content || '').substring(0, 50)}${(sampleMsg.content || '').length > 50 ? '...' : ''}"`);
        console.log(`   • Status: ${sampleMsg.status || 'none'}`);
        console.log(`   • Timestamp: ${sampleMsg.timestamp ? new Date(sampleMsg.timestamp).toLocaleString() : 'unknown'}`);
      }
    }
    
    console.log("\n🎉 InstantDB Node SDK is working correctly!");
    
  } catch (error) {
    console.error("\n❌ Query failed:", error);
    throw error;
  } finally {
    // Clean shutdown
    db.shutdown();
    console.log("\n🛑 Database connection closed");
  }
}

// Run the test
testInstantDBQuery()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });