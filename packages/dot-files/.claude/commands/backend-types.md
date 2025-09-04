# Backend Types & Architectures

Build any type of backend with Motia using the right language for each component.

## SaaS Application

### Architecture Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   TypeScript    │     │     Python      │     │      Ruby       │
│   REST APIs     │────▶│   ML/Analytics  │────▶│    Reporting    │
│   Auth & RBAC   │     │   Predictions   │     │    Invoicing    │
│   Subscriptions │     │   Recommendations│     │    PDF Export   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Implementation

#### 1. Multi-tenant API (TypeScript)
```typescript
// steps/api/saas/tenant-context.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'TenantAPI',
  method: 'GET',
  path: '/api/:tenantId/*',
  middleware: [authMiddleware, tenantMiddleware],
}

export const handler = async (req, { state }) => {
  const { tenantId } = req.pathParams
  const tenant = req.tenant // Added by middleware
  
  // All state operations are automatically scoped to tenant
  const data = await state.get(`tenant:${tenantId}:data`, req.pathParams[0])
  return { status: 200, body: data }
}
```

#### 2. Usage Analytics (Python)
```python
# steps/analytics/track_usage_step.py
import pandas as pd
from datetime import datetime, timedelta

config = {
    "type": "event",
    "name": "TrackUsage",
    "subscribes": ["api.request.completed"],
    "emits": ["usage.threshold.exceeded", "usage.report.generate"]
}

async def handler(input_data, ctx):
    tenant_id = input_data["tenantId"]
    endpoint = input_data["endpoint"]
    
    # Track API usage
    usage_key = f"usage:{tenant_id}:{datetime.now().strftime('%Y-%m-%d')}"
    current_usage = await ctx.state.get("analytics", usage_key) or {}
    
    current_usage[endpoint] = current_usage.get(endpoint, 0) + 1
    current_usage["total"] = current_usage.get("total", 0) + 1
    
    await ctx.state.set("analytics", usage_key, current_usage, 86400)
    
    # Check plan limits
    tenant = await ctx.state.get("tenants", tenant_id)
    plan_limits = get_plan_limits(tenant["plan"])
    
    if current_usage["total"] > plan_limits["daily_api_calls"]:
        await ctx.emit({
            "topic": "usage.threshold.exceeded",
            "data": {
                "tenantId": tenant_id,
                "usage": current_usage["total"],
                "limit": plan_limits["daily_api_calls"]
            }
        })
```

#### 3. Invoice Generation (Ruby)
```ruby
# steps/billing/generate_invoice.step.rb
require 'prawn'
require 'money'

def config
  {
    type: 'event',
    name: 'GenerateInvoice',
    subscribes: ['billing.invoice.create'],
    emits: ['invoice.created', 'email.send']
  }
end

def handler(input, context)
  tenant_id = input['tenantId']
  billing_period = input['billingPeriod']
  
  # Get tenant and usage data
  tenant = context.state.get('tenants', tenant_id)
  usage = calculate_usage(tenant_id, billing_period, context)
  
  # Calculate charges
  charges = calculate_charges(tenant['plan'], usage)
  
  # Generate invoice PDF
  invoice_path = generate_invoice_pdf(tenant, charges, billing_period)
  
  # Store invoice
  invoice_url = upload_to_storage(invoice_path, context)
  
  context.emit(
    topic: 'invoice.created',
    data: {
      tenantId: tenant_id,
      invoiceUrl: invoice_url,
      amount: charges[:total]
    }
  )
end
```

---

## E-commerce Platform

### Architecture Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   JavaScript    │     │   TypeScript    │     │     Python      │
│  Storefront API │────▶│  Order Process  │────▶│  Recommendation │
│  Shopping Cart  │     │  Payment Gateway│     │  Image Analysis │
│  Quick Checkout │     │  Inventory Mgmt │     │  Fraud Detection│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Implementation

