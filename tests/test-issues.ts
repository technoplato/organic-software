#!/usr/bin/env bun

import { init, tx, id, i } from "@instantdb/node";
import { withTimeout } from "./test-heartbeats";

const APP_ID =
  process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";
const ADMIN = process.env.INSTANTDB_ADMIN_TOKEN;

const schema = i.schema({
  entities: {
    issues: i.entity({
      title: i.string(),
      description: i.string(),
      priority: i.string(),
      status: i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    messages: i.entity({
      conversationId: i.string(),
      role: i.string(),
      content: i.string(),
      timestamp: i.number(),
      status: i.string(),
    }),
  },
});

const db = ADMIN
  ? init({ appId: APP_ID, adminToken: ADMIN, schema })
  : init({ appId: APP_ID });

async function main() {
  const issueId = id();
  const now = Date.now();
  // Write an issue (if admin available); otherwise just read existing issues
  if (ADMIN) {
    await withTimeout(
      db.transact([
        (tx as any).issues[issueId].update({
          id: issueId,
          title: "Roundtrip Test",
          description: "Created by test",
          priority: "Low",
          status: "Todo",
          createdAt: now,
          updatedAt: now,
        }),
      ]),
      1500,
      "write issue",
    );
  }
  let found = null as any;
  for (let i = 0; i < 10; i++) {
    const res = await withTimeout(
      db.queryOnce({
        issues: { $: { where: ADMIN ? { id: issueId } : {}, limit: 1 } },
      }),
      1200,
      "query issues",
    );
    found = ADMIN ? res.data.issues?.[0] : res.data.issues?.[0] || null;
    if (found) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!found) throw new Error("Issue not found");
  console.log("✅ Issues round-trip looks good");
  db.shutdown();
}

main().catch((err) => {
  console.error("❌ Issue test failed:", err);
  db.shutdown();
  process.exit(1);
});
