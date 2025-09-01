#!/usr/bin/env npx tsx

import { init } from "@instantdb/core";

const db = init({
  appId: process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

async function checkDevices() {
  try {
    console.log("🔍 Checking registered devices in database...\n");
    
    const { data } = await db.queryOnce({
      devices: {},
    });

    const devices = data?.devices || [];
    
    if (devices.length === 0) {
      console.log("❌ No devices found in database");
      console.log("\nTo register a device:");
      console.log("1. Open the mobile app on your iOS device");
      console.log("2. Navigate to the Conversations screen");
      console.log("3. Grant notification permissions when prompted");
      console.log("4. The app will automatically save the push token");
      return;
    }

    console.log(`✅ Found ${devices.length} device(s):\n`);
    
    devices.forEach((device: any, index: number) => {
      console.log(`Device ${index + 1}:`);
      console.log(`  ID: ${device.id}`);
      console.log(`  Platform: ${device.platform}`);
      console.log(`  Push Token: ${device.pushToken}`);
      console.log(`  Created: ${new Date(device.createdAt).toLocaleString()}`);
      console.log(`  Updated: ${new Date(device.updatedAt).toLocaleString()}`);
      console.log("");
    });

    // Extract the most recent push token for testing
    const mostRecent = devices.sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0];
    if (mostRecent?.pushToken) {
      console.log("📱 Most recent push token (for testing):");
      console.log(`   ${mostRecent.pushToken}`);
      console.log("\nYou can test sending a notification with:");
      console.log(`   npx tsx send-push-to-token.ts`);
      console.log("\nOr update send-push-to-token.ts with this token.");
    }

  } catch (error) {
    console.error("❌ Error checking devices:", error);
  }
  
  process.exit(0);
}

checkDevices();