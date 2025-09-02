/**
 * Simple script to read and display all transcriptions and their segments
 */

import { init } from "@instantdb/node";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../mobile-app/.env") });

// Initialize InstantDB
const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || "",
});

async function readTranscriptions() {
  console.log("=".repeat(80));
  console.log("READING TRANSCRIPTIONS AND SEGMENTS FROM INSTANTDB");
  console.log("=".repeat(80));
  console.log();

  // The query we're running
  const query = {
    transcriptions: {
      $: {
        order: {
          serverCreatedAt: "desc" as const,
        },
      },
      segments: {
        $: {
          order: {
            timestamp: "asc" as const,
          },
        },
      },
    },
  };

  console.log("Running query:");
  console.log(JSON.stringify(query, null, 2));
  console.log();
  console.log("-".repeat(80));
  console.log();

  try {
    // Execute the query using queryOnce
    const { data: result } = await db.queryOnce(query);

    if (!result.transcriptions || result.transcriptions.length === 0) {
      console.log("No transcriptions found in the database.");
      return;
    }

    console.log(`Found ${result.transcriptions.length} transcription(s):\n`);

    // Display each transcription and its segments
    result.transcriptions.forEach((transcription: any, index: number) => {
      console.log(`📝 TRANSCRIPTION #${index + 1}`);
      console.log("-".repeat(40));
      console.log(`ID: ${transcription.id}`);
      console.log(`Title: ${transcription.title || "Untitled"}`);
      console.log(`Status: ${transcription.status || "unknown"}`);
      console.log(`Started: ${transcription.startedAt || "N/A"}`);
      console.log(`Ended: ${transcription.endedAt || "N/A"}`);
      console.log(`Duration: ${transcription.duration ? `${transcription.duration}s` : "N/A"}`);
      console.log(`Device ID: ${transcription.deviceId || "N/A"}`);
      console.log();

      // Display segments
      const segments = transcription.segments || [];
      if (segments.length > 0) {
        console.log(`  📄 SEGMENTS (${segments.length} total):`);
        console.log("  " + "-".repeat(38));
        
        segments.forEach((segment: any, segIndex: number) => {
          console.log(`  Segment ${segIndex + 1}:`);
          console.log(`    Timestamp: ${segment.formattedTimestamp || segment.timestamp || "0:00"}`);
          console.log(`    Text: "${segment.text || ""}"${segment.text?.length > 100 ? " (truncated)" : ""}`);
          console.log(`    Final: ${segment.isFinal ? "Yes" : "No"}`);
          console.log(`    Interim: ${segment.isInterim ? "Yes" : "No"}`);
          if (segment.confidence !== undefined) {
            console.log(`    Confidence: ${(segment.confidence * 100).toFixed(1)}%`);
          }
          console.log();
        });
      } else {
        console.log("  No segments found for this transcription.");
        console.log();
      }

      console.log("=".repeat(80));
      console.log();
    });

    // Summary statistics
    const totalSegments = result.transcriptions.reduce(
      (sum: number, t: any) => sum + (t.segments?.length || 0),
      0
    );
    
    console.log("SUMMARY:");
    console.log(`- Total transcriptions: ${result.transcriptions.length}`);
    console.log(`- Total segments: ${totalSegments}`);
    console.log(`- Average segments per transcription: ${(totalSegments / result.transcriptions.length).toFixed(1)}`);

  } catch (error) {
    console.error("Error reading transcriptions:", error);
  } finally {
    console.log("\nScript completed.");
    process.exit(0);
  }
}

// Run the script
readTranscriptions();