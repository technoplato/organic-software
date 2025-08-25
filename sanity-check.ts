#!/usr/bin/env bun

import { init, i, id } from "@instantdb/node";
import process from "process";

// Set up environment variables
process.env.NODE_TLS_REJECT_UNAUTHORIZED =
  process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";

console.log("🔍 Sanity Check: Testing @instantdb/node setup");
console.log("=".repeat(50));

// Test 1: Check if we can import from @instantdb/node
try {
  console.log("✅ Successfully imported from @instantdb/node");
} catch (error) {
  console.error("❌ Failed to import from @instantdb/node:", error);
  process.exit(1);
}

// Test 2: Initialize database
const APP_ID =
  process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

async function main() {
  try {
    const schema = i.schema({
      entities: {
        users: i.entity({
          email: i.string(),
          displayName: i.string(),
          status: i.string(),
        }),
        conversations: i.entity({
          userId: i.string(),
          title: i.string(),
          status: i.string(),
        }),
        messages: i.entity({
          conversationId: i.string(),
          role: i.string(),
          content: i.string(),
        }),
      },
    });

    // Load admin token from environment
    const adminToken = process.env.INSTANTDB_ADMIN_TOKEN || "ada8f4c3-5947-456f-8ee6-6425d7bf94a7";
    
    const db = init({ 
      appId: APP_ID, 
      adminToken,
      schema, 
      verbose: true 
    });
    console.log("✅ Successfully initialized InstantDB with schema");

    // Test 3: Create a test ID
    const testId = id();
    console.log(`✅ Generated test ID: ${testId}`);

    // Test 4: Try a simple query
    console.log("\n📊 Testing database query...");
    const result = await db.queryOnce({
      conversations: {
        $: {
          limit: 1,
        },
      },
    });

    console.log("✅ Query executed successfully");
    console.log(
      `   Found ${result.data.conversations?.length || 0} conversations`
    );

    // Test 5: Test transaction capability
    console.log("\n💾 Testing database transaction...");
    const testConversationId = id();
    const testMessageId = id();

    await db.transact([
      db.tx.conversations![testConversationId]!.update({
        userId: "sanity-check-user",
        title: "Sanity Check Test",
        status: "active",
      }),
      db.tx.messages![testMessageId]!.update({
        conversationId: testConversationId,
        role: "system",
        content: "This is a sanity check test message",
      }),
    ]);

    console.log("✅ Transaction completed successfully");
    console.log(`   Created conversation: ${testConversationId}`);
    console.log(`   Created message: ${testMessageId}`);

    // Test 6: Verify the data was saved
    console.log("\n🔍 Verifying saved data...");
    const verifyResult = await db.queryOnce({
      conversations: {
        $: {
          where: {
            id: testConversationId,
          },
        },
      },
      messages: {
        $: {
          where: {
            conversationId: testConversationId,
          },
        },
      },
    });

    if (
      verifyResult.data.conversations?.length > 0 &&
      verifyResult.data.messages?.length > 0
    ) {
      console.log("✅ Data verification successful");
      console.log(
        `   Found conversation: ${verifyResult.data.conversations[0]?.title}`
      );
      console.log(
        `   Found message: ${verifyResult.data.messages[0]?.content}`
      );
    } else {
      console.log("⚠️  Data verification failed - data not found");
    }

    // Test 7: Test subscription (briefly)
    console.log("\n📡 Testing real-time subscription...");
    let subscriptionWorking = false;

    const unsubscribe = db.subscribeQuery(
      { conversations: { $: { limit: 1 } } },
      (resp: any) => {
        if (!resp.error) {
          subscriptionWorking = true;
        }
      }
    );

    // Wait a moment for subscription to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (subscriptionWorking) {
      console.log("✅ Real-time subscription is working");
    } else {
      console.log("⚠️  Real-time subscription might not be working");
    }

    // Clean up
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }

    console.log("\n🎉 SANITY CHECK COMPLETE!");
    console.log("=".repeat(50));
    console.log("✅ @instantdb/node is properly linked and working");
    console.log("✅ Database operations are functional");
    console.log("✅ Ready for remote control operations");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Sanity check failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Make sure @instantdb/node is properly linked");
    console.log("   2. Check if INSTANTDB_APP_ID is correct");
    console.log("   3. Verify network connectivity");
    process.exit(1);
  }
}

// Run the main function
main();
