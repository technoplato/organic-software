import { init, tx, id } from "@instantdb/node";
import * as dotenv from "dotenv";

dotenv.config();

const APP_ID =
  process.env.INSTANTDB_APP_ID ||
  process.env.EXPO_PUBLIC_INSTANTDB_APP_ID ||
  "";
console.log("APP_ID:", APP_ID);

if (!APP_ID) {
  console.error("❌ No APP_ID found in environment variables");
  process.exit(1);
}

const db = init({ appId: APP_ID });

async function testErrorDispatch() {
  try {
    const errorId = id();
    const errorData = {
      id: errorId,
      type: "test-error",
      errorType: "SyntaxError",
      content: "Test error from supervisor testing",
      source: "test-script",
      timestamp: Date.now(),
      status: "pending",
      metadata: {
        test: true,
      },
    };

    console.log("📤 Dispatching test error to errors table...");

    await (db as any).transact([(tx as any).errors[errorId].update(errorData)]);

    console.log("✅ Error dispatched successfully!");

    // Now query to verify
    const result = await db.queryOnce({ errors: {} });
    console.log("Errors in database:", result.data.errors?.length || 0);
  } catch (err) {
    console.error("❌ Failed to dispatch error:", err);
  }

  process.exit(0);
}

testErrorDispatch();
