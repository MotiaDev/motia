# Complete Backend Generator

Build any type of production-ready backend with Motia following proven patterns.

## Backend Types

### 1. REST API Backend
```typescript
// E-commerce API Example
steps/
├── api/
│   ├── auth/
│   │   ├── login.step.ts
│   │   ├── register.step.ts
│   │   └── refresh-token.step.ts
│   ├── products/
│   │   ├── create-product.step.ts
│   │   ├── list-products.step.ts
│   │   ├── update-product.step.ts
│   │   └── delete-product.step.ts
│   ├── orders/
│   │   ├── create-order.step.ts
│   │   ├── process-payment.step.ts
│   │   └── track-order.step.ts
│   └── admin/
│       └── dashboard.step.ts
├── events/
│   ├── process-order.step.ts
│   ├── send-confirmation.step.ts
│   └── update-inventory.step.ts
└── cron/
    ├── cleanup-carts.step.ts
    └── generate-reports.step.ts
```

### 2. Real-time Chat Backend
```typescript
// Chat Application
steps/
├── api/
│   ├── chat/
│   │   ├── create-room.step.ts
│   │   ├── join-room.step.ts
│   │   └── send-message.step.ts
│   └── users/
│       └── update-status.step.ts
├── events/
│   ├── broadcast-message.step.ts
│   ├── notify-users.step.ts
│   └── persist-message.step.ts
└── streams/
    └── chat-messages.stream.ts
```

### 3. AI-Powered Backend
```typescript
// AI Assistant API
steps/
├── api/
│   ├── chat/
│   │   └── send-prompt.step.ts
│   └── documents/
│       └── upload-document.step.ts
├── ml/
│   ├── process_prompt_step.py
│   ├── analyze_document_step.py
│   └── generate_embeddings_step.py
└── events/
    ├── process-ai-response.step.ts
    └── update-conversation.step.ts
```

### 4. Data Pipeline Backend
```typescript
// Analytics Pipeline
steps/
├── api/
│   ├── ingest/
│   │   └── receive-data.step.ts
│   └── query/
│       └── get-analytics.step.ts
├── events/
│   ├── validate-data.step.ts
│   ├── transform_data_step.py
│   └── aggregate_metrics.step.rb
├── cron/
│   └── daily-rollup.step.ts
└── export/
    └── generate_reports.step.rb
```

### 5. Microservices Backend
```typescript
// User Service
steps/user-service/
├── api/
│   ├── users/
│   │   ├── create.step.ts
│   │   ├── update.step.ts
│   │   └── delete.step.ts
│   └── profile/
│       └── get-profile.step.ts
└── events/
    ├── sync-to-auth.step.ts
    └── notify-changes.step.ts

// Order Service
steps/order-service/
├── api/
│   └── orders/
│       ├── create.step.ts
│       └── status.step.ts
└── events/
    └── process-order.step.ts
```

## Application Templates

### SaaS Application
```bash
# Core Features
- Multi-tenant architecture
- Subscription management
- User authentication & authorization
- Admin dashboard
- Billing integration
- Email notifications
- Analytics & reporting

# Implementation
1. Authentication (JWT + refresh tokens)
2. Tenant isolation (state prefixing)
3. Subscription tiers (feature flags)
4. Payment processing (Stripe integration)
5. Admin panel (role-based access)
6. Email service (SendGrid)
7. Usage tracking (analytics events)
```

### Social Media Platform
```bash
# Core Features
- User profiles & authentication
- Content creation (posts, media)
- Social graph (follow/unfollow)
- Real-time feed updates
- Notifications
- Direct messaging
- Content moderation

# Implementation
1. User system with profiles
2. Content management (CRUD + media)
3. Graph relationships (followers/following)
4. Activity feeds (timeline algorithm)
5. Real-time updates (WebSocket)
6. Chat system (1:1 and groups)
7. Moderation queue (AI + manual)
```

