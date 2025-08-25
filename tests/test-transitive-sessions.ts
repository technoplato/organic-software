#!/usr/bin/env bun

/**
 * Test: Transitive Session ID Tracking with JSON Output Strategy
 * ==============================================================
 *
 * REASONING:
 * Based on GitHub issue #3976 and hesreallyhim's analysis, Claude Code SDK
 * session management works through transitive session IDs. Each response
 * generates a NEW session ID that must be used for the next message.
 *
 * KEY INSIGHT FROM ISSUE #3976:
 * "every message is assigned a new session ID, but if it's a 'continuation'/resume,
 * the entire conversation from the previous log file where the whole chat is stored
 * will be copied into the new file"
 *
 * RECOMMENDED STRATEGY (from hesreallyhim):
 * Use --output-format json to capture session IDs properly and track them
 * transitively across messages.
 *
 * HYPOTHESIS:
 * If we properly track and use the latest session ID from each response,
 * Claude should maintain conversation context across multiple messages.
 *
 * PATTERN:
 * Message1 → Response(sessionId: A)
 * Message2(resumeSessionId: A) → Response(sessionId: B)
 * Message3(resumeSessionId: B) → Response(sessionId: C)
 *
 * HOW TO RUN:
 * npx tsx tests/test-transitive-sessions.ts
 *
 * EXPECTED RESULTS:
 * - Each message should generate a new session ID
 * - Claude should remember context from previous messages
 * - The word "APPLE" and number "42" should be recalled correctly
 * - JSON output should provide clear session ID tracking
 */

import { query } from "@anthropic-ai/claude-code";
import { promises as fs } from "fs";

// Set up the same environment as our main handler
process.env.ANTHROPIC_BEDROCK_BASE_URL =
  process.env.ANTHROPIC_BEDROCK_BASE_URL ||
  "https://llm-proxy.dev-tools.dev.hioscar.com/bedrock";
process.env.CLAUDE_CODE_USE_BEDROCK =
  process.env.CLAUDE_CODE_USE_BEDROCK || "1";
process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH =
  process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH || "1";
process.env.ANTHROPIC_API_KEY =
  process.env.ANTHROPIC_API_KEY || "your-api-key-here";
process.env.DISABLE_ERROR_REPORTING =
  process.env.DISABLE_ERROR_REPORTING || "1";
process.env.DISABLE_TELEMETRY = process.env.DISABLE_TELEMETRY || "1";
process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS =
  process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS || "16384";
process.env.MAX_THINKING_TOKENS = process.env.MAX_THINKING_TOKENS || "1024";
process.env.NODE_TLS_REJECT_UNAUTHORIZED =
  process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";

