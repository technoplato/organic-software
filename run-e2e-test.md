# 🧪 End-to-End Test Guide

This test validates the complete **Mobile → Host → Claude → Mobile** workflow.

## Test Overview

The E2E test simulates:
1. **Mobile app** sending a message to InstantDB
2. **Host app** detecting the message via real-time subscription  
3. **Host app** forwarding message to Claude Code SDK
4. **Claude Code** generating a response
5. **Host app** storing response in InstantDB
6. **Mobile app** receiving response via real-time sync

## How to Run

### Prerequisites
1. Set your API key in `.env`:
   ```bash
   echo "ANTHROPIC_API_KEY=your-actual-anthropic-api-key" >> .env
   ```

2. **Start the host app** in one terminal:
   ```bash
   bun run host
   ```
   
   Wait for this message:
   ```
   ✅ Remote message listener started - waiting for messages from mobile clients...
   ```

3. **Run the E2E test** in another terminal:
   ```bash
   bun run test-e2e
   ```

## Expected Test Flow

```
🧪 Starting End-to-End Remote Control Test
==================================================

📝 Step 1: Creating test conversation (simulating mobile app)
✅ Created conversation: abc-123-def

🎧 Step 2: Setting up response listener (simulating mobile app)  
✅ Response listener active

📱 Step 3: Sending test message (simulating mobile app)
💬 Sending: "Hello Claude! Please respond with exactly: 'E2E test successful'"
✅ Test message sent to database

⏳ Waiting for host to:
   1. Detect the message
   2. Send it to Claude Code  
   3. Store Claude's response
   4. Mobile listener receives response

🎉 Step 4: Received Claude's response!
🤖 Claude said: "E2E test successful"
✅ Response metadata confirms it came from host

🎉 END-TO-END TEST PASSED!
==================================================
✅ Mobile → Database → Host → Claude → Database → Mobile
✅ Real-time synchronization working
✅ Remote control system fully functional
```

## Host App Console During Test

When the test runs, you should see this in your host terminal:

```
📱 Remote message received: "Hello Claude! Please respond with exactly: 'E2E test successful'"
🤖 Claude responded: "E2E test successful"
```

## If Test Fails

**Timeout after 30s:**
- Check host app is running (`bun run host`)
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check host console for error messages
- Run `bun run check-messages` to see database state

**No response from Claude:**
- Verify API key has credits/access
- Check network connectivity
- Look for error messages in host console

**Database connection issues:**
- Verify InstantDB app ID is correct
- Check network connectivity to InstantDB

## What This Proves

✅ **Real-time bidirectional sync** between mobile and host  
✅ **Claude Code integration** processes messages correctly  
✅ **Message deduplication** prevents infinite loops  
✅ **Error handling** works for API failures  
✅ **Cross-device communication** functions end-to-end

Once this test passes, your remote control system is fully operational! 🚀