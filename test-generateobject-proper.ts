import { generateObject } from "ai";
import { z } from "zod";
import { litellm } from "./lib/litellm-provider.js";
import { openaiProxy } from "./lib/openai-proxy-provider.js";
import { config } from "dotenv";

// Load environment variables
config();

// Test schema from the documentation
const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.string(),
      }),
    ),
    steps: z.array(z.string()),
  }),
});

// Command enumeration schema
const commandSchema = z.object({
  command: z.enum(["create", "read", "update", "delete"]),
  target: z.string(),
  parameters: z.record(z.string(), z.string()),
});

async function testLiteLLM() {
  console.log("\n🧪 Testing LiteLLM with generateObject...");

  try {
    const result = await generateObject({
      model: litellm("claude-3-7-sonnet"),
      schema: recipeSchema,
      prompt: "Generate a lasagna recipe.",
    });

    console.log("✅ LiteLLM generateObject SUCCESS!");
    console.log("Recipe:", JSON.stringify(result.object, null, 2));
    console.log("Usage:", result.usage);
    return true;
  } catch (error) {
    console.log("❌ LiteLLM generateObject FAILED:", (error as Error).message);
    console.log("Error type:", (error as Error).constructor.name);
    return false;
  }
}

async function testOpenAIProxy() {
  console.log("\n🧪 Testing OpenAI Proxy with generateObject...");

  try {
    const result = await generateObject({
      model: openaiProxy("gpt-4o-mini"),
      schema: recipeSchema,
      prompt: "Generate a lasagna recipe.",
    });

    console.log("✅ OpenAI Proxy generateObject SUCCESS!");
    console.log("Recipe:", JSON.stringify(result.object, null, 2));
    console.log("Usage:", result.usage);
    return true;
  } catch (error) {
    console.log(
      "❌ OpenAI Proxy generateObject FAILED:",
      (error as Error).message,
    );
    console.log("Error type:", (error as Error).constructor.name);
    return false;
  }
}

async function testCommandEnumeration() {
  console.log("\n🧪 Testing Command Enumeration with generateObject...");

  try {
    const result = await generateObject({
      model: litellm("claude-3-7-sonnet"),
      schema: commandSchema,
      prompt:
        'Parse this user request into a command: "Please update the user profile with name John and email john@example.com"',
    });

    console.log("✅ Command enumeration SUCCESS!");
    console.log("Command:", JSON.stringify(result.object, null, 2));
    return true;
  } catch (error) {
    console.log("❌ Command enumeration FAILED:", (error as Error).message);
    return false;
  }
}

async function testWithDifferentModes() {
  console.log("\n🧪 Testing different generation modes...");

  // Test with explicit mode parameter
  try {
    const result = await generateObject({
      model: litellm("claude-3-7-sonnet"),
      schema: recipeSchema,
      prompt: "Generate a simple pasta recipe.",
      mode: "json", // Explicitly set JSON mode
    });

    console.log("✅ JSON mode SUCCESS!");
    console.log("Recipe name:", result.object.recipe.name);
    return true;
  } catch (error) {
    console.log("❌ JSON mode FAILED:", (error as Error).message);
    return false;
  }
}

async function main() {
  console.log("🚀 Testing generateObject following AI SDK documentation...\n");

  const results = {
    litellm: await testLiteLLM(),
    openaiProxy: await testOpenAIProxy(),
    commandEnum: await testCommandEnumeration(),
    jsonMode: await testWithDifferentModes(),
  };

  console.log("\n📊 FINAL RESULTS:");
  console.log(
    "LiteLLM generateObject:",
    results.litellm ? "✅ WORKS" : "❌ FAILS",
  );
  console.log(
    "OpenAI Proxy generateObject:",
    results.openaiProxy ? "✅ WORKS" : "❌ FAILS",
  );
  console.log(
    "Command Enumeration:",
    results.commandEnum ? "✅ WORKS" : "❌ FAILS",
  );
  console.log("JSON Mode:", results.jsonMode ? "✅ WORKS" : "❌ FAILS");

  if (results.litellm || results.openaiProxy) {
    console.log("\n🎉 generateObject DOES work with at least one provider!");
    console.log("The AI SDK handles structured outputs properly.");
  } else {
    console.log("\n⚠️  generateObject failed with both providers.");
    console.log(
      "May need to check provider configuration or use fallback methods.",
    );
  }
}

main().catch(console.error);
