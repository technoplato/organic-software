#!/usr/bin/env tsx

import { generateObject, generateText } from "ai";
import { litellm } from "./lib/litellm-provider";
import { z } from "zod";
import { tool } from "ai";
import { config } from "dotenv";

// Load environment variables
config();

// Test 1: No-schema mode (most compatible)
async function testNoSchema() {
  console.log("🧪 Test 1: No-schema mode (JSON without validation)\n");

  try {
    const { object } = await generateObject({
      model: litellm("claude-3-7-sonnet"),
      output: "no-schema",
      prompt: `Extract the command and priority from this message as JSON with fields "command" (one of: CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, NONE) and "priority" (low/medium/high):
      
      "Create an issue about the login bug, it's urgent!"`,
    });

    console.log("✅ No-schema generation successful!");
    console.log("Result:", JSON.stringify(object, null, 2));
    console.log();
  } catch (error) {
    console.error("❌ No-schema failed:", error);
  }
}

// Test 2: Tool calling for structured data
async function testToolCalling() {
  console.log("🧪 Test 2: Tool calling for structured extraction\n");

  const extractCommandTool = tool({
    description: "Extract command and metadata from user message",
    parameters: z.object({
      command: z
        .string()
        .describe(
          "The command: CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, or NONE",
        ),
      priority: z.string().describe("Priority: low, medium, or high"),
      reason: z.string().describe("Brief reason for this command"),
    }),
  });

  try {
    const { toolCalls } = await generateText({
      model: litellm("claude-3-7-sonnet"),
      tools: { extractCommand: extractCommandTool },
      toolChoice: "required",
      prompt:
        'Extract the command from: "Update the status of ticket #123 to done, this is blocking the release!"',
    });

    if (toolCalls && toolCalls.length > 0) {
      console.log("✅ Tool calling successful!");
      console.log(
        "Extracted data:",
        JSON.stringify(toolCalls[0].args, null, 2),
      );
    } else {
      console.log("⚠️ No tool calls generated");
    }
    console.log();
  } catch (error) {
    console.error("❌ Tool calling failed:", error);
  }
}

// Test 3: Stream of consciousness categorization with no-schema
async function testStreamOfConsciousness() {
  console.log("🧪 Test 3: Stream of consciousness categorization\n");

  const stream = `
    Been debugging the auth system all morning, really frustrating. 
    Need to query the database for failed login attempts.
    Had too much coffee, feeling jittery. The code is messy and needs refactoring.
  `;

  try {
    const { object } = await generateObject({
      model: litellm("claude-3-7-sonnet"),
      output: "no-schema",
      prompt: `Analyze this stream of consciousness and return JSON with:
      - "technical": array of technical aspects mentioned
      - "personal": array of personal/emotional aspects
      - "command": the main action needed (CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, or NONE)
      - "summary": brief summary
      
      Text: "${stream}"`,
    });

    console.log("✅ Analysis successful!");
    console.log("Result:", JSON.stringify(object, null, 2));
    console.log();
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  }
}

// Test 4: Multiple messages with enum-like extraction
async function testMultipleCommands() {
  console.log("🧪 Test 4: Processing multiple messages\n");

  const messages = [
    "Create an issue about the memory leak in production",
    "Just thinking about lunch options",
    "Query the database for user signups this week",
    "Update ticket #456 status to in-progress",
  ];

  for (const msg of messages) {
    try {
      const { object } = await generateObject({
        model: litellm("claude-3-7-sonnet"),
        output: "no-schema",
        prompt: `What command should be executed? Return JSON with "command" (CREATE_ISSUE/UPDATE_STATUS/QUERY_DATABASE/NONE) and "confidence" (0-1):
        
        Message: "${msg}"`,
      });

      console.log(`📨 "${msg}"`);
      console.log(
        `   → Command: ${object.command} (confidence: ${object.confidence})`,
      );
    } catch (error) {
      console.error(`   ❌ Failed:`, (error as Error).message);
    }
  }
  console.log();
}

// Test 5: Simple text generation with system prompt
async function testSystemPrompt() {
  console.log("🧪 Test 5: System prompt with generateText\n");

  try {
    const { text } = await generateText({
      model: litellm("claude-3-7-sonnet"),
      system:
        "You are a command parser. Respond only with the command name in CAPS.",
      prompt: "I need to create a bug report about the login issue",
      maxTokens: 20,
    });

    console.log("✅ System prompt test successful!");
    console.log("Command:", text.trim());
    console.log();
  } catch (error) {
    console.error("❌ System prompt test failed:", error);
  }
}

async function main() {
  console.log("🚀 Structured Output Tests (LiteLLM Compatible)\n");
  console.log(
    "Using:",
    process.env.LITELLM_BASE_URL ||
      "https://llm-proxy.dev-tools.tools.hioscar.com",
  );
  console.log("=".repeat(60) + "\n");

  try {
    // Run tests sequentially
    await testNoSchema();
    await testToolCalling();
    await testStreamOfConsciousness();
    await testMultipleCommands();
    await testSystemPrompt();

    console.log("=".repeat(60));
    console.log("✨ All tests completed!");
    console.log("\n📝 Summary:");
    console.log("  • No-schema mode works best with LiteLLM");
    console.log("  • Tool calling provides structured extraction");
    console.log("  • You can parse JSON from no-schema responses");
    console.log("  • System prompts help guide the output format");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
