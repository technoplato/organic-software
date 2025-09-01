import { query } from "@anthropic-ai/claude-code";
import process from "process";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Validate required environment variables
if (
  !process.env.ANTHROPIC_API_KEY ||
  process.env.ANTHROPIC_API_KEY === "your-api-key-here"
) {
  console.error(
    "❌ ANTHROPIC_API_KEY is required. Please set it in your .env file.",
  );
  process.exit(1);
}

console.log("🧪 Testing Claude Code integration...");
console.log("Environment:", {
  ANTHROPIC_BEDROCK_BASE_URL: process.env.ANTHROPIC_BEDROCK_BASE_URL,
  CLAUDE_CODE_USE_BEDROCK: process.env.CLAUDE_CODE_USE_BEDROCK,
  CLAUDE_CODE_SKIP_BEDROCK_AUTH: process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + "...",
});

async function testClaude() {
  try {
    const testQuery = query({
      prompt: "Say 'Hello, I am working!' in exactly 5 words.",
      options: {
        model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        maxTurns: 1,
        cwd: process.cwd(),
        stderr: (data: string) => {
          if (data.trim()) {
            console.error("Claude Code stderr:", data.trim());
          }
        },
      },
    });

    let testResponse = "";
    let messageCount = 0;

    for await (const message of testQuery) {
      messageCount++;
      console.log(`Received message ${messageCount}:`, { type: message.type });

      if (message.type === "assistant") {
        // Extract text from the proper message structure
        const assistantMessage = message as any;
        if (assistantMessage.message?.content) {
          for (const content of assistantMessage.message.content) {
            if (content.type === "text") {
              testResponse += content.text || "";
              console.log("Assistant message content:", content.text);
            }
          }
        }
      }
    }

    if (!testResponse || testResponse.trim().length === 0) {
      console.log("❌ Claude Code test failed: No response received");
      console.log(`Total messages received: ${messageCount}`);
      process.exit(1);
    }

    console.log("✅ Claude Code test successful!");
    console.log("Test response:", testResponse.trim());
    process.exit(0);
  } catch (error) {
    console.error("❌ Claude Code test failed with error:", error);
    console.log("Error details:", {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split("\n").slice(0, 5).join("\n"),
    });
    process.exit(1);
  }
}

testClaude();
