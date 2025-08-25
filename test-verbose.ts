#!/usr/bin/env bun

import { init, tx, id } from "@instantdb/node";
import process from "process";

// Set up environment variables
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.DEBUG = "*"; // Enable all debug output

// ID for app: Claude Code Remote Control
const APP_ID = "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("🚀 Initializing InstantDB...");
console.log("📱 App ID:", APP_ID);
console.log("🔧 Environment:", {
  nodeVersion: process.version,
  platform: process.platform,
  debug: process.env.DEBUG,
});

// Initialize with verbose mode
const db = init({
  appId: APP_ID,
  verbose: true, // Enable verbose logging
});

console.log("✅ InstantDB initialized");

async function testVerbose() {
  try {
    console.log("\n💾 Creating a todo...");
    const todoId = id();
    
    await db.transact(
      tx.todos[todoId].update({
        text: "Verbose test todo",
        done: false,
        createdAt: Date.now(),
      })
    );

    console.log("✅ Transaction completed: " + todoId);

    console.log("\n📊 Attempting query with 10 second timeout...");
    
    // Try with a longer timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Query timed out after 10 seconds")), 10000)
    );
    
    const queryPromise = db.queryOnce({
      todos: {
        $: {
          limit: 1,
        },
      },
    });

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log("✅ Query successful:", result);
    } catch (error) {
      console.error("❌ Query failed:", error);
    }

    // Also try subscription
    console.log("\n📡 Testing subscription...");
    let gotData = false;
    
    const unsubscribe = db.subscribeQuery(
      { todos: {} },
      (resp) => {
        console.log("📨 Subscription response received:", resp);
        if (!resp.error) {
          gotData = true;
        }
      }
    );

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (gotData) {
      console.log("✅ Subscription working");
    } else {
      console.log("⚠️ No subscription data received");
    }

    unsubscribe();
    db.shutdown();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    db.shutdown();
    process.exit(1);
  }
}

testVerbose();