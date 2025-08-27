#!/usr/bin/env bun

import { init, tx, id, i } from "@instantdb/node";

const APP_ID = process.env.INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad";

console.log("🧪 Heartbeat integration test");

// Initialize DB. If a valid INSTANTDB_ADMIN_TOKEN is present, include schema; otherwise fall back to basic init
const ADMIN = process.env.INSTANTDB_ADMIN_TOKEN;
let db = (() => {
  if (ADMIN && ADMIN.length > 10) {
    const schema = i.schema({
      entities: {
        heartbeats: i.entity({
          kind: i.string(),
          lastSeenAt: i.number(),
          note: i.string(),
        }),
      },
    });
    return init({ appId: APP_ID, adminToken: ADMIN, schema });
  }
  return init({ appId: APP_ID });
})();

// 6s watchdog to prevent hangs
const WATCHDOG_MS = 6000;
const watchdog = setTimeout(() => {
  console.error('⏰ Heartbeat test timed out after', WATCHDOG_MS, 'ms');
  try { db.shutdown(); } catch {}
  process.exit(124);
}, WATCHDOG_MS);

// Utility: per-call timeout to avoid hangs
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout in ${label} after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, err => { clearTimeout(t); reject(err); });
  });
}

async function main() {
  // 1) Write a mobile heartbeat with a UUID id, read it back, assert recency
  const mobileId = id();
  const now = Date.now();
  await withTimeout(db.transact([
    tx.heartbeats[mobileId].update({ id: mobileId, kind: 'mobile', lastSeenAt: now })
  ]), 1200, 'write mobile heartbeat');

  // Wait briefly for eventual consistency
  let mobile: any | null = null;
  for (let i = 0; i < 10; i++) {
    const res1 = await withTimeout(db.queryOnce({ heartbeats: { $: { where: { id: mobileId }, limit: 1 } } }), 1000, 'query mobile heartbeat');
    mobile = res1.data.heartbeats?.[0] || null;
    if (mobile) break;
    await new Promise(r => setTimeout(r, 300));
  }
  if (!mobile) throw new Error('Mobile heartbeat not found after write');
  if (Math.abs(mobile.lastSeenAt - now) > 5000) throw new Error('Mobile heartbeat timestamp is stale');

  // 2) Simulate host heartbeat (the handler writes this in production)
  const hostId = id();
  const hostNow = Date.now();
  await withTimeout(db.transact([
    tx.heartbeats[hostId].update({ id: hostId, kind: 'host', lastSeenAt: hostNow })
  ]), 1200, 'write host heartbeat');
  let host: any | null = null;
  for (let i = 0; i < 10; i++) {
    const res2 = await withTimeout(db.queryOnce({ heartbeats: { $: { where: { id: hostId }, limit: 1 } } }), 1000, 'query host heartbeat');
    host = res2.data.heartbeats?.[0] || null;
    if (host) break;
    await new Promise(r => setTimeout(r, 300));
  }
  if (!host) throw new Error('Host heartbeat not found after write');
  if (Math.abs(host.lastSeenAt - hostNow) > 5000) throw new Error('Host heartbeat timestamp is stale');

  console.log('✅ Heartbeats read/write look good');
  clearTimeout(watchdog);
  db.shutdown();
}

main().catch((err) => {
  console.error('❌ Heartbeat test failed:', err);
  clearTimeout(watchdog);
  db.shutdown();
  process.exit(1);
});
