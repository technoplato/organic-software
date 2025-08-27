# Organic Software – Mobile + Host LLM Supervisor

A simple way to control a local codebase from your phone. The Expo app sends messages via InstantDB; a Node listener forwards them to Claude Code and writes responses back. A small supervisor keeps the listener and bundler healthy.

## Prerequisites
- Node 20+
- npm
- Expo Go app (on device) or iOS/Android simulator
- InstantDB App ID and Anthropic API key

Create `.env` in the repo root:

```
INSTANTDB_APP_ID=your-instantdb-app-id
ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional (improves test reliability)
INSTANTDB_ADMIN_TOKEN=your-instantdb-admin-token
```

The mobile app reads `EXPO_PUBLIC_INSTANTDB_APP_ID` from Expo env; if not set, a sample ID is used in code.

## Install
```
npm install
cd mobile-app && npm install && cd ..
```

## Run Everything (Supervisor)
```
npm run supervisor
```
This:
- Starts `instant-message-handler.ts` (Claude Code + InstantDB listener)
- Starts `expo start` in `mobile-app`
- Checks host heartbeats every 10s and restarts the handler if stale

### Open the App
- Scan the QR in the terminal with Expo Go, or:
```
cd mobile-app && npm run ios   # iOS simulator
cd mobile-app && npm run android  # Android emulator
cd mobile-app && npm run web      # Expo Web (browser UI)
```

## What to Observe
- Header status dot:
  - Green: host online (heartbeats from handler within 20s)
  - Red: offline (web uses a tighter 10s threshold)
- Conversations:
  - Tap “+ New” to create a conversation and send a message
  - Messages move: pending → processing → completed/error
- Issues screen:
  - Shows seeded “First issue” if none exist
  - New issues appear when the LLM writes to `issues`
- Logs screen:
  - Shows handler events: processing, sending to Claude, responded, errors

## Useful Commands
```
# Start/stop/manage
npm run supervisor
node supervisor.ts restart-handler
node supervisor.ts restart-bundler
node supervisor.ts deps-mobile   # stop bundler, npm install in mobile-app, restart bundler

# Tests (optional; admin token recommended)
npx tsx tests/test-heartbeats.ts
npx tsx tests/test-issues.ts
```

## Design
- Docs: `docs/system-design.md` (Mermaid), `docs/supervisor-plan.md`
- Listener: dumb; it forwards messages to the LLM and writes responses
- Supervisor: keeps processes healthy; optional Git recovery via env:
  - `SUPERVISOR_ENABLE_GIT=1`
  - `SUPERVISOR_GIT_RECOVERY=stash|reset`

## Troubleshooting
- Red status dot: ensure `npm run supervisor` is running; verify `INSTANTDB_APP_ID`
- Handler startup fails: verify `ANTHROPIC_API_KEY` and any Bedrock-related envs you use
- No Issues/Logs: send a message to trigger logs; LLM can create issues (ensure prompt instructs it to include conversationId/messageId)
