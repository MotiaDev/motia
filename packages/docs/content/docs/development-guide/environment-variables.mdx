---
title: Environment Variables
description: Store API keys and configuration safely using .env files in your Motia apps.
---

# Environment Variables

Environment variables let you store API keys, database URLs, and other configuration outside your code. This keeps sensitive information secure and makes it easy to use different settings for development and production.

## Quick Setup

### 1. Create a `.env` File

Create a `.env` file in your project root:

```bash title=".env"
# API Keys
OPENAI_API_KEY=sk-your-api-key-here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook

# Database  
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# App Settings
NODE_ENV=development
PORT=3000
```

### 2. Add to `.gitignore`

Make sure you never commit your `.env` file:

```bash title=".gitignore"
.env
.env.local
```

### 3. Create Template for Your Team

```bash title=".env.example"
# Copy this to .env and add your actual values
OPENAI_API_KEY=your-api-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
```

## Motia Configuration Variables

Motia uses environment variables for framework configuration. These control how Motia behaves and discovers your steps.

### `MOTIA_STEP_DIRS`

Configure custom directories for step discovery.

**Type:** String (comma-separated paths)

**Default:** `steps`

**Description:** Specifies which directories Motia should search for step files. By default, Motia looks in the `steps/` directory, but you can configure any directory structure that fits your project.

**Single directory example:**

```bash title=".env"
MOTIA_STEP_DIRS=src
```

**Multiple directories example:**

```bash title=".env"
MOTIA_STEP_DIRS=api-steps,worker-steps,cron-steps
```

**In `package.json` scripts:**

```json title="package.json"
{
  "scripts": {
    "dev": "MOTIA_STEP_DIRS=src npx motia dev",
    "dev:multi": "MOTIA_STEP_DIRS=api,workers npx motia dev"
  }
}
```

<Callout type="info">
**CLI Override:** You can override `MOTIA_STEP_DIRS` using the `--step-dirs` CLI option:

```bash
npx motia dev --step-dirs "api-steps,worker-steps"
```

The CLI option takes precedence over the environment variable.
</Callout>

**Common use cases:**
- **Monorepo projects:** `MOTIA_STEP_DIRS=packages/api/steps,packages/workers/steps`
- **Team separation:** `MOTIA_STEP_DIRS=team-auth-steps,team-payments-steps`
- **Layer separation:** `MOTIA_STEP_DIRS=src/api-steps,src/background-steps`

Learn more in the [Project Structure documentation](/docs/project-structure#configuring-step-directories).

## Using Environment Variables in Steps

### TypeScript/JavaScript

```typescript title="my-step.step.ts"
export const config = {
  type: 'api',
  name: 'chat-with-ai',
  path: '/chat',
  method: 'POST'
}

export const handler = async (req, { logger }) => {
  // Use environment variables with process.env
  const apiKey = process.env.OPENAI_API_KEY
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  
  if (!apiKey) {
    return { status: 400, body: { error: 'Missing API key' } }
  }
  
  logger.info('Using OpenAI API', { hasKey: !!apiKey })
  
  // Your logic here...
  return { status: 200, body: { message: 'Success!' } }
}
```

### Python

```python title="my-step.step.py"
import os

config = {
    'type': 'event', 
    'name': 'process-data',
    'subscribes': ['data.received']
}

async def handler(input_data, ctx):
    # Use environment variables with os.environ
    api_key = os.environ.get('OPENAI_API_KEY')
    database_url = os.environ.get('DATABASE_URL')
    
    if not api_key:
        raise ValueError('Missing OPENAI_API_KEY')
    
    ctx.logger.info('Processing with API key', {'has_key': bool(api_key)})
    
    # Your logic here...
    return {'status': 'processed'}
```

## Deployment

When you deploy your app, set environment variables through your hosting platform:

### Motia Cloud
```bash
motia env set OPENAI_API_KEY=sk-your-production-key
motia env set NODE_ENV=production
```

## Important Security Tips

<Callout type="warning">
**🔒 Keep Your Keys Safe**

- Never commit `.env` files to git
- Use different API keys for development and production  
- Don't share API keys in code or messages
</Callout>

That's it! Environment variables are simple - just put them in `.env` and use `process.env.VARIABLE_NAME` in your code.
