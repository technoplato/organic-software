#!/usr/bin/env tsx

import { init, tx, id } from "@instantdb/node";
import { streamText } from "ai";
import { litellm } from "./lib/litellm-provider";
import process from "process";
import { config } from "dotenv";
import { logger } from "./lib/logger";

// Load environment variables
config();

const APP_ID = process.env.INSTANTDB_APP_ID;

if (!APP_ID) {
  logger.error(
    "❌ INSTANTDB_APP_ID is required. Please set it in your .env file."
  );
  process.exit(1);
}

logger.info("🚀 Starting AI Message Handler with Streaming Support...");
logger.info("📱 App ID:", APP_ID);

const db = init({ appId: APP_ID });

console.log("✅ InstantDB initialized");

// Types
interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  status?: string;
  isStreaming?: boolean;
  streamChunks?: string[];
  finalContent?: string;
}

class AIMessageHandler {
  private processedMessageIds = new Set<string>();
  private startupTime = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private hostHeartbeatId: string | null = null;

  async updateMessage(
    messageId: string,
    updates: Partial<Message>
  ): Promise<void> {
    try {
      const txMessages = tx.messages;
      if (txMessages && txMessages[messageId]) {
        await db.transact([txMessages[messageId].update(updates)]);
      }
    } catch (error) {
      logger.warn(`⚠️ Could not update message ${messageId}:`, error);
    }
  }

  startHostHeartbeat(intervalMs: number = 10000) {
    const writeHeartbeat = async () => {
      try {
        if (!this.hostHeartbeatId) {
          this.hostHeartbeatId = id();
        }
        await db.transact([
          (tx as any).heartbeats[this.hostHeartbeatId].update({
            id: this.hostHeartbeatId,
            kind: "host",
            lastSeenAt: Date.now(),
          }),
        ]);
      } catch (err) {
        logger.warn("⚠️ Failed to write host heartbeat:", err);
      }
    };

    writeHeartbeat();
    this.heartbeatInterval = setInterval(writeHeartbeat, intervalMs) as any;
  }

  stopHostHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async processMessage(message: Message): Promise<void> {
    if (this.processedMessageIds.has(message.id)) {
      return;
    }

    if (message.role !== "user") {
      this.processedMessageIds.add(message.id);
      return;
    }

    if (message.timestamp && message.timestamp < this.startupTime) {
      this.processedMessageIds.add(message.id);
      logger.info(`⏭️ Skipping old message: ${message.id}`);
      return;
    }

    console.log(
      `\n📱 Processing message: "${message.content.substring(0, 50)}..."`
    );

    await this.updateMessage(message.id, { status: "processing" });

    try {
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

      logger.info("🤖 Sending to AI with streaming...");

      const startTime = Date.now();
      let fullResponse = "";
      const chunks: string[] = [];

      const { textStream } = await streamText({
        model: litellm("claude-3-7-sonnet"),
        system: "You are a helpful AI assistant. Be concise and friendly.",
        prompt: message.content,
        // maxTokens: 2000,
        temperature: 0.7,
      });

      for await (const chunk of textStream) {
        fullResponse += chunk;
        chunks.push(chunk);

        await this.updateMessage(assistantMessageId, {
          streamChunks: chunks,
          content: fullResponse,
          isStreaming: true,
        });

        if (chunks.length % 10 === 0) {
          logger.info(`   Streaming... ${fullResponse.length} chars`);
        }
      }

      await this.updateMessage(assistantMessageId, {
        finalContent: fullResponse,
        content: fullResponse,
        // maxTokens: 10, // removed to fix type error
        isStreaming: false,
      });

      await this.updateMessage(message.id, { status: "completed" });
      this.processedMessageIds.add(message.id);

      const processingTime = Date.now() - startTime;
      logger.info(
        `✅ AI responded (${fullResponse.length} chars in ${processingTime}ms)`
      );
    } catch (error) {
      logger.error("❌ Error processing message:", error);
      await this.updateMessage(message.id, { status: "error" });
      this.processedMessageIds.add(message.id);
    }
  }

  async startListener(): Promise<void> {
    logger.info("🎧 Starting message listener...");

    db.subscribeQuery({ messages: {} }, (resp: any) => {
      if (resp.error) {
        logger.error("❌ Subscription error:", resp.error.message);
        return;
      }

      if (resp.data?.messages) {
        for (const message of resp.data.messages) {
          this.processMessage(message as Message);
        }
      }
    });

    logger.info("✅ Listener active - waiting for messages...");
  }

  async showStats(): Promise<void> {
    try {
      const result = await db.queryOnce({
        messages: {},
        heartbeats: {},
      });

      if (result.data) {
        const messageCount = result.data.messages?.length || 0;
        const heartbeats = result.data.heartbeats || [];
        const hostBeat = heartbeats.find((h: any) => h.kind === "host");
        const now = Date.now();
        const hostOnline = hostBeat
          ? now - (hostBeat.lastSeenAt || 0) < 20000
          : false;

        logger.info(`\n📊 Stats:`);
        logger.info(`   • ${messageCount} messages`);
        logger.info(`   • Host: ${hostOnline ? "🟢 online" : "🔴 offline"}`);
        logger.info(
          `   • ${this.processedMessageIds.size} processed this session`
        );
      }
    } catch (error) {
      logger.error("Error fetching stats:", error);
    }
  }
}

// Main
async function main() {
  const handler = new AIMessageHandler();

  // Test AI SDK
  logger.info("\n🧪 Testing AI SDK...");
  try {
    const { text } = await streamText({
      model: litellm("claude-3-7-sonnet"),
      prompt: "Say 'Ready' in one word.",
      maxTokens: 10,
    });
    logger.info("✅ AI SDK working!");
    logger.info(`   Response: ${text}`);
  } catch (error) {
    logger.error("❌ AI SDK test failed:", error);
    process.exit(1);
  }

  await handler.startListener();
  handler.startHostHeartbeat(10000);
  await handler.showStats();

  logger.info("\n💡 AI Message Handler is active!");
  logger.info("   📱 Send messages from your mobile app");
  logger.info("   🤖 AI will respond with streaming text");
  logger.info("   ⏹️  Press Ctrl+C to stop\n");

  setInterval(() => handler.showStats(), 30000);

  process.on("SIGINT", async () => {
    logger.info("\n🛑 Shutting down...");
    handler.stopHostHeartbeat();
    await handler.showStats();
    db.shutdown();
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch((error) => {
  logger.error("❌ Application error:", error);
  db.shutdown();
  process.exit(1);
});
