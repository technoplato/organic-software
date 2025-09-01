#!/usr/bin/env tsx

import { init, tx, id } from "@instantdb/node";
// Comment out Claude Code for now
// import { query } from "@anthropic-ai/claude-code";
import { streamText } from "ai";
import { litellm } from "./lib/litellm-provider";
import process from "process";
import fs from "fs";
import path from "path";

// Load environment variables from .env file
import { config } from "dotenv";
config();

// ID for app: Claude Code Remote Control
const APP_ID = process.env.INSTANTDB_APP_ID;

// Validate required environment variables
if (!APP_ID) {
  console.error(
    "❌ INSTANTDB_APP_ID is required. Please set it in your .env file."
  );
  process.exit(1);
}

console.log("🚀 Starting AI Message Handler with Streaming Support...");
console.log("📱 App ID:", APP_ID);
console.log("🌍 Environment:", {
  nodeVersion: process.version,
  platform: process.platform,
});

// Initialize the database with just the app ID
const db = init({
  appId: APP_ID,
});

console.log("✅ InstantDB initialized");

// Define database schema types
interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  status?:
    | "pending"
    | "processing"
    | "completed"
    | "error"
    | "replaced"
    | "streaming";
  metadata?: any;
  isStreaming?: boolean;
  streamChunks?: string[];
  finalContent?: string;
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: string;
  claudeSessionId?: string; // Claude SDK session ID for resume
  createdAt?: number;
  updatedAt?: number;
}

// Heartbeat entries for liveness monitoring between host and mobile
interface Heartbeat {
  id: string; // e.g., 'host' | 'mobile'
  kind?: string; // 'host' | 'mobile' | other
  lastSeenAt: number;
  note?: string;
}

// Basic Issue structure to align with mobile app queries
interface Issue {
  id: string;
  title: string;
  description?: string;
  priority?: "High" | "Medium" | "Low";
  status?: "Todo" | "In Progress" | "Done";
  createdAt?: number;
  updatedAt?: number;
  context?: any;
  conversationId?: string;
  messageId?: string;
}

interface QueuedMessage {
  message: Message;
  addedAt: number;
}

interface Error {
  id: string;
  type: string;
  errorType: string;
  content: string;
  source: string;
  timestamp: number;
  status: "pending" | "processing" | "completed" | "failed";
  metadata?: any;
  resolution?: string;
  resolvedAt?: number;
  errorMessage?: string;
}

interface QueuedError {
  error: Error;
  addedAt: number;
}

class AIMessageHandler {
  private processedMessageIds = new Set<string>();
  private isListening = false;
  private unsubscribeFn: (() => void) | null = null;
  private startupTime = Date.now();

  // Queue management
  private messageQueue: QueuedMessage[] = [];
  private errorQueue: QueuedError[] = [];
  private isProcessing = false;
  private isProcessingErrors = false;
  private conversationsInProgress = new Set<string>();
  private processedErrorIds = new Set<string>();

  // Session tracking
  private conversationSessions = new Map<string, string>(); // conversationId -> sessionId

  // Configuration
  private enableConcurrentConversations = true; // Enable concurrent processing by default
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private hostHeartbeatId: string | null = null;
  private llmPreamble: string | null = null;

