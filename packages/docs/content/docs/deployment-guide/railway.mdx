---
title: Deploy to Railway
description: Deploy your Motia app to Railway with Redis for production-grade backends
---

Railway makes deploying Motia apps dead simple. Connect your repo, add Redis, and you're live in minutes.

This guide walks you through deploying a production-ready Motia app with real Redis (not in-memory) on Railway.

<Callout type="info">
**What you'll get:** A fully containerized Motia app running on Railway with external Redis for state, events, streams, and cron locking.
</Callout>

<Callout type="info">
**Example Project:** Follow along with the [Todo App example](https://github.com/MotiaDev/motia-examples/tree/main/examples/foundational/api-patterns/todo-app) - a complete deployment-ready Motia app with Redis configuration.
</Callout>

---

## Prerequisites

Before you start:

- A [Railway account](https://railway.com) (free tier works)
- [Railway CLI](https://docs.railway.com/guides/cli) installed
- Docker running locally (for testing)
- A Motia project ready to deploy

Install the Railway CLI:

```bash
npm install -g @railway/cli
```

---

## Quick Start

<Steps>
<Step>
#### Login to Railway

```bash
railway login
```

This opens your browser for authentication.

</Step>
<Step>
#### Initialize your project

From your Motia project root:

```bash
railway init -n my-motia-app
```

This creates a new Railway project with the specified name.

</Step>
<Step>
#### Add Redis

```bash
railway add -d redis
```

Railway provisions a managed Redis instance automatically.

</Step>
<Step>
#### Create an app service

```bash
railway add -s my-app
```

This creates an empty service for your Motia app.

</Step>
<Step>
#### Link and configure

```bash
# Link to your app service
railway service my-app

# Set environment variables
railway variables --set "NODE_ENV=production"
railway variables --set "USE_REDIS=true"
railway variables --set 'REDIS_URL=${{Redis.REDIS_URL}}'
railway variables --set 'REDIS_PRIVATE_URL=${{Redis.REDIS_PRIVATE_URL}}'
```

</Step>
<Step>
#### Deploy

```bash
railway up
```

Railway builds your Docker image and deploys it.

</Step>
<Step>
#### Get your public URL

```bash
railway domain
```

This assigns a public URL to your app. You're live!

</Step>
</Steps>

---

## Project Setup

### Docker Files

If you haven't already, generate the Docker files:

```bash
npx motia@latest docker setup
```

This creates `Dockerfile` and `.dockerignore` in your project.

### Update Your Start Script

Railway injects the port via the `PORT` environment variable. Update your `package.json`:

```json title="package.json"
{
  "scripts": {
    "start": "motia start --port ${PORT:-3000} --host 0.0.0.0"
  }
}
```

This ensures Motia listens on the port Railway expects.

### Railway Configuration

Create a `railway.json` in your project root:

```json title="railway.json"
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

<Callout type="warn">
**Healthchecks:** Railway's default healthcheck expects a `200` response on `/`. Motia's iii console serves the root path, so this should work out of the box.
</Callout>

---

## Configure Redis

Motia supports two approaches for production Redis configuration:

### Option 1: Simple Redis Config (Recommended)

The simplest approach uses Motia's built-in `redis` configuration option:

```typescript title="config.yaml"
import { config } from 'motia'
import statesPlugin from '@motiadev/plugin-states/plugin'
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'
import logsPlugin from '@motiadev/plugin-logs/plugin'
import observabilityPlugin from '@motiadev/plugin-observability/plugin'
import bullmqPlugin from '@motiadev/plugin-bullmq/plugin'

// Determine Redis configuration based on environment
const getRedisConfig = () => {
  const useExternalRedis = process.env.USE_REDIS === 'true' || 
    (process.env.USE_REDIS !== 'false' && process.env.NODE_ENV === 'production')

  if (!useExternalRedis) {
    // Use Motia's built-in in-memory Redis for development
    return { useMemoryServer: true as const }
  }

  // Parse Redis URL for production
  const redisUrl = process.env.REDIS_PRIVATE_URL || process.env.REDIS_URL
  
  if (redisUrl) {
    try {
      const url = new URL(redisUrl)
      return {
        useMemoryServer: false as const,
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        username: url.username || undefined,
      }
    } catch (e) {
      console.error('[motia] Failed to parse REDIS_URL:', e)
    }
  }

  // Fallback to individual env vars
  return {
    useMemoryServer: false as const,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
  }
}

export default config({
  plugins: [
    observabilityPlugin,
    statesPlugin,
    endpointPlugin,
    logsPlugin,
    bullmqPlugin,
  ],
  redis: getRedisConfig(),
})
```

<Callout type="info">
**That's it!** Motia handles the Redis adapters automatically when you use the `redis` config option. Railway auto-injects `REDIS_URL` when you link the Redis service to your app.
</Callout>

### Option 2: Custom Adapters (Advanced)

For more control over individual adapters, you can configure them manually:

```bash
npm install @motiadev/adapter-redis-state \
            @motiadev/adapter-redis-streams \
            @motiadev/adapter-redis-cron \
            @motiadev/adapter-bullmq-events
```

```typescript title="config.yaml"
import { config } from 'motia'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'
import statesPlugin from '@motiadev/plugin-states/plugin'
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'
import logsPlugin from '@motiadev/plugin-logs/plugin'
import observabilityPlugin from '@motiadev/plugin-observability/plugin'

// Parse REDIS_URL (Railway sets this automatically when you add Redis)
// Format: redis://default:password@host:port
const url = new URL(process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL || 'redis://localhost:6379')

const redisConfig = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password || undefined,
  tls: url.protocol === 'rediss:',
}

// Only use custom adapters in production
const useRedis = process.env.USE_REDIS === 'true' || process.env.NODE_ENV === 'production'

export default config({
  plugins: [
    observabilityPlugin,
    statesPlugin,
    endpointPlugin,
    logsPlugin,
  ],
  adapters: useRedis ? {
    state: new RedisStateAdapter({
      socket: { host: redisConfig.host, port: redisConfig.port, tls: redisConfig.tls },
      username: redisConfig.username,
      password: redisConfig.password,
    }),
    streams: new RedisStreamAdapterManager({
      socket: { host: redisConfig.host, port: redisConfig.port, tls: redisConfig.tls },
      username: redisConfig.username,
      password: redisConfig.password,
    }),
    events: new BullMQEventAdapter({
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
        username: redisConfig.username,
        password: redisConfig.password,
        tls: redisConfig.tls ? {} : undefined,
        maxRetriesPerRequest: null,
      },
    }),
    cron: new RedisCronAdapter({
      socket: { host: redisConfig.host, port: redisConfig.port, tls: redisConfig.tls },
      username: redisConfig.username,
      password: redisConfig.password,
    }),
  } : undefined,
})
```

---

## Set Environment Variables

Railway auto-provisions Redis variables when you add the Redis database. Link them to your app:

<Steps>
<Step>
#### Link to your app service

```bash
railway service my-app
```

Select your app service (not Redis).

</Step>
<Step>
#### Set the variables

```bash
railway variables --set "NODE_ENV=production"
railway variables --set "USE_REDIS=true"
railway variables --set 'REDIS_URL=${{Redis.REDIS_URL}}'
railway variables --set 'REDIS_PRIVATE_URL=${{Redis.REDIS_PRIVATE_URL}}'
```

The `${{Redis.REDIS_URL}}` syntax tells Railway to inject the actual Redis URL at runtime.

</Step>
<Step>
#### Verify variables

```bash
railway variables
```

You should see your variables listed.

</Step>
</Steps>

<Callout type="warn">
**Internal vs Public URL:** Railway provides both internal (`redis.railway.internal`) and public proxy URLs for Redis. Use `REDIS_PRIVATE_URL` for faster internal connections. If you have connection issues, try the public URL from your Redis service's settings.
</Callout>

---

## Deploy and Test

### Deploy Your App

```bash
railway up
```

Watch the build logs. Once complete, Railway deploys your container.

### Get Your Domain

```bash
railway domain
```

Railway assigns a public URL like `https://your-app-production-xxxx.up.railway.app`.

### Test Your API

```bash
# List items (should be empty initially)
curl https://your-app-production-xxxx.up.railway.app/todos

# Create an item
curl -X POST https://your-app-production-xxxx.up.railway.app/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test from Railway","priority":"high"}'

# List items again (should show your new item)
curl https://your-app-production-xxxx.up.railway.app/todos
```

If you get a JSON response with your data, you're running on production Redis!

---

## View Logs

Check what's happening in your deployed app:

```bash
railway logs
```

Add `--tail` to stream logs in real-time:

```bash
railway logs --tail
```

---

## Troubleshooting

### 502 Application Failed to Respond

**Cause:** Usually means the app isn't listening on the right port.

**Fix:** Make sure your start script uses `${PORT:-3000}`:

```json
"start": "motia start --port ${PORT:-3000} --host 0.0.0.0"
```

### Redis Connection Errors

**Cause:** The app can't reach Redis.

**Check:**
1. Is the Redis service running? Check Railway dashboard.
2. Is `REDIS_URL` set correctly? Run `railway variables` to verify.
3. Try the public Redis URL if internal isn't working.

### Plugin Not Loading

**Cause:** Plugin imports might not be resolving correctly.

**Fix:** Use ESM imports (recommended for `"type": "module"` projects):

```typescript
// ✅ Correct - ESM imports
import statesPlugin from '@motiadev/plugin-states/plugin'
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'
```

### Healthcheck Failed

**Cause:** Railway expects a 200 response on your healthcheck path.

**Options:**
1. Remove healthcheck settings from `railway.json`
2. Motia iii console serves `/` by default which returns 200
3. Increase the healthcheck timeout

### Still Seeing "Redis Memory Server Started"

**Cause:** The app is falling back to in-memory Redis.

**Check:**
1. Is `NODE_ENV=production` or `USE_REDIS=true` set?
2. Is `REDIS_URL` resolving correctly?
3. Check logs for Redis connection errors.

---

## Scaling

Need more instances? Update your `railway.json`:

```json title="railway.json"
{
  "deploy": {
    "numReplicas": 3
  }
}
```

With Redis configured, all instances share state, events, and streams. Requests get load-balanced automatically.

---

## What's Next?

<Cards>
  <Card href="/docs/deployment-guide/fly" title="Deploy to Fly.io">
    Alternative cloud platform with global edge deployment
  </Card>
  
  <Card href="/docs/deployment-guide/self-hosted" title="Self-Hosted">
    Full control with your own infrastructure
  </Card>
</Cards>
