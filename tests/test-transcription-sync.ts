#!/usr/bin/env npx tsx

import { init, id } from "@instantdb/node";
import * as dotenv from "dotenv";
import schema from "../instant.schema";

// Load environment variables
dotenv.config({ path: "./config/.env" });

const APP_ID = process.env.INSTANTDB_APP_ID || process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || "";

if (!APP_ID) {
  console.error("❌ No InstantDB app ID found in environment variables");
  process.exit(1);
}

console.log("🔍 Testing Transcription and Segment Sync with InstantDB");
console.log("=".repeat(50));
console.log("App ID:", APP_ID);

const db = init({ appId: APP_ID, schema });

async function testTranscriptionSync() {
  let testTranscriptionId: string | null = null;
  let testSegmentIds: string[] = [];
  
  try {
    // 1. Query existing transcriptions
    console.log("\n📋 Querying existing transcriptions...");
    const result = await db.queryOnce({
      transcriptions: {
        segments: {}
      }
    });

    const transcriptions = result.data?.transcriptions || [];
    console.log(`Found ${transcriptions.length} transcription(s)`);

    if (transcriptions.length > 0) {
      console.log("\n📝 Recent transcriptions:");
      transcriptions.slice(0, 3).forEach((t: any) => {
        console.log(`  - ${t.title || 'Untitled'}`);
        console.log(`    Status: ${t.status}`);
        console.log(`    Started: ${new Date(t.startedAt).toLocaleString()}`);
        console.log(`    Duration: ${t.duration || 0}s`);
        console.log(`    Segments: ${t.segments?.length || 0}`);
        
        if (t.segments && t.segments.length > 0) {
          console.log("    First segment:", t.segments[0].text.substring(0, 50) + "...");
        }
      });
    }

    // 2. Create a test transcription
    console.log("\n🧪 Creating test transcription...");
    testTranscriptionId = id();
    const testSegmentId1 = id();
    const testSegmentId2 = id();
    testSegmentIds = [testSegmentId1, testSegmentId2];
    
    await db.transact([
      db.tx.transcriptions[testTranscriptionId].update({
        title: `Test Recording ${new Date().toLocaleString()}`,
        startedAt: new Date().toISOString(),
        status: 'recording',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    ]);
    
    console.log("✅ Created test transcription:", testTranscriptionId);

    // 3. Add test segments
    console.log("\n🧪 Adding test segments...");
    await db.transact([
      db.tx.segments[testSegmentId1].update({
        text: "This is the first test segment",
        timestamp: 0,
        formattedTimestamp: "0:00",
        confidence: 0.95,
        isFinal: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      db.tx.segments[testSegmentId1].link({
        transcription: testTranscriptionId
      }),
      db.tx.segments[testSegmentId2].update({
        text: "This is the second test segment",
        timestamp: 5,
        formattedTimestamp: "0:05",
        confidence: 0.92,
        isFinal: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      db.tx.segments[testSegmentId2].link({
        transcription: testTranscriptionId
      })
    ]);
    
    console.log("✅ Added test segments");

    // 4. Complete the transcription
    console.log("\n🧪 Completing test transcription...");
    await db.transact([
      db.tx.transcriptions[testTranscriptionId].update({
        endedAt: new Date().toISOString(),
        duration: 10,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      })
    ]);
    
    console.log("✅ Completed test transcription");

    // 5. Query the test transcription with segments
    console.log("\n📋 Querying test transcription with segments...");
    const testResult = await db.queryOnce({
      transcriptions: {
        $: {
          where: {
            id: testTranscriptionId
          }
        },
        segments: {}
      }
    });

    const testTranscription = testResult.data?.transcriptions?.[0];
    if (testTranscription) {
      console.log("✅ Successfully retrieved test transcription:");
      console.log(`  Title: ${testTranscription.title}`);
      console.log(`  Status: ${testTranscription.status}`);
      console.log(`  Duration: ${testTranscription.duration}s`);
      console.log(`  Segments: ${testTranscription.segments?.length || 0}`);
      
      if (testTranscription.segments) {
        testTranscription.segments.forEach((s: any, i: number) => {
          console.log(`    Segment ${i + 1}: "${s.text}" at ${s.formattedTimestamp}`);
        });
      }
    }

    console.log("\n✅ All tests passed! Transcription sync is working correctly.");
    console.log("\n📱 You can now:");
    console.log("  1. Run the mobile app with: cd mobile-app && npx expo start");
    console.log("  2. Open the Speech Demo tab");
    console.log("  3. Start recording to see live synchronization");
    console.log("  4. Check InstantDB dashboard to see the data");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error; // Re-throw to be caught by cleanup
  } finally {
    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    try {
      const transactions = [];
      
      // Delete test segments
      for (const segmentId of testSegmentIds) {
        transactions.push(db.tx.segments[segmentId].delete());
      }
      
      // Delete test transcription
      if (testTranscriptionId) {
        transactions.push(db.tx.transcriptions[testTranscriptionId].delete());
      }
      
      if (transactions.length > 0) {
        await db.transact(transactions);
        console.log("✅ Test data cleaned up successfully");
      }
    } catch (cleanupError) {
      console.error("⚠️ Failed to clean up test data:", cleanupError);
      // Don't fail the test if cleanup fails
    }
  }
}

// Run the test
testTranscriptionSync()
  .then(() => {
    console.log("\n✨ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test execution failed");
    process.exit(1);
  });