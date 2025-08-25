# Organic Software

A real-time, cross-platform application for communicating with Claude Code via TypeScript and synchronizing conversations across devices using InstantDB.

## Overview

This project enables seamless interaction with Claude Code from multiple clients while maintaining synchronized conversation history through real-time database synchronization. The architecture consists of a host TypeScript application and a mobile Expo client, both connected through InstantDB for instant data synchronization.

## Architecture

### Host Application (TypeScript + Bun)
- **Runtime**: Bun - Fast JavaScript runtime with native TypeScript support
- **Purpose**: Primary interface for Claude Code communication
- **Location**: Root directory (`index.ts`)
- **Responsibilities**:
  - Direct integration with Claude Code SDK
  - Conversation management and processing
  - Real-time sync with InstantDB
  - Authentication and session management

### Mobile Client (Expo + React Native)
- **Framework**: Expo with TypeScript template
- **Purpose**: Mobile interface for monitoring and interacting with Claude Code sessions
- **Location**: `mobile-app/` directory
- **Features**:
  - Real-time conversation viewing
  - Remote command execution
  - Notification system for new responses
  - Cross-platform compatibility (iOS/Android/Web)

### Database Layer (InstantDB)
- **Technology**: InstantDB - Modern Firebase alternative
- **Purpose**: Real-time data synchronization between host and clients
- **Features**:
  - Instant real-time updates
  - Offline support with automatic sync
  - Built-in authentication
  - Collaborative data management

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Bun | 1.2.20+ | Fast JavaScript/TypeScript execution |
| Mobile Framework | Expo | 53.0+ | Cross-platform mobile development |
| Database | InstantDB | Latest | Real-time data synchronization |
| AI SDK | Claude Code SDK | Latest | Claude AI integration |
| Language | TypeScript | 5.8+ | Type-safe development |
| Authentication | InstantDB Auth | - | User management and security |

## Project Structure

```
remote-organic-software/
├── setup-dependencies.sh          # Dependency installation script
├── package.json                   # Bun project configuration
├── index.ts                       # Host application entry point
├── tsconfig.json                  # TypeScript configuration
├── PROJECT.md                     # This documentation
├── CLAUDE.md                      # Claude Code specific configuration
└── mobile-app/                    # Expo mobile application
    ├── App.tsx                    # Main mobile app component
    ├── package.json               # Mobile app dependencies
    ├── tsconfig.json              # Mobile TypeScript config
    └── assets/                    # Mobile app assets
```

## Key Features

### Real-Time Synchronization
- Instant conversation updates across all connected devices
- Automatic conflict resolution and data consistency
- Offline-first architecture with sync on reconnection

### Cross-Platform Support
- Native mobile apps (iOS/Android) via Expo
- Web interface through Expo web
- Desktop host application via Bun

### Claude Code Integration
- Direct SDK integration for AI interactions
- Session management and conversation history
- Error handling and retry mechanisms
- Streaming response support

### Security & Authentication
- Secure authentication via InstantDB
- User-based conversation isolation
- API key management and rotation
- End-to-end encryption for sensitive data

## Development Workflow

### Prerequisites
- Node.js (v18+)
- Bun runtime
- Expo CLI
- InstantDB account
- Claude API key

### Setup Instructions

1. **Install Dependencies**
   ```bash
   ./setup-dependencies.sh
   ```

2. **Configure Environment**
   ```bash
   # Set up Claude API key
   export ANTHROPIC_API_KEY="your-api-key"
   
   # Configure InstantDB
   export INSTANTDB_APP_ID="your-app-id"
   ```

3. **Start Host Application**
   ```bash
   bun run index.ts
   ```

4. **Start Mobile Development**
   ```bash
   cd mobile-app
   bun run start
   ```

### Development Commands

| Command | Purpose |
|---------|---------|
| `bun run index.ts` | Start host application |
| `bun run dev` | Development mode with hot reload |
| `cd mobile-app && bun run start` | Start Expo development server |
| `cd mobile-app && bun run ios` | Launch iOS simulator |
| `cd mobile-app && bun run android` | Launch Android emulator |
| `cd mobile-app && bun run web` | Launch web development |

## Integration Points

### Claude Code SDK
- Programmatic access to Claude AI capabilities
- Session management and conversation threading
- Tool integration and custom function calling
- Response streaming and error handling

### InstantDB Schema
```typescript
// Conversation schema
interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Message schema
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### Real-Time Events
- `conversation:created` - New conversation started
- `message:sent` - User message sent to Claude
- `message:received` - Claude response received
- `session:connected` - Client connected to sync
- `session:disconnected` - Client disconnected

## Deployment Strategy

### Host Application
- Containerized deployment with Docker
- Environment variable management
- Health checks and monitoring
- Auto-scaling based on usage

### Mobile Application
- EAS Build for production apps
- App Store / Play Store distribution
- Over-the-air updates via Expo
- Analytics and crash reporting

### Database
- InstantDB cloud hosting
- Automatic backups and recovery
- Performance monitoring
- Usage analytics

## Security Considerations

- API keys stored in secure environment variables
- User authentication required for all operations
- Conversation data encrypted at rest
- Rate limiting to prevent abuse
- Audit logging for security events

## Future Enhancements

- Voice input/output integration
- File sharing and document processing
- Multi-user collaboration features
- Advanced search and filtering
- Custom plugin system
- Analytics dashboard
- Notification system improvements

## Contributing

This project follows TypeScript best practices and uses Bun for optimal performance. All changes should maintain type safety and include appropriate error handling.

---

*This project demonstrates the power of modern JavaScript tooling combined with AI capabilities to create seamless, real-time applications.*