#### 1. Shopping Cart (JavaScript)
```javascript
// steps/api/cart/add-to-cart.step.js
exports.config = {
  type: 'api',
  name: 'AddToCart',
  method: 'POST',
  path: '/cart/add',
  bodySchema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      quantity: { type: 'integer', minimum: 1 },
      options: { type: 'object' }
    }
  },
  emits: ['cart.updated', 'analytics.track']
}

exports.handler = async (req, { state, emit }) => {
  const sessionId = req.cookies.sessionId || crypto.randomUUID()
  const { productId, quantity, options } = req.body
  
  // Get product
  const product = await state.get('products', productId)
  if (!product || !product.inStock) {
    return { status: 400, body: { error: 'Product unavailable' } }
  }
  
  // Get or create cart
  const cartKey = `cart:${sessionId}`
  const cart = await state.get('carts', cartKey) || {
    items: [],
    createdAt: new Date().toISOString()
  }
  
  // Add/update item
  const existingItem = cart.items.find(i => i.productId === productId)
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.items.push({
      productId,
      quantity,
      options,
      price: product.price,
      addedAt: new Date().toISOString()
    })
  }
  
  // Calculate totals
  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Save cart (30 day TTL)
  await state.set('carts', cartKey, cart, 2592000)
  
  // Emit events
  await emit({
    topic: 'cart.updated',
    data: { sessionId, cart, action: 'add', productId }
  })
  
  return {
    status: 200,
    headers: { 'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly` },
    body: cart
  }
}
```

#### 2. Order Processing (TypeScript)
```typescript
// steps/events/process-order.step.ts
export const config: EventConfig = {
  type: 'event',
  name: 'ProcessOrder',
  subscribes: ['order.placed'],
  emits: [
    'inventory.reserve',
    'payment.charge',
    'fraud.check',
    'order.confirmed',
    'order.failed'
  ]
}

export const handler = async (input, { emit, state, logger }) => {
  const { orderId } = input
  
  try {
    const order = await state.get('orders', orderId)
    
    // Step 1: Reserve inventory
    const reservationId = await reserveInventory(order.items, state)
    if (!reservationId) {
      throw new Error('Insufficient inventory')
    }
    
    // Step 2: Fraud check (async)
    await emit({
      topic: 'fraud.check',
      data: { orderId, customerId: order.customerId, amount: order.total }
    })
    
    // Step 3: Process payment
    const paymentResult = await processPayment(order)
    if (!paymentResult.success) {
      await releaseInventory(reservationId, state)
      throw new Error('Payment failed')
    }
    
    // Update order
    order.status = 'confirmed'
    order.paymentId = paymentResult.transactionId
    order.reservationId = reservationId
    await state.set('orders', orderId, order)
    
    await emit({
      topic: 'order.confirmed',
      data: { orderId, customerId: order.customerId }
    })
    
  } catch (error) {
    await emit({
      topic: 'order.failed',
      data: { orderId, error: error.message }
    })
  }
}
```

#### 3. Product Recommendations (Python)
```python
# steps/ml/recommend_products_step.py
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

config = {
    "type": "event",
    "name": "RecommendProducts",
    "subscribes": ["user.viewed.product", "user.purchased.product"],
    "emits": ["recommendations.updated"]
}

async def handler(input_data, ctx):
    user_id = input_data["userId"]
    product_id = input_data["productId"]
    action = input_data["action"]  # 'view' or 'purchase'
    
    # Update user-product interaction matrix
    interactions = await ctx.state.get("ml_data", "interactions") or {}
    
    if user_id not in interactions:
        interactions[user_id] = {}
    
    # Weight purchases more than views
    weight = 3.0 if action == 'purchase' else 1.0
    interactions[user_id][product_id] = interactions[user_id].get(product_id, 0) + weight
    
    await ctx.state.set("ml_data", "interactions", interactions)
    
    # Generate recommendations
    if len(interactions[user_id]) >= 3:  # Minimum interactions
        recommendations = generate_recommendations(user_id, interactions)
        
        await ctx.state.set("recommendations", user_id, {
            "products": recommendations,
            "updatedAt": datetime.now().isoformat()
        })
        
        await ctx.emit({
            "topic": "recommendations.updated",
            "data": {
                "userId": user_id,
                "recommendations": recommendations[:10]
            }
        })

