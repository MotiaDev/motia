# Motia Framework Development Assistant

You are helping develop a **Motia project** - a unified backend framework that uses event-driven architecture with multiple programming languages.

## Core Motia Concepts

### Steps Architecture

- **Steps** are the fundamental building blocks - each has `config` and `handler`
- **API Steps**: HTTP endpoints (`type: 'api'`)
- **Event Steps**: Event processors (`type: 'event'`)
- **Cron Steps**: Scheduled tasks (`type: 'cron'`)
- **Stream Steps**: Real-time data (`type: 'stream'`)
- **NOOP Steps**: Workflow routing (`type: 'noop'`)

### Event-Driven Communication

- Steps communicate via `emit({ topic: 'event-name', data: {...} })`
- Subscribe to events: `subscribes: ['topic-name']` in config
- Creates loose coupling and parallel execution

### State Management

- Persistent state via `state.set(group, key, value)` and `state.get(group, key)`
- State is scoped by groups ('orders', 'users', etc.) and keys
- Supports trace-scoped and global persistence

## File Structure

```
steps/              # All step implementations
├── *.step.ts      # Step files (config + handler)
├── *-features.json # Tutorial/workbench metadata
services/          # Shared business logic
types.d.ts         # Auto-generated types from step configs
motia-workbench.json # Visual flow configuration
```

## Step Implementation Patterns

Motia supports **multiple programming languages** in the same project. Choose the best language for each task:

- **TypeScript/JavaScript**: APIs, web logic, real-time features
- **Python**: AI/ML, data science, image processing, analytics
- **Ruby**: Reports, data exports, file processing, templating

### TypeScript API Step

```typescript
import { z } from 'zod'
import type { ApiRouteConfig, Handlers } from '@motia/core'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateOrder',
  method: 'POST',
  path: '/orders',
  bodySchema: z.object({
    productId: z.string(),
    quantity: z.number(),
  }),
  emits: ['order.created'],
  flows: ['ecommerce'],
}

export const handler: Handlers['CreateOrder'] = async (req, { logger, emit, state, traceId }) => {
  const order = { id: crypto.randomUUID(), ...req.body, createdAt: new Date() }
  await state.set('orders', order.id, order)
  await emit({ topic: 'order.created', data: order })
  return { status: 201, body: order }
}
```

### JavaScript Event Step

```javascript
// steps/process-payment.step.js
exports.config = {
  type: 'event',
  name: 'ProcessPayment',
  subscribes: ['order.created'],
  emits: ['payment.processed', 'payment.failed'],
  input: {
    id: 'string',
    amount: 'number',
    currency: 'string',
  },
}

exports.handler = async (order, { logger, emit, state }) => {
  try {
    logger.info('Processing payment', { orderId: order.id })

    // Simulate payment processing
    const paymentResult = await processPayment(order)

    await state.set('payments', order.id, paymentResult)
    await emit({
      topic: 'payment.processed',
      data: { orderId: order.id, paymentId: paymentResult.id },
    })
  } catch (error) {
    logger.error('Payment failed', { orderId: order.id, error: error.message })
    await emit({ topic: 'payment.failed', data: { orderId: order.id, error: error.message } })
  }
}
```

### Python AI/ML Event Step

```python
# steps/analyze_sentiment.step.py
import asyncio
from transformers import pipeline

config = {
    "type": "event",
    "name": "AnalyzeSentiment",
    "subscribes": ["review.submitted"],
    "emits": ["sentiment.analyzed"],
    "input": {
        "reviewId": "string",
        "text": "string",
        "userId": "string"
    }
}

# Initialize ML model
sentiment_analyzer = pipeline("sentiment-analysis")

async def handler(review_data, context):
    logger = context["logger"]
    emit = context["emit"]
    state = context["state"]

    try:
        logger.info(f"Analyzing sentiment for review {review_data['reviewId']}")

        # Run sentiment analysis
        result = sentiment_analyzer(review_data["text"])
        sentiment_score = result[0]["score"]
        sentiment_label = result[0]["label"]

        analysis = {
            "reviewId": review_data["reviewId"],
            "sentiment": sentiment_label,
            "confidence": sentiment_score,
            "analyzedAt": datetime.now().isoformat()
        }

        await state.set("sentiment_analyses", review_data["reviewId"], analysis)
        await emit({
            "topic": "sentiment.analyzed",
            "data": analysis
        })

    except Exception as error:
        logger.error(f"Sentiment analysis failed: {str(error)}")
        await emit({
            "topic": "analysis.failed",
            "data": {"reviewId": review_data["reviewId"], "error": str(error)}
        })
```

