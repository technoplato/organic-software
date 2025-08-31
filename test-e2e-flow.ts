#!/usr/bin/env bun

import { init, i, id } from "@instantdb/node";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// ID for app: Claude Code Remote Control
const APP_ID = process.env.INSTANTDB_APP_ID;

// Validate required environment variables
if (!APP_ID) {
  console.error(
    "❌ INSTANTDB_APP_ID is required. Please set it in your .env file.",
  );
  process.exit(1);
}

// Define schema
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

// Initialize InstantDB client
const db = init({ appId: APP_ID, schema });

class EndToEndTester {
  private conversationId: string;
  private testMessageId: string;
  private responseReceived = false;
  private timeout: Timer | null = null;

  constructor() {
    this.conversationId = id();
    this.testMessageId = id();
  }

  async runTest(): Promise<void> {
    console.log("🧪 Starting End-to-End Remote Control Test");
    console.log("=".repeat(50));

    try {
      // Step 1: Create test conversation (simulating mobile app)
      await this.createTestConversation();

      // Step 2: Set up real-time listener for responses
      await this.setupResponseListener();

      // Step 3: Send test message (simulating mobile app)
      await this.sendTestMessage();

      // Wait for host to process and respond
      await this.waitForResponse();
    } catch (error) {
      console.error("❌ Test failed:", error);
      process.exit(1);
    }
  }

  async createTestConversation(): Promise<void> {
    console.log(
      "\n📝 Step 1: Creating test conversation (simulating mobile app)",
    );

    await db.transact([
      db.tx.conversations[this.conversationId].update({
        userId: "test-mobile-user",
        title: "E2E Test Conversation",
        status: "active",
      }),
    ]);

    console.log(`✅ Created conversation: ${this.conversationId}`);
  }

  async setupResponseListener(): Promise<void> {
    console.log(
      "\n🎧 Step 2: Setting up response listener (simulating mobile app)",
    );

    // TODO: Figure out how to get subscribeQuery working properly
    // Currently getting: TypeError: undefined is not an object (evaluating 'this.querySubs.set')
    // Subscribe to messages in our test conversation using the proper pattern
    db.subscribeQuery(
      {
        messages: {
          $: {
            where: {
              conversationId: this.conversationId,
            },
          },
        },
      },
      (resp: any) => {
        if (resp.error) {
          console.error("❌ Subscription error:", resp.error.message);
          this.completeTest(false);
          return;
        }

        if (resp.data && resp.data.messages) {
          const assistantMessages = resp.data.messages.filter(
            (msg: any) =>
              msg.role === "assistant" && msg.id !== this.testMessageId,
          );

          if (assistantMessages.length > 0 && !this.responseReceived) {
            this.responseReceived = true;
            console.log("\n🎉 Step 4: Received Claude's response!");

            const response = assistantMessages[assistantMessages.length - 1];
            console.log(`🤖 Claude said: "${response.content}"`);

            this.completeTest(true);
          }
        }
      },
    );

    console.log("✅ Response listener active");
  }

  async sendTestMessage(): Promise<void> {
    console.log("\n📱 Step 3: Sending test message (simulating mobile app)");

    console.log(
      `💬 Sending: "Hello Claude! Please respond with exactly: 'E2E test successful'"`,
    );

    await db.transact([
      db.tx.messages[this.testMessageId].update({
        conversationId: this.conversationId,
        role: "user",
        content:
          "Hello Claude! Please respond with exactly: 'E2E test successful'",
      }),
    ]);

    console.log("✅ Test message sent to database");
    console.log("\n⏳ Waiting for host to:");
    console.log("   1. Detect the message");
    console.log("   2. Send it to Claude Code");
    console.log("   3. Store Claude's response");
    console.log("   4. Mobile listener receives response");
  }

  async waitForResponse(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set timeout for 30 seconds
      this.timeout = setTimeout(() => {
        if (!this.responseReceived) {
          console.log("\n⏰ Test timed out (30s)");
          console.log("\n🔍 Troubleshooting:");
          console.log("   - Is the host app running? (bun run host)");
          console.log("   - Is ANTHROPIC_API_KEY set in .env?");
          console.log("   - Check host console for error messages");
          console.log("   - Run: bun run check-messages");
          reject(new Error("Test timed out"));
        }
      }, 30000);

      // This will be called by completeTest
      this.completeTest = (success: boolean) => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        if (success) {
          console.log("\n🎉 END-TO-END TEST PASSED!");
          console.log("=".repeat(50));
          console.log(
            "✅ Mobile → Database → Host → Claude → Database → Mobile",
          );
          console.log("✅ Real-time synchronization working");
          console.log("✅ Remote control system fully functional");
          resolve();
        } else {
          reject(new Error("Test failed"));
        }
      };
    });
  }

  private completeTest: (success: boolean) => void = () => {};
}

async function runEndToEndTest() {
  const tester = new EndToEndTester();

  try {
    await tester.runTest();
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

console.log("🚀 Claude Code Remote Control - End-to-End Test");
console.log("📋 Prerequisites:");
console.log("   ✅ Environment configured");
console.log("   ⚠️  Make sure host app is running: bun run host");
console.log("");

runEndToEndTest();
