# File Reorganization Plan

This document outlines the specific changes needed to reorganize the project according to the file organization rules.

## Directory Creation

1. Create the following directories if they don't exist:
   - `config/`
   - `scripts/`
   - `scripts/setup/`
   - `scripts/debug/`
   - `scripts/deployment/`
   - `server/`
   - `server/handlers/`
   - `server/services/`
   - `server/lib/`
   - `tests/e2e/`
   - `tests/integration/`
   - `tests/unit/`
   - `tests/fixtures/`

## File Movements

### Configuration Files
- Move `mcp-config.json` → `config/mcp-config.json`
- Move `openai_proxy_api_key.json` → `config/openai_proxy_api_key.json`
- Move `.env.new` → `config/.env.new`

### Server Files
- Move `instant-message-handler.ts` → `server/handlers/instant-message-handler.ts`
- Move `instant-message-handler-ai.ts` → `server/handlers/instant-message-handler-ai.ts`
- Move `instant-message-handler.backup.ts` → `server/handlers/instant-message-handler.backup.ts`
- Move `supervisor.ts` → `server/supervisor.ts`
- Move `add-issues.ts` → `server/handlers/add-issues.ts`

### Script Files
- Move `setup-dependencies.sh` → `scripts/setup/setup-dependencies.sh`
- Move `start-supervisor.sh` → `scripts/deployment/start-supervisor.sh`
- Move `stop-supervisor.sh` → `scripts/deployment/stop-supervisor.sh`
- Move `supervisor-logs.sh` → `scripts/debug/supervisor-logs.sh`
- Move `check-devices.ts` → `scripts/debug/check-devices.ts`
- Move `check-messages.ts` → `scripts/debug/check-messages.ts`
- Move `send-push-to-token.ts` → `scripts/debug/send-push-to-token.ts`
- Move `send-test-message.ts` → `scripts/debug/send-test-message.ts`
- Move `sanity-check.ts` → `scripts/debug/sanity-check.ts`

### Test Files
- Move `test-ai-sdk.ts` → `tests/unit/test-ai-sdk.ts`
- Move `test-both-endpoints.ts` → `tests/integration/test-both-endpoints.ts`
- Move `test-claude.ts` → `tests/unit/test-claude.ts`
- Move `test-e2e-flow.ts` → `tests/e2e/test-e2e-flow.ts`
- Move `test-error-dispatch.ts` → `tests/unit/test-error-dispatch.ts`
- Move `test-generateobject-proper.ts` → `tests/unit/test-generateobject-proper.ts`
- Move `test-message-handler.ts` → `tests/integration/test-message-handler.ts`
- Move `test-openai-structured.ts` → `tests/unit/test-openai-structured.ts`
- Move `test-push-notification.ts` → `tests/integration/test-push-notification.ts`
- Move `test-remote-control.ts` → `tests/integration/test-remote-control.ts`
- Move `test-simple.ts` → `tests/unit/test-simple.ts`
- Move `test-streaming-ai.ts` → `tests/unit/test-streaming-ai.ts`
- Move `test-structured-clean.ts` → `tests/unit/test-structured-clean.ts`
- Move `test-structured-final.ts` → `tests/unit/test-structured-final.ts`
- Move `test-structured-output.ts` → `tests/unit/test-structured-output.ts`
- Move `test-structured-simple.ts` → `tests/unit/test-structured-simple.ts`
- Move `test-structured-support.ts` → `tests/unit/test-structured-support.ts`
- Move `test-structured-working.ts` → `tests/unit/test-structured-working.ts`
- Move `test-subscribe.ts` → `tests/integration/test-subscribe.ts`
- Move `test-subscription.ts` → `tests/integration/test-subscription.ts`
- Move `test-verbose.ts` → `tests/unit/test-verbose.ts`
- Move `test-session-debug.json` → `tests/fixtures/test-session-debug.json`
- Move `test-handler-fix.env` → `tests/fixtures/test-handler-fix.env`

### Documentation Files
- Move `ARCHITECTURE.md` → `docs/architecture.md`
- Move `PROJECT.md` → `docs/project.md`
- Move `CLAUDE.md` → `docs/claude.md`
- Move `brainstorm.md` → `docs/brainstorm.md`
- Move `instant-rules.md` → `docs/instant-rules.md`
- Move `issues.MD` → `docs/issues.md`
- Move `push-notification-debug-report.md` → `docs/push-notification-debug-report.md`
- Move `run-e2e-test.md` → `docs/run-e2e-test.md`
- Move `story.TXT` → `docs/story.md` (convert to markdown)
- Move `todos.md` → `docs/todos.md`

### Library Files
- Move `lib/litellm-provider.ts` → `server/lib/litellm-provider.ts`
- Move `lib/logger.ts` → `server/lib/logger.ts`
- Move `lib/openai-proxy-provider.ts` → `server/lib/openai-proxy-provider.ts`

## Update Import Paths

After moving files, update import paths in all files to reflect the new directory structure. For example:

- Change `import { logger } from './lib/logger'` to `import { logger } from '../../lib/logger'` in server files
- Update relative paths in test files to point to the new locations of the files they're testing

## Update Package.json Scripts

Update the scripts in package.json to reflect the new file locations. For example:

- Change `"start": "ts-node instant-message-handler.ts"` to `"start": "ts-node server/handlers/instant-message-handler.ts"`
- Change `"test": "ts-node tests/test-heartbeats.ts"` to `"test": "ts-node tests/unit/test-heartbeats.ts"`

## Implementation Strategy

1. Create all necessary directories first
2. Move configuration files
3. Move server files and update their imports
4. Move script files
5. Move test files and update their imports
6. Move documentation files
7. Update package.json scripts
8. Test the application to ensure everything works correctly after reorganization