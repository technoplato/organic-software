#!/usr/bin/env bun

import { init } from "@instantdb/core";

// Initialize InstantDB client
const db = init({
  appId: process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

async function checkMessages() {
  console.log("🔍 Checking recent messages...");

  try {
    const result = await db.query({
      conversations: {},
      messages: {},
    });

    if (!result.conversations || result.conversations.length === 0) {
      console.log("📭 No conversations found");
      return;
    }

    console.log(`\n📋 Found ${result.conversations.length} conversation(s):`);
    
    for (const conversation of result.conversations) {
      console.log(`\n💬 ${conversation.title} (${conversation.id})`);
      console.log(`   User: ${conversation.userId} | Status: ${conversation.status}`);
      
      // Get messages for this conversation
      const conversationMessages = result.messages?.filter(
        (msg: any) => msg.conversationId === conversation.id
      ) || [];
      
      if (conversationMessages.length === 0) {
        console.log("   📭 No messages");
        continue;
      }

      // Sort messages by timestamp (assuming they have timestamp or created_at)
      conversationMessages.sort((a: any, b: any) => {
        const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
        const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
        return aTime - bTime;
      });

      console.log(`   📝 ${conversationMessages.length} message(s):`);
      
      for (const message of conversationMessages.slice(-5)) { // Show last 5 messages
        const role = message.role === "user" ? "👤" : 
                     message.role === "assistant" ? "🤖" : "⚙️";
        const content = message.content.length > 80 
          ? message.content.substring(0, 80) + "..."
          : message.content;
        
        console.log(`     ${role} ${message.role}: ${content}`);
        
        if (message.metadata?.source) {
          console.log(`       🏷️  Source: ${message.metadata.source}`);
        }
      }
    }

    console.log("\n✅ Message check complete");
    
  } catch (error) {
    console.error("❌ Error checking messages:", error);
    process.exit(1);
  }
}

checkMessages();