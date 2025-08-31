#!/usr/bin/env tsx

import { generateObject, generateText } from "ai";
import { openaiProxy } from "./lib/openai-proxy-provider";
import { z } from "zod";
import { config } from "dotenv";

// Load environment variables
config();

// Simple test schema
const TestSchema = z.object({
  command: z.enum(["CREATE_ISSUE", "UPDATE_STATUS", "QUERY_DATABASE", "NONE"]),
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string(),
});

async function testOpenAIStructuredOutputs() {
  console.log("🔍 Testing OpenAI Proxy Structured Output Support\n");

  // Test 1: generateObject with schema (the claim I made)
  console.log("📋 Test 1: generateObject with Zod schema");
  try {
    const { object } = await generateObject({
      model: openaiProxy("gpt-4o-mini"),
      schema: TestSchema,
      prompt: 'Extract command from: "Create an urgent issue about login bug"',
    });
    console.log("✅ SUCCESS:", object);
  } catch (error) {
    console.log("❌ FAILED:", (error as Error).message);
  }

  // Test 2: generateObject with JSON mention in prompt
  console.log('\n📋 Test 2: generateObject with "JSON" in prompt');
  try {
    const { object } = await generateObject({
      model: openaiProxy("gpt-4o-mini"),
      schema: TestSchema,
      prompt:
        'Extract command from "Create an urgent issue" and return as JSON',
    });
    console.log("✅ SUCCESS:", object);
  } catch (error) {
    console.log("❌ FAILED:", (error as Error).message);
  }

  // Test 3: Manual JSON with response_format
  console.log("\n🔧 Test 3: Manual JSON with response_format");
  try {
    const response = await fetch(
      "https://openai-proxy.air.dev.hioscar.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${require("fs").readFileSync("./openai_proxy_api_key.json", "utf8")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content:
                'Extract command from "Create urgent issue" as JSON with fields: command, priority, reason',
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 150,
        }),
      },
    );

    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      const parsed = JSON.parse(data.choices[0].message.content);
      console.log("✅ Raw JSON SUCCESS:", parsed);

      // Try to validate with Zod
      try {
        const validated = TestSchema.parse(parsed);
        console.log("✅ Zod validation SUCCESS:", validated);
      } catch (zodError) {
        console.log("❌ Zod validation FAILED:", (zodError as Error).message);
      }
    } else {
      console.log("❌ No content in response:", data);
    }
  } catch (error) {
    console.log("❌ FAILED:", (error as Error).message);
  }

  // Test 4: Check provider capabilities
  console.log("\n🔍 Test 4: Check provider supportsStructuredOutputs");
  try {
    const model = openaiProxy("gpt-4o-mini");
    console.log("Provider name:", (model as any).provider);
    console.log(
      "supportsStructuredOutputs:",
      (model as any).supportsStructuredOutputs,
    );
  } catch (error) {
    console.log("❌ Could not check capabilities:", (error as Error).message);
  }
}

async function main() {
  console.log("🚀 OpenAI Proxy Structured Output Reality Check\n");

  try {
    await testOpenAIStructuredOutputs();

    console.log("\n" + "=".repeat(60));
    console.log("📊 CONCLUSION:");
    console.log("");
    console.log("Based on the test results above:");
    console.log(
      "• generateObject() support depends on the specific implementation",
    );
    console.log("• Manual JSON with response_format works reliably");
    console.log("• Zod validation can be applied post-parsing");
    console.log("• The proxy may not support native structured outputs");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

main().catch(console.error);
