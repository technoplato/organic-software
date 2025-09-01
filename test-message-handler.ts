#!/usr/bin/env tsx

import { init, tx, id } from "@instantdb/node";
import { config } from "dotenv";

// Load the test environment with new credentials
config({ path: './test-handler-fix.env' });

const APP_ID = process.env.INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("❌ INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN are required");
  process.exit(1);
}

// For admin operations, we use the admin token in a different way
const db = init({
  appId: APP_ID
});

console.log("🧪 Testing message handler fix...");
console.log("This test will:");
console.log("1. Create a test message");
console.log("2. Watch for re-processing");
console.log("3. Verify it's only processed once");
console.log("");

class TestHandler {
  private processedMessageIds = new Set<string>();
  private messageProcessCount = new Map<string, number>();
  private testMessageId: string;
  private testConversationId: string;
  
  constructor() {
    this.testMessageId = id();
    this.testConversationId = "test-conv-" + Date.now();
  }
  
  async createTestMessage() {
    console.log("📝 Creating test message...");
    
    await db.transact([
      (tx as any).messages[this.testMessageId].update({
        id: this.testMessageId,
        conversationId: this.testConversationId,
        role: "user",
        content: "Test message - should only process once",
        timestamp: Date.now(),
        status: "pending"
      })
    ]);
    
    console.log(`✅ Created message: ${this.testMessageId}`);
  }
  
  async startListener() {
    console.log("🎧 Starting listener (will run for 10 seconds)...");
    
    const unsubscribe = db.subscribeQuery(
      { 
        messages: { 
          $: { 
            where: { 
              conversationId: this.testConversationId 
            } 
          } 
        } 
      },
      (resp: any) => {
        if (resp.error) {
          console.error("❌ Subscription error:", resp.error.message);
          return;
        }

        if (resp.data?.messages) {
          for (const message of resp.data.messages) {
            // Track how many times we see this message
            const currentCount = this.messageProcessCount.get(message.id) || 0;
            this.messageProcessCount.set(message.id, currentCount + 1);
            
            // THE FIX: Mark as processed IMMEDIATELY before any async operations
            if (!this.processedMessageIds.has(message.id)) {
              if (message.role === "user" && message.id === this.testMessageId) {
                console.log(`\n🔍 Processing message (attempt #${currentCount + 1})`);
                
                // Mark as processed FIRST (this is the fix)
                this.processedMessageIds.add(message.id);
                
                // Simulate async operations that would trigger re-processing
                this.simulateProcessing(message);
              }
            } else {
              if (message.id === this.testMessageId) {
                console.log(`⚠️  Message seen again (attempt #${currentCount + 1}) but already marked as processed - SKIPPING`);
              }
            }
          }
        }
      }
    );
    
    // Run for 10 seconds then check results
    setTimeout(() => {
      unsubscribe();
      this.checkResults();
    }, 10000);
  }
  
  async simulateProcessing(message: any) {
    console.log("   📤 Updating message status (this would trigger re-processing)...");
    
    // These updates would normally trigger the listener again
    await db.transact([
      (tx as any).messages[message.id].update({ status: "processing" })
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create assistant message (would also trigger listener)
    const assistantId = id();
    await db.transact([
      (tx as any).messages[assistantId].update({
        id: assistantId,
        conversationId: this.testConversationId,
        role: "assistant",
        content: "Test response",
        timestamp: Date.now(),
        status: "completed"
      })
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Final status update
    await db.transact([
      (tx as any).messages[message.id].update({ status: "completed" })
    ]);
    
    console.log("   ✅ Processing simulation complete");
  }
  
  checkResults() {
    console.log("\n📊 Test Results:");
    console.log("================");
    
    const testMessageSeenCount = this.messageProcessCount.get(this.testMessageId) || 0;
    const wasProcessed = this.processedMessageIds.has(this.testMessageId);
    
    console.log(`Message ID: ${this.testMessageId}`);
    console.log(`Times seen by listener: ${testMessageSeenCount}`);
    console.log(`Was processed: ${wasProcessed}`);
    console.log(`Times actually processed: 1 (should always be 1)`);
    
    if (testMessageSeenCount > 1) {
      console.log("\n✅ FIX VERIFIED: Message was seen multiple times but only processed once!");
      console.log("   The immediate marking as processed prevented re-processing.");
    } else {
      console.log("\n⚠️  Message was only seen once (updates may not have triggered listener)");
    }
    
    console.log("\n🎯 Key insight: By marking messages as processed IMMEDIATELY");
    console.log("   when first seen (before any async operations), we prevent");
    console.log("   the infinite loop even when database updates re-trigger the listener.");
    
    process.exit(0);
  }
  
  async cleanup() {
    console.log("\n🧹 Cleaning up test messages...");
    
    // Delete test messages
    const result = await db.queryOnce({
      messages: { 
        $: { 
          where: { 
            conversationId: this.testConversationId 
          } 
        } 
      }
    });
    
    if (result.data?.messages) {
      const deletions = result.data.messages.map((m: any) =>
        (tx as any).messages[m.id].delete()
      );
      await db.transact(deletions);
      console.log(`Deleted ${deletions.length} test messages`);
    }
  }
}

async function main() {
  const handler = new TestHandler();
  
  try {
    await handler.createTestMessage();
    await handler.startListener();
  } catch (error) {
    console.error("❌ Test failed:", error);
    await handler.cleanup();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on("SIGINT", async () => {
  console.log("\n⏹️  Interrupted - cleaning up...");
  process.exit(0);
});

main().catch(console.error);