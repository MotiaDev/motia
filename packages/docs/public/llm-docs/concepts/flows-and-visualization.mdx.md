---
title: Flows & Visualization
description: Learn how to organize steps into flows and visualize multi-language workflows in the Motia Workbench with real-time debugging and tracing.
---

# Flows & Visualization

**Flows** are logical groupings of steps that work together to accomplish specific business goals. They provide structure, visualization, and observability for your multi-language workflows - making it easy to understand, debug, and maintain complex systems.

## Why Use Flows?

### 🎯 **Organization & Clarity**
Group related steps together for better code organization and team understanding

### 👁️ **Visual Workflow Management**  
See your entire workflow in the Motia Workbench - from TypeScript APIs to Python processors to JavaScript analytics

### 🔍 **Enhanced Observability**
- **Flow-based logging** - Filter logs by specific workflows
- **Distributed tracing** - Follow requests across all steps in a flow
- **Real-time monitoring** - Watch data flow through your system live

### 🚀 **Team Collaboration**
Share visual workflow diagrams with stakeholders, making technical processes accessible to non-technical team members

## Creating Multi-Language Flows

Flows are created by tagging your steps with flow names. Each step specifies which flows it belongs to using the `flows` property in its configuration.

### Real-World E-Commerce Flow Example

Here's how to build a complete user onboarding flow using multiple languages:

<Tabs items={["TypeScript API", "Python Processor", "JavaScript Notifier"]}>
<Tab value="TypeScript API">

```typescript title="01-user-registration.step.ts"
import { z } from 'zod'

export const config = {
  type: 'api',
  name: 'user-registration',
  path: '/users/register',
  method: 'POST',
  
  // Schema validation
  bodySchema: z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(8)
  }),
  
  emits: ['user.registered'],
  flows: ['user-onboarding'] // 🎯 Flow association
}

export const handler = async (req, { emit, logger }) => {
  logger.info('New user registration', { email: req.body.email })
  
  // Create user in database
  const user = await createUser(req.body)
  
  // Trigger Python processing
  await emit({
    topic: 'user.registered',
    data: { user, timestamp: new Date() }
  })
  
  return { status: 201, body: { success: true, userId: user.id } }
}
```

</Tab>
<Tab value="Python Processor">

```python title="02-enrich-profile.step.py"
from pydantic import BaseModel

class UserRegistered(BaseModel):
    user: dict
    timestamp: str

config = {
    'type': 'event',
    'name': 'enrich-profile',
    'subscribes': ['user.registered'],
    'emits': ['profile.enriched'],
    'flows': ['user-onboarding'],  # 🎯 Same flow name
    'input_schema': UserRegistered
}

async def handler(input_data, ctx):
    """Use Python for complex data enrichment with ML libraries"""
    
    user = input_data.user
    ctx.logger.info("Enriching user profile", {"user_id": user['id']})
    
    # Python-specific processing (geolocation, ML predictions, etc.)
    enriched_profile = {
        'user_id': user['id'],
        'location_data': await get_location_from_ip(user.get('ip')),
        'risk_score': calculate_fraud_risk(user),
        'recommended_categories': get_ml_recommendations(user),
        'enriched_at': ctx.utils.dates.now().isoformat()
    }
    
    # Pass to JavaScript step
    await ctx.emit({
        'topic': 'profile.enriched',
        'data': enriched_profile
    })
    
    return enriched_profile

async def get_location_from_ip(ip):
    # IP geolocation service
    return {"country": "US", "city": "San Francisco"}

def calculate_fraud_risk(user):
    # ML model inference
    return 0.1  # Low risk

def get_ml_recommendations(user):
    # Recommendation engine
    return ["electronics", "books", "sports"]
```

</Tab>
<Tab value="JavaScript Notifier">

```javascript title="03-send-welcome.step.js"
/**
 * @typedef {Object} EnrichedProfile
 * @property {string} user_id
 * @property {Object} location_data
 * @property {number} risk_score
 * @property {string[]} recommended_categories
 */

export const config = {
  type: 'event',
  name: 'send-welcome',
  subscribes: ['profile.enriched'],
  emits: ['welcome.sent'],
  flows: ['user-onboarding'] // 🎯 Same flow completes the chain
}

/**
 * @param {EnrichedProfile} input
 */
export const handler = async (input, { emit, logger, state, traceId }) => {
  logger.info('Sending personalized welcome', { userId: input.user_id })
  
  // Get original user data from state
  const originalUser = await state.get(traceId, 'user-registration-data')
  
  // Send personalized notifications based on ML data
  const welcomeData = {
    userId: input.user_id,
    personalizedContent: {
      location: input.location_data.city,
      recommendations: input.recommended_categories,
      riskLevel: input.risk_score < 0.5 ? 'low' : 'high'
    }
  }
  
  // Send multi-channel welcome (email, SMS, push)
  await Promise.all([
    sendWelcomeEmail(originalUser.email, welcomeData),
    sendWelcomeSMS(originalUser.phone, welcomeData),
    sendPushNotification(input.user_id, welcomeData)
  ])
  
  await emit({
    topic: 'welcome.sent',
    data: { userId: input.user_id, channels: 3, sentAt: new Date() }
  })
  
  logger.info('User onboarding complete', { userId: input.user_id })
}
```