  // Send Expo push notifications to all known devices with a preview
  private async sendExpoPushNotifications(
    conversationId: string,
    fullResponse: string
  ): Promise<void> {
    try {
      const res = await db.queryOnce({ devices: {} as any });
      const devices: any[] = (res.data?.devices || []).filter(
        (d: any) => typeof d?.pushToken === "string"
      );
      if (devices.length === 0) return;
      const snippet = (fullResponse || "").replace(/\s+/g, " ").slice(0, 140);
      const payload = devices.map((d: any) => ({
        to: d.pushToken,
        title: "AI responded",
        body: snippet.length ? snippet : "Response ready",
        data: { conversationId, preview: snippet },
      }));
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      } as any);
      this.log("push", "expo push sent", {
        count: devices.length,
        conversationId,
      }).catch(() => {});
    } catch (err) {
      console.warn("⚠️ Failed to send Expo push:", err);
    }
  }

  // Helper function to safely update messages
  private async updateMessage(
    messageId: string,
    updates: Partial<Message>
  ): Promise<void> {
    try {
      const txMessages = tx.messages;
      if (txMessages && txMessages[messageId]) {
        await db.transact([txMessages[messageId].update(updates)]);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update message ${messageId}:`, error);
    }
  }

  // Helper: structured log to InstantDB (best-effort)
  private async log(kind: string, message: string, meta?: any): Promise<void> {
    try {
      const logId = id();
      await db.transact([
        (tx as any).logs[logId].update({
          id: logId,
          kind,
          message,
          meta: meta || {},
          timestamp: Date.now(),
        }),
      ]);
    } catch {}
  }

  // Helper function to safely update conversations
  private async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<void> {
    try {
      const txConversations = tx.conversations;
      if (txConversations && txConversations[conversationId]) {
        await db.transact([txConversations[conversationId].update(updates)]);
      }
    } catch (error) {
      console.warn(
        `⚠️ Could not update conversation ${conversationId}:`,
        error
      );
    }
  }

  // Helper: write host heartbeat regularly so the mobile client can reflect status
  startHostHeartbeat(intervalMs: number = 10000) {
    const ensureIdAndWrite = async () => {
      try {
        // Ensure we have a stable UUID id for host heartbeat
        if (!this.hostHeartbeatId) {
          const res = await db.queryOnce({
            heartbeats: { $: { where: { kind: "host" }, limit: 1 } },
          });
          const existing = res.data?.heartbeats?.[0];
          if (existing?.id) {
            this.hostHeartbeatId = existing.id;
          } else {
            this.hostHeartbeatId = id();
          }
        }
        await db.transact([
          (tx as any).heartbeats[this.hostHeartbeatId].update({
            id: this.hostHeartbeatId,
            kind: "host",
            lastSeenAt: Date.now(),
          }),
        ]);
      } catch (err) {
        console.warn("⚠️ Failed to write host heartbeat:", err);
      }
    };
    // write once immediately, then on an interval
    ensureIdAndWrite();
    this.heartbeatInterval = setInterval(ensureIdAndWrite, intervalMs) as any;
  }

  stopHostHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Load LLM preamble from docs/llm-prompt.md (once), fallback to built-in
  private loadPreamble(): string {
    if (this.llmPreamble) return this.llmPreamble;
    const fallback = `
You are a helpful AI assistant integrated with the Organic Software project.
Context:
- A React Native/Expo mobile app communicates with a Node host via InstantDB.
- You receive messages from users and respond with helpful information.
- The mobile app supports voice dictation with auto-send on trigger keywords.
- Responses are streamed back to the mobile app in real-time.

Be concise, helpful, and friendly in your responses.
`;
    try {
      const p = path.join(process.cwd(), "docs", "llm-prompt.md");
      const content = fs.readFileSync(p, "utf8");
      this.llmPreamble = content || fallback;
    } catch {
      this.llmPreamble = fallback;
    }
    return this.llmPreamble!;
  }

  async enqueueMessage(message: Message): Promise<void> {
    // Skip if we've already processed this message
    if (this.processedMessageIds.has(message.id)) {
      return;
    }

    // Only process user messages (not assistant or system messages)
    if (message.role !== "user") {
      this.processedMessageIds.add(message.id);
      return;
    }

    // Only process messages created after server startup
    if (message.timestamp && message.timestamp < this.startupTime) {
      this.processedMessageIds.add(message.id);
      console.log(`⏭️ Skipping old message from before startup: ${message.id}`);
      return;
    }

    // Check if message is already in queue
    if (this.messageQueue.some((q) => q.message.id === message.id)) {
      return;
    }

    // Add to queue (don't mark as processed yet - that happens after AI processes it)
    console.log(
      `📥 Enqueueing message from conversation ${message.conversationId}`
    );
    this.messageQueue.push({
      message,
      addedAt: Date.now(),
    });

    // Only update status if it's not already set
    if (!message.status || message.status !== "pending") {
      await this.updateMessage(message.id, { status: "pending" });
    }

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      // Sort queue by timestamp (FIFO within each conversation)
      this.messageQueue.sort((a, b) => a.addedAt - b.addedAt);

      // Find next message from a conversation that's not currently being processed
      const nextIndex = this.messageQueue.findIndex(
        (q) => !this.conversationsInProgress.has(q.message.conversationId)
      );

      if (nextIndex === -1) {
        // All conversations are currently being processed, wait a bit
        console.log("⏳ All conversations busy, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Remove message from queue
      const [queuedMessage] = this.messageQueue.splice(nextIndex, 1);
      if (!queuedMessage) continue;

      const message = queuedMessage.message;

      // Mark conversation as in progress
      this.conversationsInProgress.add(message.conversationId);

      console.log(
        `\n📤 Processing queued message from conversation ${message.conversationId}`
      );
      console.log(`   Queue depth: ${this.messageQueue.length} remaining`);
      console.log(
        `   Active conversations: ${this.conversationsInProgress.size}`
      );

      try {
        await this.processMessage(message);
      } catch (error) {
        console.error("❌ Error processing message:", error);
      } finally {
        // Mark conversation as no longer in progress
        this.conversationsInProgress.delete(message.conversationId);
      }
    }

    this.isProcessing = false;
    console.log("✅ Queue processing complete");
  }

  async processMessage(message: Message): Promise<void> {
    // Skip if already processed (should not happen as we check in enqueueMessage)
    if (this.processedMessageIds.has(message.id)) {
      console.warn(`⚠️ Message ${message.id} already processed, skipping`);
      return;
    }

    console.log(
      `\n📱 Processing message: "${message.content.substring(0, 50)}..."`
    );
    console.log(`   From conversation: ${message.conversationId}`);
    this.log("handler", "processing message", {
      conversationId: message.conversationId,
      messageId: message.id,
    }).catch(() => {});

    // Update message status to processing
    await this.updateMessage(message.id, { status: "processing" });

    try {
      // Create assistant message for streaming response
      const assistantMessageId = id();
      await this.updateMessage(assistantMessageId, {
        conversationId: message.conversationId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        status: "streaming",
        isStreaming: true,
        streamChunks: [],
      });

      console.log("🤖 Sending to AI with streaming...");
      this.log("handler", "sending to AI", {
        conversationId: message.conversationId,
        messageId: message.id,
      }).catch(() => {});

      const startTime = Date.now();
      let fullResponse = "";
      const chunks: string[] = [];

      // Use AI SDK with streaming
      const { textStream } = await streamText({
        model: litellm("claude-3-7-sonnet"),
        system: this.loadPreamble(),
        prompt: message.content,
        // maxTokens: 2000, // removed to fix type error
        temperature: 0.7,
      });

      // Stream chunks to InstantDB in real-time
      for await (const chunk of textStream) {
        fullResponse += chunk;
        chunks.push(chunk);

        // Update message with new chunk
        await this.updateMessage(assistantMessageId, {
          streamChunks: chunks,
          content: fullResponse,
          isStreaming: true,
        });

        // Log streaming progress periodically
        if (chunks.length % 10 === 0) {
          console.log(`   Streaming... ${fullResponse.length} chars`);
        }
      }

      // Finalize the message
      await this.updateMessage(assistantMessageId, {
        finalContent: fullResponse,
        content: fullResponse,
        status: "completed",
        isStreaming: false,
      });

      // Update original message status to completed
      await this.updateMessage(message.id, { status: "completed" });

      // Mark message as processed now that AI has responded
      this.processedMessageIds.add(message.id);

      const processingTime = Date.now() - startTime;
      console.log(
        `✅ AI responded (${fullResponse.length} chars in ${processingTime}ms)`
      );
      console.log(
        `   Response preview: "${fullResponse.substring(0, 100)}..."`
      );

      // Send push notification with response preview
      await this.sendExpoPushNotifications(
        message.conversationId,
        fullResponse
      );

      // Update conversation with last activity
      await this.updateConversation(message.conversationId, {
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error processing message:", error);
      await this.updateMessage(message.id, { status: "error" });

      // Still mark as processed to avoid infinite retries
      this.processedMessageIds.add(message.id);
    }
  }

  async startMessageListener(): Promise<void> {
    if (this.isListening) {
      console.log("⚠️ Already listening to messages");
      return;
    }

    console.log("🎧 Starting message listener...");

    // Subscribe to messages
    this.unsubscribeFn = db.subscribeQuery({ messages: {} }, (resp: any) => {
      if (resp.error) {
        console.error("❌ Subscription error:", resp.error.message);
        return;
      }

      if (resp.data?.messages) {
        // Process each message
        for (const message of resp.data.messages) {
          // CRITICAL: Mark as processed IMMEDIATELY to prevent re-processing
          // This must happen BEFORE any async operations
          if (!this.processedMessageIds.has(message.id)) {
            // Add to processed set FIRST
            if (
              message.role === "user" &&
              message.timestamp &&
              message.timestamp >= this.startupTime
            ) {
              // Only enqueue if it's a new user message
              this.enqueueMessage(message as Message);
            } else {
              // Mark non-user messages and old messages as processed
              this.processedMessageIds.add(message.id);
              if (message.timestamp && message.timestamp < this.startupTime) {
                console.log(`⏭️ Skipping old message: ${message.id}`);
              }
            }
          }
        }
      }
    });

    this.isListening = true;
    console.log("✅ Listener active - waiting for messages...");
  }

  async stopMessageListener(): Promise<void> {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
    this.isListening = false;
    console.log("🛑 Message listener stopped");
  }

  async showStats(): Promise<void> {
    try {
      const result = await db.queryOnce({
        messages: {},
        heartbeats: {},
        issues: {},
      });

      if (result.data) {
        const messageCount = result.data.messages?.length || 0;
        const issueCount = result.data.issues?.length || 0;
        const heartbeats = result.data.heartbeats || [];
        const hostBeat = heartbeats.find((h: any) => h.kind === "host");
        const now = Date.now();
        const hostOnline = hostBeat
          ? now - (hostBeat.lastSeenAt || 0) < 20000
          : false;

        console.log(`\n📊 Stats:`);
        console.log(`   • ${messageCount} messages`);
        console.log(`   • ${issueCount} issues`);
        console.log(`   • Host: ${hostOnline ? "🟢 online" : "🔴 offline"}`);
        console.log(
          `   • ${this.processedMessageIds.size} processed this session`
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }
}

// Test AI SDK before starting
async function testAISDK(): Promise<void> {
  console.log("\n🧪 Testing AI SDK...");
  try {
    const { text } = await streamText({
      model: litellm("claude-3-7-sonnet"),
      prompt: "Say 'Ready' in one word.",
    });
    console.log("✅ AI SDK working!");
    console.log(`   Response: ${text}`);
  } catch (error) {
    console.error("❌ AI SDK test failed:", error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Test AI SDK first
    await testAISDK();

    // Create and start handler
    const handler = new AIMessageHandler();
    await handler.startMessageListener();
    handler.startHostHeartbeat(10000);

    // Show initial stats
    await handler.showStats();

    console.log("\n💡 AI Message Handler is active!");
    console.log("   📱 Send messages from your mobile app");
    console.log("   🤖 AI will respond with streaming text");
    console.log("   ⏹️  Press Ctrl+C to stop\n");

    // Show stats periodically
    const statsInterval = setInterval(() => {
      handler.showStats();
    }, 30000);

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nGracefully shutting down InstantDB connections...");
      clearInterval(statsInterval);
      handler.stopHostHeartbeat();
      await handler.stopMessageListener();
      await handler.showStats();
      console.log("Goodbye!");
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error("❌ Application error:", error);
  process.exit(1);
});