### IoT Backend
```bash
# Core Features
- Device registration
- Data ingestion (MQTT/HTTP)
- Real-time monitoring
- Alert system
- Data visualization
- Firmware updates
- Device commands

# Implementation
1. Device auth (certificates/tokens)
2. High-volume data ingestion
3. Time-series data storage
4. Real-time dashboards
5. Rule-based alerts
6. OTA update system
7. Command & control API
```

### Gaming Backend
```bash
# Core Features
- Player authentication
- Matchmaking
- Game state sync
- Leaderboards
- In-game purchases
- Social features
- Anti-cheat

# Implementation
1. Player profiles & auth
2. Matchmaking algorithms
3. Real-time game state
4. Score tracking & rankings
5. Virtual economy
6. Friends & guilds
7. Cheat detection
```

## Quick Start Commands

### 1. E-commerce Backend
```bash
# Create all necessary steps
motia generate ecommerce --with-auth --with-payments --with-admin
```

### 2. Real-time Chat
```bash
# Generate chat backend
motia generate chat --with-rooms --with-presence --with-history
```

### 3. AI Application
```bash
# Generate AI backend
motia generate ai --with-rag --with-embeddings --with-chat
```

### 4. SaaS Platform
```bash
# Generate SaaS backend
motia generate saas --multi-tenant --with-billing --with-admin
```

## Implementation Patterns

### Authentication Flow
```typescript
// 1. Register → 2. Verify Email → 3. Login → 4. Get Token → 5. Access Protected Routes

// Register
export const registerHandler = async (req, { emit, state }) => {
  const user = await createUser(req.body)
  await emit({ topic: 'user.registered', data: { userId: user.id, email: user.email } })
  return { status: 201, body: { userId: user.id } }
}

// Process registration
export const processRegistrationHandler = async (input, { emit, state }) => {
  await sendVerificationEmail(input.email)
  await createUserProfile(input.userId)
  await emit({ topic: 'welcome.email.send', data: input })
}
```

### Real-time Updates
```typescript
// 1. Client connects → 2. Subscribe to streams → 3. Receive updates → 4. Handle disconnection

// WebSocket connection
export const connectHandler = async (req, { streams }) => {
  const userId = req.user.id
  const stream = streams[`user-${userId}`]
  
  // Subscribe to personal updates
  stream.subscribe((data) => {
    ws.send(JSON.stringify(data))
  })
}
```

### Multi-language Processing
```typescript
// 1. API receives request → 2. Python processes ML → 3. Ruby generates report → 4. API returns result

// Trigger ML pipeline
await emit({ 
  topic: 'ml.process', 
  data: { text: req.body.text, requestId } 
})

// Python processes
async def handler(input_data, ctx):
    result = run_ml_model(input_data["text"])
    await ctx.emit({
        "topic": "ml.complete",
        "data": {"requestId": input_data["requestId"], "result": result}
    })

// Ruby generates report
def handler(input, context)
  report = generate_pdf_report(input['result'])
  context.emit(topic: 'report.ready', data: { url: report_url })
end
```

## Production Checklist

### Security
- [ ] JWT authentication implemented
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] SQL injection prevention
- [ ] XSS protection

### Performance
- [ ] Database indexes created
- [ ] Redis caching implemented
- [ ] Connection pooling enabled
- [ ] Response compression
- [ ] CDN configured

### Monitoring
- [ ] Health check endpoint
- [ ] Structured logging
- [ ] Error tracking (Sentry)
- [ ] APM configured
- [ ] Alerts set up

### Testing
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Load testing completed
- [ ] Security audit passed

## Common Architectures

### 1. Monolithic
- All steps in one project
- Shared state namespace
- Single deployment unit
- Good for: Small to medium apps

### 2. Microservices
- Steps grouped by domain
- Separate state namespaces
- Independent deployments
- Good for: Large teams, complex domains

### 3. Serverless
- Minimal steps per function
- Stateless handlers
- Event-driven only
- Good for: Variable load, cost optimization

### 4. Hybrid
- Core monolith + satellite services
- Mixed deployment strategies
- Gradual migration path
- Good for: Evolving architectures