### Python Data Processing Step

```python
# steps/generate_analytics.step.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

config = {
    "type": "cron",
    "name": "GenerateAnalytics",
    "cron": "0 0 * * 1",  # Weekly on Monday
    "emits": ["analytics.generated"]
}

async def handler(context):
    logger = context["logger"]
    emit = context["emit"]
    state = context["state"]

    try:
        # Fetch all orders from state
        orders_data = await state.get_group("orders")

        if not orders_data:
            logger.info("No orders data available")
            return

        # Convert to pandas DataFrame for analysis
        df = pd.DataFrame(list(orders_data.values()))
        df['createdAt'] = pd.to_datetime(df['createdAt'])

        # Generate analytics
        last_week = datetime.now() - timedelta(days=7)
        recent_orders = df[df['createdAt'] >= last_week]

        analytics = {
            "totalOrders": len(df),
            "weeklyOrders": len(recent_orders),
            "averageOrderValue": float(df['amount'].mean()) if 'amount' in df else 0,
            "topProducts": df['productId'].value_counts().head(5).to_dict(),
            "generatedAt": datetime.now().isoformat()
        }

        await state.set("analytics", "weekly", analytics)
        await emit({"topic": "analytics.generated", "data": analytics})

        logger.info("Analytics generated successfully")

    except Exception as error:
        logger.error(f"Analytics generation failed: {str(error)}")
```

### Ruby Report Generation Step

```ruby
# steps/generate_report.step.rb
require 'csv'
require 'json'

def config
  {
    type: 'event',
    name: 'GenerateReport',
    subscribes: ['analytics.generated'],
    emits: ['report.generated'],
    input: {
      totalOrders: 'number',
      weeklyOrders: 'number',
      topProducts: 'object'
    }
  }
end

def handler(analytics_data, context)
  logger = context[:logger]
  emit = context[:emit]
  state = context[:state]

  begin
    logger.info("Generating CSV report from analytics")

    # Generate CSV report
    csv_data = CSV.generate do |csv|
      csv << ['Metric', 'Value']
      csv << ['Total Orders', analytics_data['totalOrders']]
      csv << ['Weekly Orders', analytics_data['weeklyOrders']]
      csv << ['Average Order Value', analytics_data['averageOrderValue']]

      # Add top products
      analytics_data['topProducts'].each do |product, count|
        csv << ["Product #{product}", count]
      end
    end

    # Generate HTML report
    html_report = generate_html_template(analytics_data)

    report = {
      id: SecureRandom.uuid,
      csv_data: csv_data,
      html_report: html_report,
      generated_at: Time.now.iso8601
    }

    state.set('reports', report[:id], report)
    emit.call(topic: 'report.generated', data: report)

    logger.info("Report generated successfully", report_id: report[:id])

  rescue => error
    logger.error("Report generation failed", error: error.message)
    emit.call(topic: 'report.failed', data: { error: error.message })
  end
end

private

def generate_html_template(data)
  <<~HTML
    <html>
    <head><title>Analytics Report</title></head>
    <body>
      <h1>Weekly Analytics Report</h1>
      <p>Total Orders: #{data['totalOrders']}</p>
      <p>Weekly Orders: #{data['weeklyOrders']}</p>
      <p>Generated: #{Time.now.strftime('%Y-%m-%d %H:%M:%S')}</p>
    </body>
    </html>
  HTML
end
```

## Development Commands

```bash
# Start development server with workbench UI
npm run dev

# Run specific step
motia run step-name

# Build for production
motia build
```

## Code Standards

### Multi-Language File Naming

- **TypeScript**: `step-name.step.ts`
- **JavaScript**: `step-name.step.js`
- **Python**: `step_name.step.py`
- **Ruby**: `step-name.step.rb`

