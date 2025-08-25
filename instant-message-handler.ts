#!/usr/bin/env bun

import { init, tx, id } from "@instantdb/node";
import { query } from "@anthropic-ai/claude-code";
import process from "process";

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// Set up environment variables to match your Claude Code settings
// These will now use values from .env file or system environment
process.env.ANTHROPIC_BEDROCK_BASE_URL =
  process.env.ANTHROPIC_BEDROCK_BASE_URL;
process.env.CLAUDE_CODE_USE_BEDROCK =
  process.env.CLAUDE_CODE_USE_BEDROCK;
process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH =
  process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH;
process.env.ANTHROPIC_API_KEY =
  process.env.ANTHROPIC_API_KEY;
process.env.DISABLE_ERROR_REPORTING =
  process.env.DISABLE_ERROR_REPORTING;
process.env.DISABLE_TELEMETRY = process.env.DISABLE_TELEMETRY;
process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS =
  process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS;
process.env.MAX_THINKING_TOKENS = process.env.MAX_THINKING_TOKENS;
process.env.NODE_TLS_REJECT_UNAUTHORIZED =
  process.env.NODE_TLS_REJECT_UNAUTHORIZED;

// ID for app: Claude Code Remote Control
const APP_ID = process.env.INSTANTDB_APP_ID;

// Validate required environment variables
if (!APP_ID) {
  console.error("❌ INSTANTDB_APP_ID is required. Please set it in your .env file.");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-api-key-here") {
  console.error("❌ ANTHROPIC_API_KEY is required. Please set it in your .env file.");
  process.exit(1);
}

console.log("🚀 Starting Claude Code Remote Control Host (Improved)...");
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
  status?: "pending" | "processing" | "completed" | "error" | "replaced";
  metadata?: any;
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: string;
  claudeSessionId?: string;  // Claude SDK session ID for resume
  createdAt?: number;
  updatedAt?: number;
}

interface QueuedMessage {
  message: Message;
  addedAt: number;
}

class ClaudeRemoteControl {
  private processedMessageIds = new Set<string>();
  private isListening = false;
  private unsubscribeFn: (() => void) | null = null;
  private startupTime = Date.now();
  
  // Queue management
  private messageQueue: QueuedMessage[] = [];
  private isProcessing = false;
  private conversationsInProgress = new Set<string>();
  
  // Session tracking
  private conversationSessions = new Map<string, string>(); // conversationId -> claudeSessionId
  
  // Configuration
  private enableConcurrentConversations = true; // Enable concurrent processing by default

  // Helper function to safely update messages
  private async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    try {
      const txMessages = tx.messages;
      if (txMessages && txMessages[messageId]) {
        await db.transact([
          txMessages[messageId].update(updates)
        ]);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update message ${messageId}:`, error);
    }
  }

  // Helper function to safely update conversations
  private async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const txConversations = tx.conversations;
      if (txConversations && txConversations[conversationId]) {
        await db.transact([
          txConversations[conversationId].update(updates)
        ]);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update conversation ${conversationId}:`, error);
    }
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
    if (this.messageQueue.some(q => q.message.id === message.id)) {
      return;
    }

