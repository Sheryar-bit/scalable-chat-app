# Software Design Specification (SDS)

## 1. Document Purpose
This document explains how the Scalable Chat App is designed and implemented.

SRS answers "what" the system should do.
SDS answers "how" the system does it.

This SDS uses simple language while still giving enough technical depth for developers.

## 2. System Context
The project is a Turborepo monorepo with separate apps and shared packages.

Main runtime path:
1. Web app sends message through Socket.IO
2. Server receives message and publishes to Redis
3. Server subscription receives message and broadcasts to clients
4. Same message is produced to Kafka topic for async pipelines

## 3. Codebase Structure
- `apps/server/src/index.ts`: backend entry point
- `apps/server/src/services/socket.ts`: real-time socket and Redis logic
- `apps/server/src/services/kafka.ts`: Kafka producer service
- `apps/server/src/services/prisma.ts`: Prisma client setup
- `apps/server/prisma/schema.prisma`: data model definition
- `apps/web/app/page.tsx`: chat UI page
- `apps/web/context/socketProvider.tsx`: client socket context and event wiring

## 4. Runtime Components

### 4.1 Web Client (Next.js)
Responsibilities:
- Render chat input and message list
- Maintain local message state
- Connect to Socket.IO server
- Send and receive message events

Key files:
- `apps/web/app/page.tsx`
- `apps/web/context/socketProvider.tsx`

### 4.2 Socket Service (Node + Socket.IO)
Responsibilities:
- Accept socket connections
- Listen for `event:message`
- Publish message to Redis channel `MESSAGES`
- Subscribe to same channel and emit `message` event to clients
- Trigger Kafka produce flow

Key file:
- `apps/server/src/services/socket.ts`

### 4.3 Redis Layer
Responsibilities:
- Decouple message publish and fanout
- Support future horizontal server scaling

Design detail:
- one Redis client for publish (`pub`)
- one Redis client for subscribe (`sub`)

### 4.4 Kafka Producer Service
Responsibilities:
- Create producer lazily and reuse singleton instance
- Produce chat messages to configured Kafka topic

Key file:
- `apps/server/src/services/kafka.ts`

### 4.5 Prisma and Database Layer
Responsibilities:
- Provide ORM client and schema for message persistence
- Current persistence call exists as commented placeholder in socket flow

Key files:
- `apps/server/src/services/prisma.ts`
- `apps/server/prisma/schema.prisma`

## 5. Detailed Design

### 5.1 Server Startup Sequence
1. `init()` runs from `index.ts`
2. Create `SocketService`
3. Create HTTP server
4. Attach Socket.IO server to HTTP server
5. Start listening on `PORT` (default 8000)
6. Call `initlistener()` to register socket and Redis handlers

### 5.2 Message Inbound Path
1. User clicks send in web app
2. Client emits `event:message` with `{ message }`
3. Server receives event inside socket handler
4. Server publishes JSON message to Redis channel `MESSAGES`

### 5.3 Message Outbound Path
1. Redis subscriber receives message
2. Server parses payload and emits socket event `message`
3. All connected clients receive and render message

### 5.4 Kafka Event Path
1. Redis subscriber callback calls `produceMessage(message)`
2. `produceMessage` uses singleton producer from `createProducer`
3. Producer sends message with time-based key to topic from `KAFKA_TOPIC`

### 5.5 Client Message Rendering
1. `SocketProvider` listens for `message` event
2. Parses JSON payload to extract `message` text
3. Pushes message into local array state
4. UI maps array items into list output

## 6. Data Design

### 6.1 In-Memory Data
Client:
- `messages: string[]`
- local input field state

Server:
- singleton Kafka producer
- active socket connections in Socket.IO runtime

### 6.2 Persistence Model (Prisma)
Model: `Message`
- `id`: UUID (primary key)
- `text`: message text
- `createdAt`: timestamp mapped to `created_at`

Table name mapping:
- Prisma model `Message` maps to database table `Messages`

## 7. Interface Design

### 7.1 Socket.IO Contracts
Inbound to server:
- Event: `event:message`
- Payload: `{ message: string }`

Outbound to client:
- Event: `message`
- Payload: JSON string, shape `{ message: string }`

### 7.2 Redis Contract
- Channel: `MESSAGES`
- Payload: JSON string, shape `{ message: string }`

### 7.3 Kafka Contract
- Topic: value from `KAFKA_TOPIC`
- Message key: `message-${Date.now()}`
- Message value: raw string

## 8. Configuration Design
Server environment variables used by design:
- `PORT`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `KAFKA_BROKER`
- `KAFKA_SSL_CA_PATH`
- `KAFKA_SASL_USERNAME`
- `KAFKA_SASL_PASSWORD`
- `KAFKA_TOPIC`

Design principle:
- all secrets and endpoints must be externalized in environment files or secret managers

## 9. Build and Execution Design
Root workspace scripts:
- `yarn dev`: run all dev tasks via Turbo
- `yarn build`: build all packages
- `yarn lint`: lint all packages
- `yarn check-types`: type checks all packages

Server scripts:
- `yarn workspace server dev`: compile watch and run Node dist output
- `yarn workspace server build`: compile TypeScript

Web scripts:
- `yarn workspace web dev`: run Next.js app on port 3000

## 10. Error Handling Design (Current and Recommended)
Current behavior:
- Basic console logging
- No centralized error middleware

Recommended improvements:
- wrap async message handlers in try/catch
- add retry/backoff for Redis and Kafka connections
- add dead letter strategy for Kafka failures
- validate payloads before publish/produce

## 11. Security Design
Current controls:
- environment-driven config instead of hardcoded secrets

Required controls for production:
- secret manager integration
- TLS enforced for external services
- stricter CORS configuration
- input sanitization and rate limiting
- dependency vulnerability scanning

## 12. Scalability Design
Current enablers:
- Redis pub/sub decoupling
- Kafka for async processing
- stateless socket server process (except runtime connections)

Scale strategy:
- run multiple server replicas
- use load balancer with sticky sessions for WebSockets if needed
- offload heavy tasks to Kafka consumers

## 13. Deployment Design (Reference)
Minimal deployment units:
- web app service
- server app service
- managed Redis
- managed Kafka
- managed PostgreSQL (when persistence is enabled)

Suggested environment split:
- local
- development
- staging
- production

## 14. Testing Design
Current status:
- no dedicated automated test suite committed yet

Recommended test plan:
- unit tests for message handlers and parser logic
- integration tests for socket + Redis path
- contract tests for Kafka producer payload format
- end-to-end tests for browser send/receive flow

## 15. Known Gaps
- Message persistence path is commented out in socket service
- No auth and no room/channel segmentation
- No standardized structured logs
- Basic client message list rendering lacks key/id hardening

## 16. Change Strategy
When adding new feature modules:
1. define requirement in SRS first
2. design event/data contracts in SDS
3. implement in isolated service file
4. add tests and observability
5. update architecture doc if data flow changes

## 17. Design Summary
The project uses a practical event-driven real-time design:
- Socket.IO for immediate user communication
- Redis for scalable fanout across instances
- Kafka for stream-based async processing
- Prisma model ready for database persistence

This design is a strong base for a production-grade chat platform once security, testing, and operational hardening are completed.