### Language-Specific Patterns

#### TypeScript/JavaScript

- Use Zod schemas for validation (TypeScript) or simple objects (JavaScript)
- Leverage auto-generated types from `types.d.ts` (TypeScript only)
- Use `async/await` for all async operations
- Export `config` and `handler` using ES6 modules (TypeScript) or CommonJS (JavaScript)

#### Python

- Use dictionary for config with snake_case keys
- Use `async def handler()` for async operations
- Access context via dictionary: `context["logger"]`, `context["emit"]`
- Use type hints where helpful for clarity
- Follow PEP 8 naming conventions

#### Ruby

- Use method `config` returning a hash
- Use method `handler(input, context)`
- Access context via hash: `context[:logger]`, `context[:emit]`
- Follow Ruby naming conventions (snake_case)
- Use proper exception handling with `rescue`

### Universal Naming Conventions

- Step names: `CamelCase` across all languages
- Topics: `category.action` (e.g., `order.created`, `user.updated`)
- State groups: `plural-noun` (e.g., `orders`, `users`)
- File names follow language conventions but descriptive

### Error Handling by Language

#### TypeScript/JavaScript

```typescript
try {
  // Step logic
} catch (error) {
  logger.error('Operation failed', { error: error.message, traceId })
  // For API steps: return error response
  // For Event steps: emit error event or rethrow
}
```

#### Python

```python
try:
    # Step logic
    pass
except Exception as error:
    logger.error(f"Operation failed: {str(error)}")
    # Emit error event or re-raise
    await emit({"topic": "error.occurred", "data": {"error": str(error)}})
```

#### Ruby

```ruby
begin
  # Step logic
rescue => error
  logger.error("Operation failed", error: error.message)
  # Emit error event or re-raise
  emit.call(topic: 'error.occurred', data: { error: error.message })
end
```

### State Management Best Practices

- Use semantic group names for state organization
- Store complex objects, not just primitives
- Consider trace-scoped vs global state based on use case
- Clean up unused state in cron jobs

## Testing & Debugging

### Workbench Features

- Visual flow representation and editing
- API endpoint testing with real data
- Real-time logging and tracing
- State inspection and management
- Tutorial system integration

### Logging

```typescript
logger.info('Processing started', { userId, traceId })
logger.error('Validation failed', { errors, input, traceId })
```

## Project-Specific Context

This project implements a **pet store ordering system** with:

- API endpoint for pet creation and food orders
- Event processing for order fulfillment
- Notification system for order updates
- Scheduled auditing for overdue orders

When working on this codebase:

- Follow the existing event flow patterns
- Use the established state groups (`orders`, `pets`)
- Maintain the tutorial-friendly structure for the workbench
- Test changes using the development workbench UI

## Multi-Language Workflow Examples

### Complete E-commerce Flow

```
TypeScript API → JavaScript Payment → Python ML → Ruby Reports
```

1. **API Endpoint** (TypeScript): Handle orders with validation
2. **Payment Processing** (JavaScript): Fast payment logic
3. **Recommendation Engine** (Python): ML-based product recommendations
4. **Report Generation** (Ruby): Beautiful HTML/PDF reports

### AI-Powered Content Pipeline

```
JavaScript API → Python AI → Ruby Templates → TypeScript Notifications
```

1. **Content Upload** (JavaScript): Quick file handling
2. **AI Processing** (Python): Image recognition, text analysis
3. **Template Generation** (Ruby): Dynamic content templates
4. **Real-time Updates** (TypeScript): WebSocket notifications

## Common Tasks

- **Adding API endpoints**: Create API step in TypeScript/JavaScript with validation
- **Processing background jobs**: Create event steps in the most suitable language
- **AI/ML tasks**: Use Python steps with appropriate libraries
- **Data processing**: Use Python for analytics, Ruby for reports
- **Scheduled maintenance**: Use cron steps for periodic cleanup and auditing
- **Real-time features**: Use TypeScript/JavaScript for WebSocket handling

## Resources

- Local development: `npm run dev` → http://localhost:5173
- Motia documentation: https://motia.dev/docs
- Workbench tutorials: Available in development mode