    // Add to queue (don't mark as processed yet - that happens after Claude processes it)
    console.log(`📥 Enqueueing message from conversation ${message.conversationId}`);
    this.messageQueue.push({
      message,
      addedAt: Date.now()
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
        q => !this.conversationsInProgress.has(q.message.conversationId)
      );
      
      if (nextIndex === -1) {
        // All conversations are currently being processed, wait a bit
        console.log("⏳ All conversations busy, waiting...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Remove message from queue
      const [queuedMessage] = this.messageQueue.splice(nextIndex, 1);
      if (!queuedMessage) continue;
      
      const message = queuedMessage.message;
      
      // Mark conversation as in progress
      this.conversationsInProgress.add(message.conversationId);
      
      console.log(`\n📤 Processing queued message from conversation ${message.conversationId}`);
      console.log(`   Queue depth: ${this.messageQueue.length} remaining`);
      console.log(`   Active conversations: ${this.conversationsInProgress.size}`);
      
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

  async getOrCreateSessionId(conversationId: string): Promise<string | undefined> {
    // Check if we have a cached session ID
    if (this.conversationSessions.has(conversationId)) {
      return this.conversationSessions.get(conversationId);
    }
    
    // Query the conversation to get the session ID using queryOnce
    try {
      const result = await db.queryOnce({
        conversations: {
          $: {
            where: {
              id: conversationId,
            },
          },
        },
      });
      
      if (result.data?.conversations?.length > 0) {
        const conversation = result.data.conversations[0];
        if (conversation?.claudeSessionId) {
          this.conversationSessions.set(conversationId, conversation.claudeSessionId);
          return conversation.claudeSessionId;
        }
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error querying conversation ${conversationId}:`, error);
      return undefined;
    }
  }

  async saveSessionId(conversationId: string, sessionId: string): Promise<void> {
    // Cache the session ID
    this.conversationSessions.set(conversationId, sessionId);
    
    // Update the conversation with the session ID
    await this.updateConversation(conversationId, {
      claudeSessionId: sessionId,
      updatedAt: Date.now(),
    });
  }

  // NOTE: getConversationContext() method removed - we now rely on Claude's
  // session resumption to maintain context instead of database message injection

  async processMessage(message: Message): Promise<void> {
    // Skip if already processed (should not happen as we check in enqueueMessage)
    if (this.processedMessageIds.has(message.id)) {
      console.warn(`⚠️ Message ${message.id} already processed, skipping`);
      return;
    }

    console.log(`\n📱 Processing message: "${message.content.substring(0, 50)}..."`);
    console.log(`   From conversation: ${message.conversationId}`);

    // Update message status to processing
    await this.updateMessage(message.id, { status: "processing" });

    // Send immediate acknowledgment response
    const acknowledgmentId = id();
    const acknowledgmentMessages = [
      "I received your message and I'm working on it now...",
      "Got it! Let me handle that for you...",
      "Message received! Processing your request...",
      "I'm on it! Working on your request now...",
      "Understood! Let me take care of that...",
    ];
    
    const randomAck = acknowledgmentMessages[Math.floor(Math.random() * acknowledgmentMessages.length)];
    
    await this.updateMessage(acknowledgmentId, {
      conversationId: message.conversationId,
      role: "assistant",
      content: randomAck,
      timestamp: Date.now(),
      status: "completed",
      metadata: { type: "acknowledgment" },
    });
    
    console.log(`📨 Sent immediate acknowledgment: "${randomAck}"`);

    try {
      // Get or create session ID for this conversation
      const sessionId = await this.getOrCreateSessionId(message.conversationId);
      
      // Send to Claude Code using query API with session resumption
      // Based on tests/test-transitive-sessions.ts: rely on Claude's session context first
      console.log("🤖 Sending to Claude...");
      if (sessionId) {
        console.log(`   📎 Resuming Claude session: ${sessionId} (Claude maintains context)`);
      } else {
        console.log(`   🆕 Starting new Claude session`);
      }
      console.log(`   🔄 Conversation: ${message.conversationId}`);
      console.log(`   💬 Message: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`)
      
      const startTime = Date.now();
      let newSessionId: string | undefined;
      
      // Process message asynchronously if concurrent mode is enabled
      if (this.enableConcurrentConversations) {
        // Delete the acknowledgment message after sending the real response
        const ackId = acknowledgmentId;
        await this.updateMessage(ackId, { status: "replaced" });
      }
      
      const claudeQuery = query({
        prompt: message.content,  // Send original message, let Claude session handle context
        options: {
          model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
          maxTurns: 10,
          cwd: process.cwd(),
          permissionMode: "bypassPermissions",  // Allow all tools without approval
          allowedTools: [
            "Read", "Write", "Edit", "MultiEdit",
            "Bash", "BashOutput", "KillBash",
            "Glob", "Grep", "LS",
            "WebFetch", "WebSearch",
            "NotebookEdit",
            "TodoWrite",
            "ExitPlanMode",
            "Task",
            "mcp__*"  // Allow all MCP tools
          ],
          resume: sessionId,  // Use correct parameter name for session resumption
          stderr: (data: string) => {
            if (data.trim()) {
              console.error("Claude stderr:", data.trim());
            }
          },
        }
      });
      
      let fullResponse = "";
      
      for await (const claudeMessage of claudeQuery) {
        // Capture the session ID from multiple message types
        if (claudeMessage.type === "system") {
          if (claudeMessage.subtype === "init" && claudeMessage.session_id) {
            newSessionId = claudeMessage.session_id;
            console.log(`   📌 Session ID from init: ${newSessionId}`);
          }
        }
        
        // Also try to capture session ID from other message types
        if ((claudeMessage as any).session_id && !newSessionId) {
          newSessionId = (claudeMessage as any).session_id;
          console.log(`   📌 Session ID from ${claudeMessage.type}: ${newSessionId}`);
        }
        
        if (claudeMessage.type === "assistant") {
          const assistantMessage = claudeMessage as any;
          if (assistantMessage.message?.content) {
            for (const content of assistantMessage.message.content) {
              if (content.type === "text") {
                fullResponse += content.text || "";
              }
            }
          }
        }
      }

      // Handle transitive session ID tracking
      // Based on salvinoarmati's discovery: each response generates a NEW session ID
      // that must be used for the next message in the conversation
      // See tests/test-transitive-sessions.ts for the working implementation pattern
      if (newSessionId) {
        if (!sessionId) {
          // First message in conversation - save the new session ID
          await this.saveSessionId(message.conversationId, newSessionId);
          console.log(`   💾 Initial session ID saved: ${newSessionId}`);
        } else if (newSessionId !== sessionId) {
          // Different session ID - this is EXPECTED with transitive tracking
          console.log(`   🔄 Session transition: ${sessionId} → ${newSessionId}`);
          await this.saveSessionId(message.conversationId, newSessionId);
          console.log(`   💾 Updated to new session ID: ${newSessionId}`);
        } else {
          // Same session ID - unexpected with transitive pattern
          console.warn(`   ⚠️ Unexpected: Session ID didn't change: ${sessionId}`);
        }
      } else if (!sessionId) {
        // If we didn't get a session ID and don't have one cached, this is an error
        console.warn(`   ⚠️ No session ID captured for conversation ${message.conversationId}`);
      }
      
      // Note: With proper transitive session tracking (tests/test-transitive-sessions.ts),
      // Claude should maintain conversation context through session resumption.
      // Database context injection is removed to rely on Claude's native session management.

      const processingTime = Date.now() - startTime;
      const assistantMessageId = id();

      // Store assistant response
      await this.updateMessage(assistantMessageId, {
        conversationId: message.conversationId,
        role: "assistant",
        content: fullResponse || "No response from Claude",
        timestamp: Date.now(),
        status: "completed",
      });

      // Update original message status to completed
      await this.updateMessage(message.id, { status: "completed" });

      // Mark message as processed now that Claude has responded
      this.processedMessageIds.add(message.id);

      console.log(`✅ Claude responded (${fullResponse.length} chars in ${processingTime}ms)`);
      console.log(`📝 Response saved to conversation`);
    } catch (error) {
      console.error("❌ Error processing message:", error);
      
      // Update message status to error
      await this.updateMessage(message.id, { status: "error" });
      
      // Mark message as processed even in error case
      this.processedMessageIds.add(message.id);
      
      const errorMessageId = id();

      await this.updateMessage(errorMessageId, {
        conversationId: message.conversationId,
        role: "system",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
        status: "error",
      });
    }
  }

  async startRemoteListener(): Promise<void> {
    if (this.isListening) {
      console.log("⚠️ Already listening for remote messages");
      return;
    }

    console.log("🎧 Starting remote message listener...");
    this.isListening = true;

    // Subscribe to messages in real-time
    this.unsubscribeFn = db.subscribeQuery({ messages: {} }, (resp: any) => {
      if (resp.error) {
        console.error("❌ Subscription error:", resp.error.message);
        return;
      }
      
      if (resp.data && resp.data.messages) {
        console.log(`📬 Received ${resp.data.messages.length} messages from subscription`);
        // Enqueue new messages for processing
        for (const message of resp.data.messages) {
          this.enqueueMessage(message as Message);
        }
      }
    });

    console.log("✅ Remote listener active - waiting for messages from mobile app...");
    console.log("🔧 Claude has full tool access with bypass permissions");
  }

  async stopRemoteListener(): Promise<void> {
    this.isListening = false;
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
    console.log("🛑 Remote message listener stopped");
  }

  async showStats(): Promise<void> {
    try {
      const result = await db.queryOnce({ 
        messages: {},
        conversations: {} 
      });
      
      if (result.data) {
        const messageCount = result.data.messages?.length || 0;
        const conversationCount = result.data.conversations?.length || 0;
        const sessionsActive = this.conversationSessions.size;
        
        console.log(`\n📊 Database Stats:`);
        console.log(`   • ${conversationCount} conversations`);
        console.log(`   • ${messageCount} messages`);
        console.log(`   • ${this.processedMessageIds.size} messages processed this session`);
        console.log(`   • ${this.messageQueue.length} messages in queue`);
        console.log(`   • ${this.conversationsInProgress.size} conversations being processed`);
        console.log(`   • ${sessionsActive} Claude sessions cached`);
        console.log(`   • Concurrent mode: ${this.enableConcurrentConversations ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }
}

// Main application logic
async function main() {
  const remoteControl = new ClaudeRemoteControl();
  
  // Test Claude Code first
  console.log("\n🧪 Testing Claude Code connection...");
  try {
    const testQuery = query({
      prompt: "Say 'Ready' in one word.",
      options: {
        model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        maxTurns: 1,
        cwd: process.cwd(),
        permissionMode: "bypassPermissions",
      }
    });

    let testResponse = "";
    for await (const message of testQuery) {
      if (message.type === "assistant") {
        const assistantMessage = message as any;
        if (assistantMessage.message?.content) {
          for (const content of assistantMessage.message.content) {
            if (content.type === "text") {
              testResponse += content.text || "";
            }
          }
        }
      }
    }

    if (testResponse) {
      console.log("✅ Claude Code is working!");
    } else {
      throw new Error("No response from Claude");
    }
  } catch (error) {
    console.error("❌ Claude Code test failed:", error);
    console.log("⚠️  Make sure Claude Code is properly configured");
    process.exit(1);
  }
  
  // Start the real-time message listener
  await remoteControl.startRemoteListener();
  
  // Show current stats
  await remoteControl.showStats();
  
  console.log("\n💡 Remote control is now active!");
  console.log("   📱 Send messages from your mobile app");  
  console.log("   🤖 Claude will process with full tool access");
  console.log("   🔄 Conversations maintain context across messages");
  console.log("   ⏹️  Press Ctrl+C to stop\n");

  // Show stats periodically
  setInterval(async () => {
    await remoteControl.showStats();
  }, 30000); // Every 30 seconds

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log("\n🛑 Shutting down...");
    await remoteControl.stopRemoteListener();
    await remoteControl.showStats();
    db.shutdown();
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

// Run the application
main().catch((error) => {
  console.error("❌ Application error:", error);
  db.shutdown();
  process.exit(1);
});