</Tab>
</Tabs>

### Flow Best Practices

<Callout type="default">
**📋 Flow Naming Guidelines**

- **Descriptive**: Use clear business process names (`user-onboarding`, `payment-processing`, `order-fulfillment`)
- **Kebab-case**: Use hyphens for readability (`data-pipeline` not `dataPipeline`)
- **Specific**: Keep flows focused on single business processes
- **Multi-flow**: Steps can belong to multiple flows: `flows: ['billing', 'analytics', 'compliance']`
</Callout>

## Visualizing Flows in Motia Workbench

The **Motia Workbench** is your command center for developing, debugging, and monitoring multi-language workflows in real-time.

### Getting Started with Workbench

<Steps>
<Step>
**Start Development Mode**

```bash
# In your Motia project directory
npx motia dev
```

This starts the Motia runtime and opens the Workbench at `http://localhost:3000`

</Step>
<Step>
**Explore Your Flows**

![Motia Workbench Interface](./../img/motia-build-your-app.gif)

- **Left Sidebar**: Browse all your flows and steps
- **Main Canvas**: Interactive visual workflow diagram  
- **Bottom Panel**: Real-time logs and traces
- **Right Panel**: Step configuration and details

</Step>
<Step>
**Interactive Flow Visualization**

Click on your flow name in the sidebar to see:
- **Visual nodes** for each step (colored by language)
- **Event connections** showing data flow between steps
- **Real-time status** indicators during execution

</Step>
<Step>
**Debug and Monitor**

- **Click nodes** to inspect step configurations
- **Watch traces** in the bottom panel as requests flow through
- **Filter logs** by flow, step, or trace ID
- **Move nodes** to organize your visual layout

</Step>
</Steps>

### Workbench Features for Multi-Language Workflows

#### 🎨 **Language-Coded Visualization**
Steps are visually distinguished by language:
- **Blue nodes** = TypeScript/JavaScript steps
- **Green nodes** = Python steps  
- **Custom colors** for other languages

#### ⚡ **Real-Time Flow Execution**
Watch your data flow live across languages:
1. API request hits TypeScript step (blue highlight)
2. Data flows to Python step (green highlight)  
3. Results trigger JavaScript step (blue highlight)
4. Complete trace appears in logs panel

#### 🔍 **Multi-Language Debugging**
- **Unified logging** - All step logs in one place
- **Cross-language tracing** - Follow requests across runtimes
- **Error highlighting** - Instantly spot failing steps
- **State inspection** - View shared data between steps

#### 📊 **Performance Monitoring**
- **Execution timing** - See how long each step takes
- **Bottleneck identification** - Spot slow steps in your flow
- **Resource usage** - Monitor memory and CPU per language runtime

### Advanced Workbench Usage

#### Flow Layout Management

The Workbench automatically saves your node positions in `motia-workbench.json`:

```json title="motia-workbench.json (Auto-managed)"
[
  {
    "id": "user-onboarding",
    "config": {
      "steps/01-user-registration.step.ts": {
        "x": -200, "y": 100,
        "sourceHandlePosition": "right"
      },
      "steps/02-enrich-profile.step.py": {
        "x": 100, "y": 100,
        "targetHandlePosition": "left"
      },
      "steps/03-send-welcome.step.js": {
        "x": 400, "y": 100,
        "targetHandlePosition": "left"
      }
    }
  }
]
```

#### Team Collaboration

- **Commit workbench configs** to version control
- **Shared layouts** - Team sees the same visual organization
- **Flow documentation** - Visual diagrams serve as living documentation

<Callout type="default">
**🚀 Pro Tips for Effective Flow Visualization**

- **Group related flows** - Use consistent naming patterns
- **Organize canvas layout** - Arrange nodes logically (left-to-right for data flow)
- **Use descriptive step names** - Makes flows self-documenting
- **Color-code by domain** - Group similar business logic visually
- **Test flows interactively** - Use the Workbench to trigger and debug flows
</Callout>

## Real-Time Development Workflow

The Workbench supports hot-reload development across all languages:

1. **Edit TypeScript step** → Instant reload in browser
2. **Modify Python handler** → Automatic restart and reconnection  
3. **Update JavaScript logic** → Live updates without losing state
4. **Change flow configuration** → Visual diagram updates immediately

This enables a seamless multi-language development experience where you can:
- ✅ **Write each component in the optimal language**
- ✅ **See immediate results across the entire workflow**
- ✅ **Debug issues with full context across languages**
- ✅ **Monitor performance in real-time**

**➡️ [Learn More about Workbench Features](/docs/workbench/overview)**

---

**Ready to build your first REST API?** Check out **[API Endpoints](/docs/getting-started/build-your-first-app/creating-your-first-rest-api)** for a complete hands-on tutorial!
