# System Design (Draft)

```mermaid
flowchart LR
  subgraph Mobile[Mobile App (Expo)]
    UI[UI Screens\nConversations/Issues/Logs]
    RN[React Native Code]
    MDB[InstantDB React Native SDK]
    UI --> RN
    RN --> MDB
  end

  subgraph Host[Host Machine]
    HND[instant-message-handler.ts\n(Claude Code client)]
    SUP[supervisor.ts\n(proc mgmt + health)]
    NPM[NPM/Node]
    GIT[Git]
  end

  subgraph Cloud[InstantDB]
    DB[(Conversations, Messages, Issues, Heartbeats, Logs)]
  end

  UI -- create message --> MDB
  MDB == sync == DB
  DB -- subscription --> HND
  HND -- invoke --> CLAUDE[(Claude Code SDK)]
  CLAUDE -- responses/edits --> HND
  HND -- write replies & metadata --> DB
  SUP -- health checks --> DB
  SUP -- start/stop --> HND
  SUP -- start/stop --> NPM
  SUP -- git recovery --> GIT

  classDef box fill:#0b5,stroke:#092,stroke-width:1,color:#fff
  class UI,RN,MDB,HND,SUP,DB,NPM,GIT,CLAUDE box
```

Key Decisions
- Single message bus: InstantDB for messages, issues, heartbeats, logs.
- Listener is dumb: forward messages to LLM; no manual parsing.
- Supervisor manages process health and restarts; handler focuses on message processing.
- Sessions: use Claude session resumption; store per-conversation session IDs.
- Liveness: host/mobile heartbeats in `heartbeats`, UI indicators in header.
- Observability: write structured logs to `logs` entity (host and supervisor events).

Open Items
- Branch orchestration and plan docs per feature.
- Dependency-aware bundler restarts in supervisor (Phase 2 implemented for mobile deps).
- Issues linking: include `conversationId` and `messageId` when LLM decides to create issues.
