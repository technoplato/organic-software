You can look up documentation at this directory .docs: 
/Users/mlustig/dev/work/sources/.docs/docs/claude/claude-code-cli-sdk.md

# Agent Notes

Running log of accomplishments, changes, and open threads for the Organic Software project.

## 2025-08-25
- Initialized `GPT-5 Findings` documentation folder with TOC (index, motivations, side-quests, tasks, reminders, changelog).
- Added Expo Router screens: `hello` and `issues` (reads InstantDB `issues`).
- Ensured `mobile-app/index.ts` uses `expo-router/entry` for routing.
- Updated `instant-message-handler.ts` to:
  - Emit host heartbeats to InstantDB for liveness (mobile shows 🟢/🔴).
  - Seed a first example `Issue` if none exists.
  - Print issues/heartbeats in stats; start/stop heartbeat lifecycle.

## Supervision & Process Model
- Introduce a lightweight supervisor script (e.g., `supervisor.ts`) to:
  - Start/monitor `instant-message-handler.ts` and Expo bundler.
  - Detect health via InstantDB heartbeats and logs; restart on failure.
  - Perform safe actions during code changes like dependency install: stop bundler, install, restart bundler.
  - Expose minimal commands (start/stop/status/restart) and structured logs.
- Rationale: the message handler shouldn’t supervise itself; separation keeps responsibilities clear and recovery reliable.

## Git Branching, Planning, Commits
- Each feature/bug fix:
  - Draft a short technical plan document (goals, scope, acceptance, risks).
  - Create a dedicated branch `feat/<slug>` or `fix/<slug>`.
  - Group all changes per plan into that branch; keep `develop` always runnable.
  - Commit style: Small, coherent commits with imperative subject; include InstanDB conversation/issue IDs in body.
  - On failure (syntax/bundle crash):
    - Supervisor stashes WIP or resets the working tree to last passing commit (configurable),
    - Records diff and logs to InstantDB for triage.

## Tests
- Added `tests/test-heartbeats.ts`: writes/reads `heartbeats` for host/mobile; verifies timestamps are recent.
- Next: add minimal issues round-trip (create/read) and a handler lifecycle smoke test under the supervisor.

## 2025-08-26
- Supervisor plan doc: `docs/supervisor-plan.md` (Phase 1 + Phase 2).
- Implemented `supervisor.ts`:
  - Starts handler and Expo bundler; restarts with backoff.
  - Health check via InstantDB `heartbeats`; restarts handler on stale beat.
  - Phase 2 hooks: `deps-mobile`, crash detection window + optional git recovery (`stash` or `reset`).
- Handler: added command routing to create issues directly from user messages.
- Tests: added `tests/test-issues.ts` (issues round-trip, admin-optional).
- System Design: Draft added at `docs/system-design.md` (Mermaid flowchart) and will be kept in sync.

## Next
- Ingest transcript into findings and generate a Claude system prompt draft and project docs structure.
- Add heartbeat status between mobile and host via InstantDB.
- Implement session persistence/transition tracking UI and notifications.
