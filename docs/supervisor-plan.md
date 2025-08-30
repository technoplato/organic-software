# Supervisor Plan

Goal: Keep the Organic Software stack healthy and simple. A single Node supervisor manages:
- Host handler (`instant-message-handler.ts`) lifecycle and liveness
- Expo bundler (mobile-app) lifecycle for local dev
- Minimal recovery on failure (auto-restart, backoff)
- Clear operational commands (start/stop/status)

Key Signals in Current Code
- Heartbeats:
  - Mobile writes: `mobile-app/app/index.tsx` → `tx.heartbeats['mobile'].update({ kind: 'mobile', lastSeenAt })`
  - Host writes: `instant-message-handler.ts` → `startHostHeartbeat()` uses a stable UUID and `kind: 'host'`
- Issues:
  - Mobile reads `issues` via `db.useQuery({ issues: {} })`
  - Host seeds a first `Issue` in `ensureSeedIssue()` and can create issues from message commands (`parseIssueCommand` in handler)

Scope (Phase 1)
- Process management:
  - Start handler via `npx tsx instant-message-handler.ts`
  - Start Expo bundler via `npx expo start` in `mobile-app/` (configurable)
  - Auto-restart on exit with exponential backoff (max backoff 30s)
- Health checks every 10s:
  - If no host heartbeat in last 30s ⇒ restart handler
  - If no mobile heartbeat in last 30s ⇒ log warning (cannot restart mobile)
- Simple CLI: `npx tsx supervisor.ts [start|status]` (stop via Ctrl+C)

Out of Scope (Phase 1)
- Branch orchestration, stash-on-crash, or dependency-aware restarts (planned in Phase 2)

Phase 2 Additions
- Git strategy (per AGENT.md):
  - New plan doc → create branch `feat/<slug>` or `fix/<slug>`
  - Record plan link/IDs into InstantDB for traceability
- Safe dependency installs:
  - Stop bundler → `npm install` in `mobile-app` → restart bundler
- Stash/rollback on crash:
  - On repeated failures, `git stash -u` or `git reset --hard <last-good>` (configurable)
- Logs to InstantDB `logs` entity with correlation to conversations/issues

Implementation Steps
1) Scaffold `supervisor.ts`:
   - Spawn handler and bundler processes with stdio passthrough
   - Add restarts with backoff
   - Poll InstantDB heartbeats; restart handler on stale host beat
2) Wire npm script: `npm run supervisor`
3) Document usage in AGENT.md