async function testTransitiveSessions() {
  console.log("🧪 Testing Transitive Session ID Tracking with JSON Output Strategy");
  console.log("=".repeat(70));
  console.log("📚 Pattern: Each response generates a new session ID");
  console.log("         We must use the LATEST session ID for the next message");
  console.log("🔧 Strategy: Using JSON output format to capture session IDs properly");
  console.log("=".repeat(70));

  let currentSessionId: string | undefined;
  const sessionHistory: string[] = [];
  const allMessages: any[] = [];

  try {
    // Message 1: Initial message (no resume)
    console.log("\n📝 Message 1: Initial message");
    console.log("💬 Prompt: 'Remember the word APPLE. Just say OK.'");
    
    let response1 = "";
    const message1Data: any[] = [];
    
    for await (const message of query({
      prompt: "Remember the word APPLE. Just say OK.",
      options: {
        model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        maxTurns: 1,
        cwd: process.cwd(),
        permissionMode: "bypassPermissions",
      }
    })) {
      message1Data.push(message);
      allMessages.push({...message, messageNumber: 1});
      
      // Capture the session ID from ANY message that has it
      if ((message as any).session_id) {
        currentSessionId = (message as any).session_id;
        console.log(`📌 Captured session ID: ${currentSessionId}`);
      }
      
      if (message.type === "system" && (message as any).subtype === "init") {
        const initMsg = message as any;
        if (initMsg.session_id) {
          currentSessionId = initMsg.session_id;
          console.log(`📌 Init session ID: ${currentSessionId}`);
        }
      }
      
      if (message.type === "result") {
        const resultMsg = message as any;
        response1 = resultMsg.result;
        // Also check for session_id in result message
        if (resultMsg.session_id) {
          currentSessionId = resultMsg.session_id;
          console.log(`📌 Result session ID: ${currentSessionId}`);
        }
      }
    }
    
    console.log(`✅ Response 1: "${response1}"`);
    console.log(`📊 Message 1 JSON structure:`, JSON.stringify(message1Data, null, 2));
    
    if (currentSessionId) {
      sessionHistory.push(currentSessionId);
      console.log(`💾 Session ID saved: ${currentSessionId}`);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Message 2: Resume with session ID from Message 1
    console.log("\n📝 Message 2: Resume with previous session ID");
    console.log(`🔄 Using resumeSessionId: ${currentSessionId}`);
    console.log("💬 Prompt: 'Also remember the number 42. Say OK.'");
    
    let response2 = "";
    let previousSessionId = currentSessionId;
    const message2Data: any[] = [];
    
    for await (const message of query({
      prompt: "Also remember the number 42. Say OK.",
      options: {
        model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        maxTurns: 1,
        cwd: process.cwd(),
        permissionMode: "bypassPermissions",
        resume: currentSessionId,  // Use the session ID from Message 1
      }
    })) {
      message2Data.push(message);
      allMessages.push({...message, messageNumber: 2});
      
      // Capture the NEW session ID
      if ((message as any).session_id) {
        currentSessionId = (message as any).session_id;
        console.log(`📌 New session ID: ${currentSessionId}`);
      }
      
      if (message.type === "result") {
        const resultMsg = message as any;
        response2 = resultMsg.result;
        if (resultMsg.session_id) {
          currentSessionId = resultMsg.session_id;
          console.log(`📌 Result session ID: ${currentSessionId}`);
        }
      }
    }
    
    console.log(`✅ Response 2: "${response2}"`);
    console.log(`🔄 Session transitioned: ${previousSessionId} → ${currentSessionId}`);
    console.log(`📊 Message 2 JSON structure:`, JSON.stringify(message2Data, null, 2));
    
    if (currentSessionId) {
      sessionHistory.push(currentSessionId);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Message 3: Resume with session ID from Message 2
    console.log("\n📝 Message 3: Test memory with latest session ID");
    console.log(`🔄 Using resumeSessionId: ${currentSessionId}`);
    console.log("💬 Prompt: 'What word and number did I ask you to remember?'");
    
    let response3 = "";
    previousSessionId = currentSessionId;
    const message3Data: any[] = [];
    
    for await (const message of query({
      prompt: "What word and number did I ask you to remember?",
      options: {
        model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        maxTurns: 1,
        cwd: process.cwd(),
        permissionMode: "bypassPermissions",
        resume: currentSessionId,  // Use the session ID from Message 2
      }
    })) {
      message3Data.push(message);
      allMessages.push({...message, messageNumber: 3});
      
      // Capture the NEW session ID
      if ((message as any).session_id) {
        currentSessionId = (message as any).session_id;
        console.log(`📌 New session ID: ${currentSessionId}`);
      }
      
      if (message.type === "result") {
        const resultMsg = message as any;
        response3 = resultMsg.result;
        if (resultMsg.session_id) {
          currentSessionId = resultMsg.session_id;
          console.log(`📌 Result session ID: ${currentSessionId}`);
        }
      }
    }
    
    console.log(`✅ Response 3: "${response3}"`);
    console.log(`🔄 Session transitioned: ${previousSessionId} → ${currentSessionId}`);
    console.log(`📊 Message 3 JSON structure:`, JSON.stringify(message3Data, null, 2));

    // Analysis
    console.log("\n" + "=".repeat(70));
    console.log("🔍 Analysis:");
    console.log(`   Session ID chain: ${sessionHistory.length} transitions`);
    sessionHistory.forEach((id, i) => {
      console.log(`   ${i + 1}. ${id}`);
    });
    
    const remembersApple = response3.toUpperCase().includes("APPLE");
    const remembers42 = response3.includes("42");
    
    console.log(`   Claude remembers APPLE: ${remembersApple ? "✅" : "❌"}`);
    console.log(`   Claude remembers 42: ${remembers42 ? "✅" : "❌"}`);

    // JSON Output Analysis (following GitHub issue #3976 recommendations)
    console.log("\n📋 JSON Output Analysis (GitHub Issue #3976 Strategy):");
    console.log(`   Total messages captured: ${allMessages.length}`);
    console.log(`   Session IDs found: ${sessionHistory.length}`);
    console.log(`   Each message type and session_id:`);
    
    allMessages.forEach((msg, i) => {
      const sessionId = (msg as any).session_id || 'none';
      console.log(`     ${i + 1}. Type: ${msg.type}, Session: ${sessionId.substring(0, 8)}...`);
    });

    if (remembersApple && remembers42) {
      console.log("\n🎉 SUCCESS: Transitive session tracking works!");
      console.log("✅ Claude maintained context using transitive session IDs");
      console.log("✅ JSON output strategy from GitHub issue #3976 is effective!");
      console.log("✅ This is the correct way to use the SDK!");
    } else {
      console.log("\n❌ FAILURE: Claude doesn't remember despite transitive tracking");
      console.log("❌ The SDK may still have issues with session resumption");
      console.log("💡 Consider implementing the bash helper function from hesreallyhim's comment");
    }

    // Save detailed JSON output for debugging
    console.log("\n💾 Saving detailed JSON output to test-session-debug.json");
    const debugData = {
      sessionHistory,
      responses: [response1, response2, response3],
      allMessages,
      analysis: {
        remembersApple,
        remembers42,
        success: remembersApple && remembers42
      }
    };

    // Persist full debug data and also print a concise preview
    await fs.writeFile("test-session-debug.json", JSON.stringify(debugData, null, 2), "utf8");
    console.log("✅ Saved to test-session-debug.json");
    console.log("📄 Debug data structure (preview):", JSON.stringify({
      sessionHistory,
      responses: [response1, response2, response3].map(r => (r || "").slice(0, 120)),
      analysis: debugData.analysis,
    }, null, 2));

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  }
}

console.log("🚀 Claude Code SDK Transitive Session Test");
console.log("📖 Based on: github.com/salvinoarmati's discovery");
console.log("");

testTransitiveSessions()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });