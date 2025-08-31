#!/usr/bin/env bun

import { init, tx, id } from "@instantdb/node";
import process from "process";

// Set up environment variables
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ID for app: Claude Code Remote Control
const APP_ID = "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("🚀 Initializing InstantDB...");
console.log("📱 App ID:", APP_ID);

// Initialize the database with just the app ID
const db = init({
  appId: APP_ID,
});

console.log("✅ InstantDB initialized with Node.js package");

async function testSubscribe() {
  try {
    // Test 1: Create a test ID
    const testId = id();
    console.log(`✅ Generated test ID: ${testId}`);

    // Test 2: Try a simple transaction
    console.log("\n💾 Testing database transaction...");
    const todoId = id();

    await db.transact(
      tx.todos[todoId].update({
        text: "Test todo from subscribe test",
        done: false,
        createdAt: Date.now(),
      }),
    );

    console.log("✅ Transaction completed successfully");
    console.log(`   Created todo: ${todoId}`);

    // Test 3: Try subscription instead of queryOnce
    console.log("\n📊 Testing database subscription...");

    let subscriptionWorked = false;

    const unsubscribe = db.subscribeQuery(
      { todos: { $: { limit: 1 } } },
      (resp) => {
        if (resp.error) {
          console.error("❌ Subscription error:", resp.error);
        } else {
          subscriptionWorked = true;
          console.log("✅ Subscription received data");
          console.log(`   Found ${resp.data.todos?.length || 0} todos`);
          if (resp.data.todos && resp.data.todos.length > 0) {
            console.log(`   First todo: ${resp.data.todos[0].text}`);
          }
        }
      },
    );

    // Wait for subscription to receive data
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (subscriptionWorked) {
      console.log("\n🎉 SUBSCRIBE TEST COMPLETE!");
      console.log("✅ @instantdb/node is properly linked and working");
    } else {
      console.log("\n⚠️ Subscription didn't receive data within 3 seconds");
    }

    // Clean up
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }

    // Shutdown
    db.shutdown();
    process.exit(subscriptionWorked ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Subscribe test failed:", error);
    process.exit(1);
  }
}

// Run the test
testSubscribe();
