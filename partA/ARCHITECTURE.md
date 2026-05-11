# ARCHITECTURE.md

## System Overview

```mermaid
graph TB
    subgraph Client Layer
        C1[Client 1<br/>Browser]
        C2[Client 2<br/>Browser]
        C3[Client 3<br/>Browser]
        C4[Client 4<br/>Browser]
        ADMIN[Admin Panel<br/>Browser]
    end

    subgraph Server Layer
        EXPRESS[Express HTTP Server<br/>:3000]
        NSA[Socket.IO Namespace<br/>/server-a]
        NSB[Socket.IO Namespace<br/>/server-b]
        NSADMIN[Socket.IO Namespace<br/>/admin]
        RELAY[Message Relay<br/>250ms delay]
    end

    subgraph Auth Layer
        SESSIONS[Session Map<br/>token → user]
        ADMINS[Admin Map<br/>user → password]
        CLIENTS[Client Map<br/>user → clientId]
    end

    C1 -->|Socket.IO| NSA
    C2 -->|Socket.IO| NSA
    C3 -->|Socket.IO| NSB
    C4 -->|Socket.IO| NSB
    ADMIN -->|Socket.IO| NSADMIN

    NSA -->|relay| RELAY
    NSB -->|relay| RELAY
    RELAY -->|broadcast| NSA
    RELAY -->|broadcast| NSB

    EXPRESS --> SESSIONS
    EXPRESS --> ADMINS
    EXPRESS --> CLIENTS
```

## Module Description

| Module | File | Үүрэг |
|--------|------|-------|
| HTTP Server | server.js | Express app, static file serve |
| Auth API | server.js `/api/*` | Login, register, logout, admin CRUD |
| Socket Relay | server.js `attachServer()` | Message relay between namespaces |
| Admin Namespace | server.js `/admin` | Real-time stats, server toggle, kick |
| Frontend Client | public/client.html + client.js | Chat UI, socket connection |
| Frontend Admin | public/index.html + app.js | Admin dashboard |

## Data Flow

```mermaid
sequenceDiagram
    participant C as Client (Server A)
    participant SA as Namespace /server-a
    participant SB as Namespace /server-b
    participant ADM as /admin

    C->>SA: emit('message', {text})
    SA->>SA: broadcast to all /server-a clients
    SA->>ADM: emit('message', msg)
    SA-->>SB: setTimeout 250ms relay
    SB->>SB: broadcast to all /server-b clients
```

## Layer Description
- **Client Layer**: Browser-based UI, no framework, Socket.IO client
- **Server Layer**: Single Node.js process, multiple Socket.IO namespaces
- **Auth Layer**: In-memory Maps (no DB), token-based admin sessions
