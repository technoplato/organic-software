#!/usr/bin/env tsx

import { generateText } from "ai";
import { litellm } from "./lib/litellm-provider";
import { z } from "zod";
import { config } from "dotenv";

// Load environment variables
config();

// Helper to extract JSON from response (handles markdown code blocks)
function extractJSON(text: string): any {
  // Remove markdown code blocks if present
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try parsing the original text if cleaning didn't work
    return JSON.parse(text);
  }
}

// Command enumeration schema
const CommandEnum = z.enum([
  "CREATE_ISSUE",
  "UPDATE_STATUS",
  "QUERY_DATABASE",
  "NONE",
]);

// Structured schemas for validation
const CommandSchema = z.object({
  command: CommandEnum,
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string(),
});

const AnalysisSchema = z.object({
  technical: z.array(z.string()),
  personal: z.array(z.string()),
  command: CommandEnum,
  summary: z.string(),
});

// Example 1: Extract command with validation
async function extractCommand(message: string) {
  const { text } = await generateText({
    model: litellm("claude-3-7-sonnet"),
    system:
      "Extract commands from messages. Respond with JSON only containing: command (CREATE_ISSUE/UPDATE_STATUS/QUERY_DATABASE/NONE), priority (low/medium/high), reason (brief text).",
    prompt: message,
    maxTokens: 150,
  });

  const json = extractJSON(text);
  // Normalize command to uppercase if needed
  if (json.command) {
    json.command = json.command.toUpperCase().replace(/_/g, "_");
  }
  return CommandSchema.parse(json);
}

// Example 2: Analyze stream of consciousness
async function analyzeText(text: string) {
  const { text: response } = await generateText({
    model: litellm("claude-3-7-sonnet"),
    system:
      "Analyze text and return JSON with: technical (array), personal (array), command (CREATE_ISSUE/UPDATE_STATUS/QUERY_DATABASE/NONE), summary (one sentence).",
    prompt: text,
    maxTokens: 300,
  });

  const json = extractJSON(response);
  if (json.command) {
    json.command = json.command.toUpperCase();
  }
  return AnalysisSchema.parse(json);
}

// Example 3: Simple command classifier
async function classifyCommand(
  message: string,
): Promise<z.infer<typeof CommandEnum>> {
  const { text } = await generateText({
    model: litellm("claude-3-7-sonnet"),
    system:
      "Classify the message into one command. Respond with only: CREATE_ISSUE, UPDATE_STATUS, QUERY_DATABASE, or NONE",
    prompt: message,
    maxTokens: 10,
  });

  const cleaned = text.trim().toUpperCase();
  try {
    return CommandEnum.parse(cleaned);
  } catch {
    return "NONE";
  }
}

async function main() {
  console.log("🚀 Clean Structured Output Examples\n");
  console.log("=".repeat(50) + "\n");

  // Test 1: Command extraction
  console.log("📝 Example 1: Command Extraction\n");
  try {
    const cmd1 = await extractCommand(
      "Create an urgent issue about the login bug",
    );
    console.log("✅ Extracted:", cmd1);
  } catch (error) {
    console.error("❌ Failed:", error);
  }

  // Test 2: Stream of consciousness
  console.log("\n📊 Example 2: Text Analysis\n");
  try {
    const analysis = await analyzeText(`
      Debugging the auth system is frustrating. 
      Need to query the database for failed logins.
      Had too much coffee, feeling jittery.
    `);
    console.log("✅ Analysis:");
    console.log("  Technical:", analysis.technical);
    console.log("  Personal:", analysis.personal);
    console.log("  Command:", analysis.command);
    console.log("  Summary:", analysis.summary);
  } catch (error) {
    console.error("❌ Failed:", error);
  }

  // Test 3: Quick classification
  console.log("\n🎯 Example 3: Quick Classification\n");
  const messages = [
    "Create a bug report for the memory leak",
    "Update ticket #123 to done",
    "What's the weather like?",
    "Query user signups from last week",
  ];

  for (const msg of messages) {
    try {
      const cmd = await classifyCommand(msg);
      console.log(`"${msg}"`);
      console.log(`  → ${cmd}\n`);
    } catch (error) {
      console.error(`Failed for "${msg}":`, error);
    }
  }

  console.log("=".repeat(50));
  console.log("\n✨ Done! Key points:");
  console.log("  • Use clear system prompts for JSON output");
  console.log("  • Extract and clean JSON from responses");
  console.log("  • Validate with Zod schemas");
  console.log("  • Handle edge cases gracefully");
}

main().catch(console.error);