def generate_recommendations(user_id, all_interactions):
    # Create user-item matrix
    users = list(all_interactions.keys())
    products = list(set(p for user in all_interactions.values() for p in user.keys()))
    
    matrix = np.zeros((len(users), len(products)))
    for i, user in enumerate(users):
        for j, product in enumerate(products):
            matrix[i, j] = all_interactions[user].get(product, 0)
    
    # Calculate similarity
    user_idx = users.index(user_id)
    user_similarities = cosine_similarity([matrix[user_idx]], matrix)[0]
    
    # Find similar users
    similar_users = np.argsort(user_similarities)[-6:-1]  # Top 5 similar users
    
    # Get recommendations
    recommendations = {}
    for idx in similar_users:
        similar_user = users[idx]
        for product, score in all_interactions[similar_user].items():
            if product not in all_interactions[user_id]:
                recommendations[product] = recommendations.get(product, 0) + score * user_similarities[idx]
    
    # Sort by score
    sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
    return [{"productId": p[0], "score": p[1]} for p in sorted_recs]
```

---

## Real-time Gaming Backend

### Architecture Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   TypeScript    │     │   JavaScript    │     │     Python      │
│  Matchmaking    │────▶│  Game Sessions  │────▶│  Anti-cheat     │
│  Leaderboards   │     │  Real-time Sync │     │  ML Detection   │
│  Player Auth    │     │  Chat System    │     │  Behavior Analysis│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Implementation Examples

#### 1. Matchmaking System (TypeScript)
```typescript
// steps/api/matchmaking/find-match.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'FindMatch',
  method: 'POST',
  path: '/matchmaking/find',
  middleware: [authMiddleware],
  bodySchema: z.object({
    gameMode: z.enum(['1v1', '2v2', 'battle-royale']),
    region: z.string()
  }),
  emits: ['matchmaking.searching', 'match.found']
}

export const handler = async (req, { emit, state, streams }) => {
  const playerId = req.user.userId
  const { gameMode, region } = req.body
  
  // Get player stats for skill-based matching
  const playerStats = await state.get('player_stats', playerId)
  const skillRating = playerStats?.rating || 1000
  
  // Create match request
  const requestId = crypto.randomUUID()
  const matchRequest = {
    id: requestId,
    playerId,
    gameMode,
    region,
    skillRating,
    searchRange: 100, // Initial skill range
    createdAt: Date.now()
  }
  
  // Add to matchmaking queue
  await state.set('matchmaking_queue', requestId, matchRequest, 300) // 5 min TTL
  
  // Subscribe to match updates
  const playerStream = streams[`player:${playerId}`]
  
  // Start matching process
  await emit({
    topic: 'matchmaking.searching',
    data: matchRequest
  })
  
  return {
    status: 202,
    body: {
      requestId,
      message: 'Searching for match...',
      estimatedTime: calculateEstimatedTime(gameMode, region)
    }
  }
}
```

#### 2. Real-time Game Session (JavaScript)
```javascript
// steps/websocket/game-session.step.js
exports.config = {
  type: 'api',
  name: 'GameSession',
  method: 'GET',
  path: '/game/:sessionId/ws',
  middleware: ['authMiddleware'],
  websocket: true
}

