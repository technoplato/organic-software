#!/usr/bin/env bun

import { init, tx, id } from "@instantdb/node";
import process from "process";

// Set up environment variables
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ID for app: Claude Code Remote Control
const APP_ID = "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("🚀 Initializing InstantDB...");
console.log("📱 App ID:", APP_ID);
console.log("🌍 Environment check:", {
  nodeEnv: process.env.NODE_ENV,
  platform: process.platform,
  nodeVersion: process.version,
});

// Initialize the database with just the app ID (like in instant-vanilla)
const db = init({
  appId: APP_ID,
});

console.log("✅ InstantDB initialized with Node.js package");

async function testSimple() {
  try {
    // Test 1: Create a test ID
    const testId = id();
    console.log(`✅ Generated test ID: ${testId}`);

    // Test 2: Try a simple transaction
    console.log("\n💾 Testing database transaction...");
    const todoId = id();
    
    await db.transact(
      tx.todos[todoId].update({
        text: "Test todo from simple test",
        done: false,
        createdAt: Date.now(),
      })
    );

    console.log("✅ Transaction completed successfully");
    console.log(`   Created todo: ${todoId}`);

    // Test 3: Try a simple query
    console.log("\n📊 Testing database query...");
    const result = await db.queryOnce({
      todos: {
        $: {
          limit: 1,
        },
      },
    });

    console.log("✅ Query executed successfully");
    console.log(`   Found ${result.data.todos?.length || 0} todos`);

    console.log("\n🎉 SIMPLE TEST COMPLETE!");
    console.log("✅ @instantdb/node is properly linked and working");
    
    // Shutdown
    db.shutdown();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Simple test failed:", error);
    process.exit(1);
  }
}

// Run the test
testSimple();