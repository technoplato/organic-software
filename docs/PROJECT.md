# Organic Software Project Status

**Last Updated:** August 30th, 8:41 PM

## 🚀 Current Status

An experimental project exploring AI-driven development workflows with real-time communication between mobile apps and development environments via InstantDB. The system features a supervisor-managed architecture with automatic error recovery and structured AI interactions.

## ✅ Recently Added Features

### AI SDK Integration (Latest)
- **Vercel AI SDK** integration with LiteLLM proxy for Claude 3.7 Sonnet
- **Custom LiteLLM provider** (`lib/litellm-provider.ts`) for OpenAI-compatible endpoints
- **Comprehensive documentation** in `docs/ai-sdk/` covering providers, structured data, and custom implementations
- **Structured output testing** with multiple test files exploring different approaches

### Mobile App Enhancements
- **Voice input functionality** working in foreground mode
- **Dark mode support** fully implemented
- **Push notifications** with working token-based delivery
- **InstantDB ID integration** - fixed conversation screen to use real InstantDB IDs instead of generated ones
- **Zod validation** and AI SDK dependencies added to mobile app

### Infrastructure
- **Supervisor system** (`supervisor.ts`) with process monitoring and auto-restart
- **Message handler** (`instant-message-handler.ts`) with heartbeat system
- **Test suite** for heartbeats, issues, and InstantDB operations

## 🟢 What's Working

- ✅ **Voice input** (foreground only)
- ✅ **Dark mode** UI
- ✅ **Push notifications** delivery
- ✅ **InstantDB** real-time sync
- ✅ **Supervisor** process management
- ✅ **AI SDK** basic text generation
- ✅ **Mobile app** core functionality
- ✅ **Issue tracking** via InstantDB

## 🔴 Known Issues

- ❌ **Background voice recording** not working yet
- ❌ **Structured outputs** with AI SDK - schema validation failing
- ❌ **Tool calling** with LiteLLM/Bedrock - JSON schema incompatibility
- ❌ **Zod v4** compatibility issues with AI SDK provider utils

## 🧪 Test Results

### Structured Output Tests
```bash
# Working tests
npx tsx test-structured-clean.ts     # ✅ Basic JSON extraction
npx tsx test-ai-sdk.ts              # ✅ Simple text generation

# Failing tests  
npx tsx test-structured-output.ts    # ❌ Zod schema validation
npx tsx test-structured-simple.ts    # ❌ Tool calling with Bedrock
```

### Push Notifications
```bash
npx tsx send-push-to-token.ts        # ✅ Working delivery
```

### InstantDB Operations
```bash
npx tsx tests/test-heartbeats.ts     # ✅ Heartbeat system
npx tsx tests/test-issues.ts         # ✅ Issue CRUD operations
```

## 🛠️ Development Commands

### Mobile App
```bash
cd mobile-app
npm run ios                          # Start iOS development build
npm run start                       # Start Expo bundler
```

### Backend Services
```bash
npx tsx supervisor.ts                # Start supervisor system
npx tsx instant-message-handler.ts   # Start message handler directly
```

### Testing
```bash
npx tsx test-*.ts                    # Run various test suites
npx tsx tests/test-*.ts              # Run InstantDB tests
```

## 📋 Next Steps

### High Priority
1. **Fix structured outputs** - resolve Zod v4 compatibility with AI SDK
2. **Background voice recording** - implement iOS background audio permissions
3. **Tool calling** - fix JSON schema format for LiteLLM/Bedrock compatibility

### Medium Priority
1. **UI improvements** for voice input interface
2. **Error handling** improvements in mobile app
3. **Session persistence** and transition tracking

### Low Priority
1. **Android support** (currently iOS-only per project rules)
2. **Additional AI providers** beyond Claude
3. **Enhanced logging** and debugging tools

## 🏗️ Architecture

- **Mobile App**: Expo/React Native with InstantDB sync
- **Backend**: Node.js with supervisor pattern
- **AI Integration**: Vercel AI SDK + LiteLLM proxy
- **Database**: InstantDB for real-time sync
- **Notifications**: Expo push notifications

## 📚 Key Documentation

- [`docs/ai-sdk/`](docs/ai-sdk/) - AI SDK integration guides
- [`docs/supervisor-plan.md`](docs/supervisor-plan.md) - Supervisor architecture
- [`mobile-app/SPEECH_RECOGNITION_IMPLEMENTATION.md`](mobile-app/SPEECH_RECOGNITION_IMPLEMENTATION.md) - Voice input details
- [`mobile-app/PUSH_NOTIFICATIONS_SETUP.md`](mobile-app/PUSH_NOTIFICATIONS_SETUP.md) - Push notification setup

---

*This project follows an experimental approach where intentional broken states are used to test auto-recovery systems. The supervisor and message handlers are designed to handle and resolve issues automatically.*