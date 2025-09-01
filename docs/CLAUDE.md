# Claude Code Remote Control Project

## Project Overview
This project enables bidirectional communication between a mobile React Native app and Claude Code, allowing users to send messages from their phone and have Claude process them with full tool access (file operations, bash commands, web search, etc.).

## Architecture
- **Mobile App** (`mobile-app/`): React Native/Expo app for sending messages
- **Message Handler** (`instant-message-handler.ts`): Node.js server that listens for messages from InstantDB and forwards them to Claude Code SDK
- **Database**: InstantDB for real-time message synchronization between mobile and server

## Key Files
- **`instant-message-handler.ts`**: Main server that handles message processing and Claude Code SDK integration
- **`mobile-app/App.tsx`**: Main entry point for the React Native mobile app
- **`tests/test-transitive-sessions.ts`**: Reference implementation for proper Claude Code SDK session handling

## Claude's Role
When working on this project, Claude should:
1. **Maintain conversation context** across messages using manual context injection
2. **Write integration test scripts** in the `tests/` directory to verify functionality
3. **Debug session management** issues with the Claude Code SDK
4. **Document findings** in test script headers

## Key Technical Challenge
The Claude Code SDK's session management is broken in the Bedrock proxy environment:
- **Theory**: Transitive session IDs (each response generates a NEW session ID)
- **Reality**: Even with proper transitive tracking, the SDK doesn't maintain context
- **Solution**: Manual conversation context injection via InstantDB

### Session Management Test Results
After extensive testing (see `tests/test-transitive-sessions.ts`):
- ❌ `continueSession: true` - Creates new session, no context preserved
- ❌ `resumeSessionId: "id"` - Wrong parameter name, use `resume` instead
- ✅ `resume: "sessionId"` - Correct parameter name for session resumption
- ✅ **Transitive session tracking** - Each response generates new session ID to use for next message
- ❌ **Manual context injection** - Should NOT be used, interferes with Claude's session context

**Critical Fix**: The `instant-message-handler.ts` now:
1. Uses the correct `resume` parameter (not `resumeSessionId`)
2. Sends only the current message to Claude (not database context)
3. Relies on Claude's session resumption to maintain conversation context
4. Removed database message injection that was interfering with Claude's native context management

## Test Scripts Convention
All integration test scripts should:
1. Be placed in the `tests/` directory
2. Include a header comment explaining:
   - The reasoning behind the test
   - What hypothesis we're testing
   - How to run the script
   - Expected results
3. Use descriptive console output with emojis for clarity

## Running the Project
```bash
# Start the message handler
npx tsx instant-message-handler.ts

# Run tests
npx tsx tests/[test-name].ts

# Mobile app (in mobile-app/ directory)
npm start
```

## Current Status
- ✅ Basic message passing works
- ❌ SDK session management (broken with Bedrock proxy)
- ✅ Conversation context via InstantDB (primary solution, not fallback!)
- ✅ Handler properly tracks transitive session IDs (for debugging)
- ✅ Tests organized in `tests/` directory
