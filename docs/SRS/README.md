# Software Requirements Specification (SRS)

## 1. Document Purpose
This document explains what the Scalable Chat App must do from a business and user point of view.

It is written in easy words so developers, reviewers, and non-technical stakeholders can all understand:
- what problem the system solves
- what users can do
- what quality and performance level is expected
- what constraints and assumptions exist

## 2. Product Overview
Scalable Chat App is a real-time messaging platform built as a monorepo.

Main goal:
- users can send messages instantly
- many users can connect at the same time
- architecture is ready for scaling using Redis and Kafka

High-level product parts:
- `apps/web`: Next.js web client
- `apps/server`: Socket.IO + Redis + Kafka backend
- `apps/docs`: docs frontend app (currently template)
- `packages/*`: shared tooling and UI packages

## 3. Stakeholders
- End users: send and receive real-time chat messages
- Developers: build and maintain features
- DevOps/SRE: deploy and monitor system
- Product owner: decides features and priorities

## 4. Scope
### 4.1 In Scope (Current)
- Real-time message send/receive via Socket.IO
- Redis pub/sub fanout for message distribution
- Kafka producer integration for event stream publishing
- Monorepo setup with Turborepo and Yarn workspaces
- Basic chat UI in web app

### 4.2 Out of Scope (Current)
- Authentication and authorization
- User profiles and roles
- Message history API for pagination/search
- Media sharing (images/files)
- Delivery/read receipts
- Multi-room support (single stream currently)

## 5. Product Goals
- Fast message delivery in near real-time
- Horizontal scaling support through Redis pub/sub
- Event-driven processing support through Kafka
- Clean codebase structure for future growth

## 6. User Types and Needs
### 6.1 Chat User
Needs:
- simple text box
- send button
- receive messages quickly

### 6.2 Developer
Needs:
- clear local setup
- environment variable based configuration
- modular service structure

### 6.3 Operations Team
Needs:
- externalized secrets via environment variables
- simple deployment and observability points

## 7. Functional Requirements

### FR-01: Open Chat Client
- User opens web app in browser.
- System initializes Socket.IO client and connects to chat server.
- Connection should happen automatically.

Acceptance criteria:
- Client attempts connection at startup.
- No manual connect action required.

### FR-02: Send Message
- User types text and clicks Send.
- Client emits `event:message` with payload `{ message: string }`.

Acceptance criteria:
- Event is sent from browser to server.
- Empty or invalid payload handling should be added in future hardening.

### FR-03: Server Receives Message
- Server listens for `event:message`.
- Server publishes incoming message to Redis channel `MESSAGES`.

Acceptance criteria:
- Server logs and publishes message without blocking event loop for long operations.

### FR-04: Redis Fanout
- Server subscribes to channel `MESSAGES`.
- When message is received from Redis, server emits `message` event to connected clients.

Acceptance criteria:
- Connected clients receive message event.
- Payload must be valid JSON containing message text.

### FR-05: Kafka Publishing
- On Redis subscription handler, server produces message to Kafka topic.
- Topic value should be configurable via environment variable.

Acceptance criteria:
- Kafka producer is initialized once and reused.
- Produce operation is attempted for each incoming message.

### FR-06: Message Display on Client
- Web client listens for `message` event.
- Payload is parsed and appended to local message list.

Acceptance criteria:
- New messages appear in UI list.
- Existing messages remain visible in session state.

### FR-07: Service Startup
- Server process starts HTTP server and attaches Socket.IO.
- Listener initialization starts socket listeners and Redis subscription.

Acceptance criteria:
- Startup logs show server port and socket initialization.

## 8. Non-Functional Requirements

### NFR-01: Performance
- Real-time message round trip should typically feel instant in local or low-latency environments.
- System should avoid heavy synchronous operations on hot paths.

### NFR-02: Scalability
- Architecture must support running multiple server instances.
- Redis pub/sub should allow broadcasting across instances.
- Kafka should support downstream asynchronous consumers.

### NFR-03: Reliability
- Failures in Kafka should not crash entire server process (recommended hardening).
- Connection retry strategy for Redis/Kafka should be considered (future enhancement).

### NFR-04: Security
- Secrets must come from environment variables.
- No credentials should be hardcoded in committed source files.
- `.env` should stay out of version control.

### NFR-05: Maintainability
- Code should be modular and service-oriented (`socket.ts`, `kafka.ts`, `prisma.ts`).
- TypeScript typing should be strict enough to catch obvious runtime issues.

### NFR-06: Observability
- Basic logs should exist for connect, receive, publish, and produce actions.
- Future: add structured logging and tracing IDs.

## 9. External Interface Requirements

### 9.1 UI
- Single-page chat interface with text input and send button.
- Message list shows incoming chat messages.

### 9.2 API/Event Contracts
Socket inbound event from client:
```json
{
  "event": "event:message",
  "data": {
    "message": "hello"
  }
}
```

Socket outbound event from server:
```json
{
  "event": "message",
  "data": "{\"message\":\"hello\"}"
}
```

Redis pub/sub message body:
```json
{
  "message": "hello"
}
```

Kafka message:
- Topic: value of `KAFKA_TOPIC`
- Key: `message-<timestamp>`
- Value: raw message string

## 10. Environment Requirements
Required server environment variables:
- `PORT` (optional, default 8000)
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `KAFKA_BROKER`
- `KAFKA_SSL_CA_PATH`
- `KAFKA_SASL_USERNAME`
- `KAFKA_SASL_PASSWORD`
- `KAFKA_TOPIC`

## 11. Constraints
- Built in TypeScript across apps
- Uses Node.js runtime and Yarn workspace tooling
- Uses Redis and Kafka external services
- Current frontend assumes backend at `http://localhost:8000`

## 12. Assumptions and Dependencies
Assumptions:
- Redis and Kafka are reachable and credentials are valid
- CA certificate file exists at configured path
- Client and server versions are compatible

Dependencies:
- `socket.io`, `socket.io-client`
- `ioredis`
- `kafkajs`
- `@prisma/client` (currently optional in message path)

## 13. Risks and Mitigations
Risk: secrets accidentally committed
- Mitigation: enforce `.env` in `.gitignore`, use push protection, code reviews

Risk: single channel message flood
- Mitigation: introduce rooms, rate limits, backpressure strategy

Risk: connection failures to Redis/Kafka
- Mitigation: retry policies, health checks, alerts

Risk: message ordering/duplication in distributed environment
- Mitigation: idempotency keys and consumer-side dedupe logic

## 14. Future Requirements
- Authentication (JWT/session)
- Chat rooms and private messages
- Message persistence and history API
- Message status (sent/delivered/read)
- Moderation and abuse control
- Monitoring dashboard and tracing

## 15. Acceptance Summary
The current release is acceptable when:
- web client connects to socket server
- user can send a message
- message is broadcast back to clients
- message is published to Redis and produced to Kafka
- no hardcoded secrets remain in source code
- project runs through workspace scripts