exports.handler = async (req, { state, streams }) => {
  const { sessionId } = req.pathParams
  const playerId = req.user.userId
  const ws = req.ws
  
  // Verify player belongs to session
  const session = await state.get('game_sessions', sessionId)
  if (!session || !session.players.includes(playerId)) {
    ws.close(1008, 'Unauthorized')
    return
  }
  
  // Join game session
  const playerKey = `${sessionId}:${playerId}`
  await state.set('active_players', playerKey, {
    sessionId,
    playerId,
    connectedAt: Date.now(),
    lastInput: Date.now()
  })
  
  // Game state streaming
  const gameStream = streams[`game:${sessionId}`]
  
  // Subscribe to game updates
  const unsubscribe = gameStream.subscribe((update) => {
    // Filter updates based on visibility rules
    const filteredUpdate = filterVisibleState(update, playerId, session)
    ws.send(JSON.stringify({
      type: 'gameUpdate',
      data: filteredUpdate,
      timestamp: Date.now()
    }))
  })
  
  // Handle player inputs
  ws.on('message', async (message) => {
    try {
      const input = JSON.parse(message)
      
      // Validate input
      if (!validateInput(input, session.gameMode)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid input' }))
        return
      }
      
      // Apply to game state
      await processGameInput(sessionId, playerId, input, { state, streams })
      
      // Track for anti-cheat
      await state.set('player_inputs', `${sessionId}:${playerId}:${Date.now()}`, {
        input,
        timestamp: Date.now()
      }, 3600) // 1 hour TTL
      
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Processing failed' }))
    }
  })
  
  // Cleanup on disconnect
  ws.on('close', async () => {
    unsubscribe()
    await state.delete('active_players', playerKey)
    await handlePlayerDisconnect(sessionId, playerId, { state, emit })
  })
}

async function processGameInput(sessionId, playerId, input, ctx) {
  const { state, streams } = ctx
  
  // Get current game state
  const gameState = await state.get('game_states', sessionId)
  
  // Apply game logic
  const newState = applyGameLogic(gameState, playerId, input)
  
  // Check for game-ending conditions
  if (checkWinCondition(newState)) {
    newState.status = 'completed'
    newState.winner = determineWinner(newState)
  }
  
  // Save new state
  await state.set('game_states', sessionId, newState)
  
  // Broadcast update
  const gameStream = streams[`game:${sessionId}`]
  await gameStream.set('state', 'current', newState)
}
```

#### 3. Anti-cheat System (Python)
```python
# steps/ml/detect_cheating_step.py
import numpy as np
from sklearn.ensemble import IsolationForest
from collections import defaultdict
import math

config = {
    "type": "event",
    "name": "DetectCheating",
    "subscribes": ["player.input.recorded"],
    "emits": ["cheat.detected", "player.flagged"]
}

# Pre-trained models for different game modes
models = {}

async def handler(input_data, ctx):
    session_id = input_data["sessionId"]
    player_id = input_data["playerId"]
    
    # Get recent player inputs
    input_pattern = f"{session_id}:{player_id}:*"
    recent_inputs = await ctx.state.get_pattern("player_inputs", input_pattern)
    
    if len(recent_inputs) < 10:  # Need minimum data
        return
    
    # Extract features
    features = extract_behavioral_features(recent_inputs)
    
    # Check multiple detection methods
    detections = {
        "speed_hack": detect_speed_hack(features),
        "aim_bot": detect_aim_bot(features),
        "wall_hack": detect_wall_hack(features, ctx),
        "macro": detect_macro_usage(features),
        "anomaly": detect_anomalous_behavior(features, player_id)
    }
    
    # Calculate confidence score
    confidence = calculate_cheat_confidence(detections)
    
    if confidence > 0.8:  # High confidence
        await ctx.emit({
            "topic": "cheat.detected",
            "data": {
                "playerId": player_id,
                "sessionId": session_id,
                "detectionTypes": [k for k, v in detections.items() if v["detected"]],
                "confidence": confidence,
                "evidence": compile_evidence(detections)
            }
        })
    elif confidence > 0.5:  # Suspicious
        await ctx.emit({
            "topic": "player.flagged",
            "data": {
                "playerId": player_id,
                "reason": "suspicious_behavior",
                "confidence": confidence
            }
        })

