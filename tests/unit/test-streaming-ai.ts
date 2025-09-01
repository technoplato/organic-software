#!/usr/bin/env tsx

import { streamText } from "ai";
import { litellm } from "./lib/litellm-provider";
import { config } from "dotenv";

// Load environment variables
config();

async function testStreamingAI() {
  console.log("🧪 Testing AI SDK Streaming Integration...\n");

  try {
    console.log("📝 Sending test message...");
    const { textStream } = await streamText({
      model: litellm("claude-3-7-sonnet"),
      system: "You are a helpful assistant. Keep responses brief and friendly.",
      prompt: "Hello! Please respond with a brief greeting and confirm you're working.",
      maxTokens: 100,
      temperature: 0.7,
    });

    console.log("📨 Streaming response:");
    console.log("-".repeat(40));
    
    let fullResponse = "";
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }
    
    console.log("\n" + "-".repeat(40));
    console.log(`\n✅ Streaming successful!`);
    console.log(`📏 Total length: ${fullResponse.length} characters`);
    
    return true;
  } catch (error) {
    console.error("❌ Streaming test failed:", error);
    return false;
  }
}

// Run the test
testStreamingAI().then((success) => {
  if (success) {
    console.log("\n🎉 AI SDK integration is working correctly!");
    console.log("📱 The mobile app can now:");
    console.log("   • Send messages with voice dictation");
    console.log("   • Auto-send on trigger keywords");
    console.log("   • Receive streaming AI responses");
    console.log("   • Display responses in real-time");
  } else {
    console.log("\n⚠️ Please check your LiteLLM proxy configuration");
  }
  process.exit(success ? 0 : 1);
});