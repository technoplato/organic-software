#!/usr/bin/env tsx

import { generateText, streamText } from "ai";
import { litellm } from "./lib/litellm-provider";
import { z } from "zod";
import { config } from "dotenv";

// Load environment variables
config();

// Test 1: Simple JSON extraction using regular text generation
async function testJsonExtraction() {
  console.log("🧪 Test 1: JSON extraction with generateText\n");

  try {
    const { text } = await generateText({
      model: litellm("claude-3-7-sonnet"),
      system:
        "You are a JSON generator. Always respond with valid JSON only, no other text.",
      prompt: `Extract command and priority from this message as JSON:
      
      Message: "Create an issue about the login bug, it's urgent!"
      
      Return JSON with:
      - command: one of CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, or NONE
      - priority: low, medium, or high
      - reason: brief explanation`,
      maxTokens: 200,
    });

    console.log("Raw response:", text);

    try {
      const parsed = JSON.parse(text);
      console.log("✅ Parsed JSON:", JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("⚠️ Could not parse JSON from response");
    }
    console.log();
  } catch (error) {
    console.error("❌ Failed:", error);
  }
}

// Test 2: Stream of consciousness with structured response
async function testStreamOfConsciousness() {
  console.log("🧪 Test 2: Stream of consciousness analysis\n");

  const stream = `
    Been debugging the auth system all morning, really frustrating. 
    Need to query the database for failed login attempts.
    Had too much coffee, feeling jittery. The code is messy and needs refactoring.
  `;

  try {
    const { text } = await generateText({
      model: litellm("claude-3-7-sonnet"),
      system: "You are a text analyzer. Respond only with valid JSON.",
      prompt: `Analyze this stream of consciousness and return JSON with:
      - technical: array of technical aspects
      - personal: array of personal/emotional aspects  
      - command: main action (CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, or NONE)
      - summary: one sentence summary
      
      Text: "${stream}"`,
      maxTokens: 300,
    });

    console.log("Raw response:", text);

    try {
      const parsed = JSON.parse(text);
      console.log("\n✅ Parsed analysis:");
      console.log("Technical:", parsed.technical);
      console.log("Personal:", parsed.personal);
      console.log("Command:", parsed.command);
      console.log("Summary:", parsed.summary);
    } catch (e) {
      console.log("⚠️ Could not parse JSON from response");
    }
    console.log();
  } catch (error) {
    console.error("❌ Failed:", error);
  }
}

// Test 3: Command enumeration with Zod validation
async function testCommandEnum() {
  console.log("🧪 Test 3: Command extraction with post-validation\n");

  // Define our schema for validation
  const CommandSchema = z.object({
    command: z.enum([
      "CREATE_ISSUE",
      "UPDATE_STATUS",
      "QUERY_DATABASE",
      "NONE",
    ]),
    confidence: z.number().min(0).max(1),
  });

  const messages = [
    "Create an issue about the memory leak",
    "Just thinking about lunch",
    "Query the database for user signups",
  ];

  for (const msg of messages) {
    try {
      const { text } = await generateText({
        model: litellm("claude-3-7-sonnet"),
        system:
          'Extract commands from messages. Respond only with JSON containing "command" and "confidence" (0-1).',
        prompt: msg,
        maxTokens: 100,
      });

      console.log(`📨 "${msg}"`);

      try {
        const parsed = JSON.parse(text);
        const validated = CommandSchema.parse(parsed);
        console.log(
          `   ✅ ${validated.command} (confidence: ${validated.confidence})`,
        );
      } catch (e) {
        console.log(`   ⚠️ Invalid response: ${text.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed:`, (error as Error).message);
    }
  }
  console.log();
}

// Test 4: Streaming with structured prompts
async function testStreaming() {
  console.log("🧪 Test 4: Streaming with structured output\n");

  try {
    const { textStream } = await streamText({
      model: litellm("claude-3-7-sonnet"),
      system: "You are a task planner. Output a JSON array of tasks.",
      prompt:
        'Plan 3 tasks for debugging a login issue. Return as JSON array with "task" and "priority" fields.',
      maxTokens: 200,
    });

    console.log("Streaming response:");
    let fullText = "";
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
      fullText += chunk;
    }
    console.log("\n");

    try {
      const parsed = JSON.parse(fullText);
      console.log("✅ Parsed tasks:", parsed.length, "tasks found");
    } catch (e) {
      console.log("⚠️ Could not parse JSON from streamed response");
    }
    console.log();
  } catch (error) {
    console.error("❌ Streaming failed:", error);
  }
}

// Helper function to create a command parser
function createCommandParser() {
  const CommandEnum = z.enum([
    "CREATE_ISSUE",
    "UPDATE_STATUS",
    "QUERY_DATABASE",
    "NONE",
  ]);

  return async (message: string) => {
    const { text } = await generateText({
      model: litellm("claude-3-7-sonnet"),
      system:
        "You are a command classifier. Respond with only one word: CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, or NONE.",
      prompt: message,
      maxTokens: 10,
    });

    try {
      return CommandEnum.parse(text.trim());
    } catch {
      return "NONE";
    }
  };
}

// Test 5: Using the command parser
async function testCommandParser() {
  console.log("🧪 Test 5: Simple command parser\n");

  const parseCommand = createCommandParser();

  const testMessages = [
    "I need to create a bug report",
    "Update the ticket status",
    "What's for lunch?",
  ];

  for (const msg of testMessages) {
    try {
      const command = await parseCommand(msg);
      console.log(`"${msg}" → ${command}`);
    } catch (error) {
      console.error(`Failed to parse: ${msg}`);
    }
  }
  console.log();
}

async function main() {
  console.log("🚀 Vercel AI SDK + LiteLLM: Structured Output Examples\n");
  console.log("=".repeat(60) + "\n");

  try {
    await testJsonExtraction();
    await testStreamOfConsciousness();
    await testCommandEnum();
    await testStreaming();
    await testCommandParser();

    console.log("=".repeat(60));
    console.log("✨ Examples completed!\n");
    console.log("💡 Key takeaways:");
    console.log("  1. Use system prompts to guide JSON output");
    console.log("  2. Parse and validate responses with Zod");
    console.log("  3. Simple prompts work best for enums");
    console.log("  4. Streaming works with structured prompts");
  } catch (error) {
    console.error("\n❌ Examples failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