def extract_behavioral_features(inputs):
    features = {
        "action_frequency": [],
        "reaction_times": [],
        "movement_patterns": [],
        "accuracy_scores": [],
        "input_intervals": []
    }
    
    sorted_inputs = sorted(inputs, key=lambda x: x["timestamp"])
    
    for i in range(1, len(sorted_inputs)):
        prev = sorted_inputs[i-1]
        curr = sorted_inputs[i]
        
        # Time between actions
        interval = curr["timestamp"] - prev["timestamp"]
        features["input_intervals"].append(interval)
        
        # Reaction time for specific events
        if curr["input"].get("type") == "reaction":
            features["reaction_times"].append(curr["input"]["reactionTime"])
        
        # Movement analysis
        if "position" in curr["input"]:
            features["movement_patterns"].append({
                "speed": calculate_speed(prev["input"], curr["input"], interval),
                "direction_change": calculate_direction_change(prev["input"], curr["input"]),
                "acceleration": calculate_acceleration(prev["input"], curr["input"], interval)
            })
    
    return features

def detect_aim_bot(features):
    if not features["accuracy_scores"]:
        return {"detected": False}
    
    accuracy = np.mean(features["accuracy_scores"])
    consistency = np.std(features["accuracy_scores"])
    
    # Inhuman accuracy patterns
    if accuracy > 0.95 and consistency < 0.02:
        return {
            "detected": True,
            "confidence": 0.9,
            "reason": "Superhuman accuracy with low variance"
        }
    
    # Check for snap-to-target patterns
    movement_patterns = features["movement_patterns"]
    snap_count = sum(1 for m in movement_patterns if m.get("direction_change", 0) > 170)
    
    if snap_count / len(movement_patterns) > 0.3:
        return {
            "detected": True,
            "confidence": 0.8,
            "reason": "Frequent instant direction changes"
        }
    
    return {"detected": False}

def detect_anomalous_behavior(features, player_id):
    # Use Isolation Forest for anomaly detection
    feature_vector = []
    
    # Aggregate features into vector
    if features["reaction_times"]:
        feature_vector.extend([
            np.mean(features["reaction_times"]),
            np.std(features["reaction_times"]),
            np.min(features["reaction_times"])
        ])
    
    if features["input_intervals"]:
        feature_vector.extend([
            np.mean(features["input_intervals"]),
            np.std(features["input_intervals"]),
            len([i for i in features["input_intervals"] if i < 50]) / len(features["input_intervals"])
        ])
    
    if len(feature_vector) < 6:
        return {"detected": False}
    
    # Get or create model for player's skill bracket
    model_key = f"anomaly_model_{get_skill_bracket(player_id)}"
    if model_key not in models:
        models[model_key] = IsolationForest(contamination=0.1, random_state=42)
    
    model = models[model_key]
    
    # Predict anomaly
    try:
        anomaly_score = model.decision_function([feature_vector])[0]
        is_anomaly = model.predict([feature_vector])[0] == -1
        
        if is_anomaly:
            return {
                "detected": True,
                "confidence": abs(anomaly_score),
                "reason": "Behavioral pattern significantly differs from peers"
            }
    except:
        # Model needs more training data
        pass
    
    return {"detected": False}
```

---

## IoT Platform

### Mixed Language Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   JavaScript    │     │     Python      │     │      Ruby       │
│  Device Gateway │────▶│  Data Analytics │────▶│  Alert Engine   │
│  MQTT Handler   │     │  Anomaly Detect │     │  Notifications  │
│  HTTP Ingestion │     │  ML Predictions │     │  Report Generate│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

This architecture leverages:
- **JavaScript**: Fast, event-driven data ingestion
- **Python**: Complex analytics and machine learning
- **Ruby**: Business logic and report generation