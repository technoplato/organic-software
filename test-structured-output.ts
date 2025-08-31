#!/usr/bin/env tsx

import { generateObject, streamObject } from "ai";
import { litellm } from "./lib/litellm-provider";
import { z } from "zod";
import { config } from "dotenv";

// Load environment variables
config();

// Define command enumeration
const CommandEnum = z.enum([
  "CREATE_ISSUE",
  "UPDATE_STATUS",
  "SEND_NOTIFICATION",
  "QUERY_DATABASE",
  "EXECUTE_CODE",
  "NONE",
]);

// Define structured output schema for stream of consciousness parsing
const StreamOfConsciousnessSchema = z.object({
  thoughts: z.object({
    main_topic: z.string().describe("The main topic or theme being discussed"),
    key_points: z
      .array(z.string())
      .describe("Key points extracted from the message"),
    sentiment: z
      .enum(["positive", "neutral", "negative", "mixed"])
      .describe("Overall sentiment"),
  }),

  actions: z.object({
    command: CommandEnum.describe(
      "The command to execute based on the message",
    ),
    parameters: z
      .record(z.any())
      .optional()
      .describe("Parameters for the command if applicable"),
    priority: z
      .enum(["low", "medium", "high"])
      .describe("Priority level of the action"),
  }),

  categories: z.object({
    technical: z.array(z.string()).describe("Technical aspects mentioned"),
    personal: z
      .array(z.string())
      .describe("Personal or emotional aspects mentioned"),
  }),

  summary: z.string().describe("A brief summary of the entire message"),
});

async function testStructuredOutput() {
  console.log("🧪 Testing structured output with Zod schema...\n");

  const streamOfConsciousness = `
    I've been thinking about the bug in the authentication system, it's really frustrating me.
    We need to create an issue for this ASAP. The users are complaining and I'm worried about
    the security implications. Maybe we should also update the status of the current sprint
    to reflect this urgent fix. I had a coffee this morning and it helped me think clearer
    about the solution - we need to implement proper token validation.
  `;

  try {
    const { object } = await generateObject({
      model: litellm("claude-3-7-sonnet"),
      schema: StreamOfConsciousnessSchema,
      prompt: `Analyze this stream of consciousness message and extract structured information: "${streamOfConsciousness}"`,
    });

    console.log("✅ Structured output generated successfully!\n");
    console.log("📊 Analysis Results:");
    console.log("=".repeat(60));

    console.log("\n🧠 Thoughts:");
    console.log("  Main Topic:", object.thoughts.main_topic);
    console.log("  Sentiment:", object.thoughts.sentiment);
    console.log("  Key Points:");
    object.thoughts.key_points.forEach((point) => console.log("    •", point));

    console.log("\n⚡ Actions:");
    console.log("  Command:", object.actions.command);
    console.log("  Priority:", object.actions.priority);
    if (object.actions.parameters) {
      console.log(
        "  Parameters:",
        JSON.stringify(object.actions.parameters, null, 2),
      );
    }

    console.log("\n📁 Categories:");
    console.log("  Technical:", object.categories.technical.join(", "));
    console.log("  Personal:", object.categories.personal.join(", "));

    console.log("\n📝 Summary:");
    console.log("  ", object.summary);
  } catch (error) {
    console.error("❌ Structured output failed:", error);
    throw error;
  }
}

async function testStreamingStructuredOutput() {
  console.log("\n\n🧪 Testing streaming structured output...\n");

  const userMessage = `
    The performance metrics are looking bad, response times over 2 seconds.
    Need to query the database for slow queries and maybe execute some optimization scripts.
    This is high priority! Also feeling overwhelmed with all these issues.
  `;

  try {
    const { partialObjectStream } = await streamObject({
      model: litellm("claude-3-7-sonnet"),
      schema: StreamOfConsciousnessSchema,
      prompt: `Analyze this message and extract structured information: "${userMessage}"`,
    });

    console.log("Streaming partial objects...\n");

    for await (const partialObject of partialObjectStream) {
      // Show command as soon as it's available
      if (partialObject.actions?.command) {
        console.log("🎯 Command detected:", partialObject.actions.command);
        break; // Just show first detection for brevity
      }
    }

    console.log("\n✅ Streaming structured output successful!");
  } catch (error) {
    console.error("❌ Streaming structured output failed:", error);
    throw error;
  }
}

// Simple schema for quick test
const QuickCommandSchema = z.object({
  command: CommandEnum,
  reason: z.string().max(50),
});

async function testQuickCommands() {
  console.log("\n\n🧪 Testing quick command extraction...\n");

  const messages = [
    "Create an issue about the login bug",
    "Just thinking about the weather today",
    "Update the status of ticket #123 to done",
    "Can you query how many users we have?",
  ];

  for (const msg of messages) {
    try {
      const { object } = await generateObject({
        model: litellm("claude-3-7-sonnet"),
        schema: QuickCommandSchema,
        prompt: `What command should be executed for this message? Message: "${msg}"`,
      });

      console.log(`📨 "${msg}"`);
      console.log(`   → Command: ${object.command}`);
      console.log(`   → Reason: ${object.reason}\n`);
    } catch (error) {
      console.error(`❌ Failed for message: "${msg}"`, error);
    }
  }
}

async function main() {
  console.log("🚀 Structured Output Test with Vercel AI SDK + Zod\n");
  console.log("=".repeat(60));

  try {
    await testStructuredOutput();
    await testStreamingStructuredOutput();
    await testQuickCommands();

    console.log("=".repeat(60));
    console.log("🎉 All structured output tests completed!");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
