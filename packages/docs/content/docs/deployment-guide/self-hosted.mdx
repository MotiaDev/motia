---
title: Self-Hosted Deployment
description: Learn how to deploy your Motia project to production using motia-docker
---

import VideoPlayer from '@/components/VideoPlayer';

<VideoPlayer videoPath="https://assets.motia.dev/videos/mp4/site/v1/8-motia-self-hosting.mp4" gifPath="https://assets.motia.dev/images/gifs/v1/8-motia-self-hosting.gif" title="Self-Hosting & Deployment" className="mb-8" />

Run your Motia app in Docker containers. Same environment everywhere - dev, staging, production.

<Callout type="warn">You need motia package **0.5.2-beta.101 or higher**</Callout>

<Callout type="info">
**Example Project:** Follow along with the [Todo App example](https://github.com/MotiaDev/motia-examples/tree/main/examples/foundational/api-patterns/todo-app) - a complete deployment-ready Motia app with Redis configuration.
</Callout>

## Quick Start

<Callout type="info">
**Important:** Run these commands from your project root (where your `package.json` is).
</Callout>

<Steps>
<Step>
#### Navigate to your project

```bash
cd /path/to/your/motia-project
```

Make sure you see `package.json` when you run `ls`.

</Step>
<Step>
#### Setup Docker files

```bash
npx motia@latest docker setup
```

This creates `Dockerfile` and `.dockerignore` in your project.

</Step>
<Step>
#### Build and run

```bash
npx motia@latest docker run --project-name my-app
```

Replace `my-app` with your project name.

</Step>
<Step>
#### Check it works

Open [http://localhost:3000](http://localhost:3000) in your browser.

For more options:
```bash
npx motia@latest docker run --help
```

</Step>
</Steps>

<Callout type="error">
**Getting `ENOENT: no such file or directory, open package.json`?**

You're not in your project directory. Run `cd /path/to/your/project` first.
</Callout>

---

## Manual Docker Setup

Want more control? Build it yourself.

The `docker setup` command creates a Dockerfile for you, but here's what's in it:

```dockerfile title="Dockerfile"
# Use Motia's base image (has Node + Python ready)
FROM motiadev/motia:latest

# For AWS Lightsail or other ARM platforms, use:
# FROM --platform=linux/arm64 motiadev/motia:latest

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy your app
COPY . .

# If you have Python steps, uncomment this line:
# RUN npx motia@latest install

# Expose the port
EXPOSE 3000

# Start your app
CMD ["npm", "run", "start"]
```

### Python Steps?

If you have Python steps, uncomment this line in the Dockerfile:

```dockerfile
RUN npx motia@latest install
```

And make sure you have a `requirements.txt` file in your project.

### .dockerignore

Create a `.dockerignore` file to keep your image small:

```bash
# Git
.git
.gitignore

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Local development
.env

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

---

## Build and Run Manually

### Build your image

```bash
docker build -t my-motia-app .
```

### Run it

```bash
docker run -it --rm -p 3000:3000 my-motia-app
```

Open [http://localhost:3000](http://localhost:3000) - your app should be running!

---

## Troubleshooting

### Using Minimal Docker Images (node:24-slim)

If you're using a minimal Docker image like `node:24-slim` instead of the official `motiadev/motia:latest` image, you may encounter errors when creating a new Motia project or running `motia dev`, 
because the `redis-memory-server` package may require build tools (`make`, `gcc`, etc.) to compile Redis from source. These are not included in minimal images.

**Solution:** Install the required dependencies before running Motia:

```bash
docker run --rm node:24-slim bash -c "
  apt-get update && apt-get install -y ca-certificates git build-essential &&
  npx motia@latest create my-app --template starter-typescript
"
```

**Alternative:** Install Redis system package to avoid compilation:

```bash
docker run --rm node:24-slim bash -c "
  apt-get update && apt-get install -y ca-certificates git redis-server &&
  export REDISMS_SYSTEM_BINARY=/usr/bin/redis-server &&
  npx motia@latest create my-app --template starter-typescript
"
```

**Recommended:** Use the official `motiadev/motia:latest` image which includes all required dependencies, or use the full `node:24` image instead of `node:24-slim`.

---

## Deploy to Cloud

Once you have Docker working locally, deploy to any cloud platform:

### Railway

The easiest option. Railway detects your Dockerfile automatically and provides managed Redis.

👉 [Full Railway deployment guide →](/docs/deployment-guide/railway)

### Fly.io

Global edge deployment with Upstash Redis. Great for low-latency worldwide.

👉 [Full Fly.io deployment guide →](/docs/deployment-guide/fly)

### AWS Lightsail

Lightsail needs ARM. Update your Dockerfile:

```dockerfile
FROM --platform=linux/arm64 motiadev/motia:latest
```

Then build and deploy.

### Render

Create a Web Service, point to your repo. Render builds automatically. Add a Redis instance and set `REDIS_URL`.

---

## Configuring Redis for Production

When deploying to production or running multiple Motia instances, you need to configure Redis for shared state, events, and streams.

### When to Use External Redis

**Use in-memory Redis (default) when:**
- Running a single Motia instance
- Development and testing
- Simple deployments

**Use external Redis when:**
- Running multiple Motia instances (horizontal scaling)
- Production deployments requiring high availability
- Need shared state/events/streams across instances

### Docker Compose with Redis

For production deployments, use Docker Compose to run Motia with Redis:

```yaml title="docker-compose.yml"
services:
  redis:
    image: redis:7-alpine
    container_name: motia-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  motia:
    build: .
    container_name: motia-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - USE_REDIS=true
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
```

<Callout type="info">
**Key features of this setup:**
- Healthcheck ensures Redis is ready before Motia starts
- `REDIS_URL` format works across all platforms (Docker, Railway, Fly.io)
- `USE_REDIS=true` explicitly enables Redis adapters
- No RabbitMQ needed - BullMQ handles events using Redis
</Callout>

### Configure Redis in config.yaml

#### Option 1: Simple Redis Config (Recommended)

Use Motia's built-in `redis` configuration option:

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
    return { useMemoryServer: true as const }
  }

  const redisUrl = process.env.REDIS_URL
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
**Local vs Production:** Set `USE_REDIS=true` in your docker-compose.yml for production. Without it, Motia uses the built-in in-memory Redis (great for local development).
</Callout>

#### Option 2: Custom Adapters (Advanced)

For more control, configure adapters manually:

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

// Parse REDIS_URL from environment
const url = new URL(process.env.REDIS_URL || 'redis://localhost:6379')

const redisConfig = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password || undefined,
  tls: url.protocol === 'rediss:',
}

const useRedis = process.env.USE_REDIS === 'true'

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

### Test Your Setup

Run Docker Compose and verify everything works:

```bash
# Build and start
docker-compose up --build

# In another terminal, test the API
curl http://localhost:3000/todos

# Create something
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Todo","priority":"high"}'

# List again - your data persists in Redis
curl http://localhost:3000/todos
```

<Callout type="info">
This same Docker Compose setup works as a foundation for deploying to any platform. Just push to Railway, Fly.io, or your own server and configure the `REDIS_URL` environment variable.
</Callout>

### Scaling Multiple Instances

With Redis configured, you can scale to multiple instances:

```yaml title="docker-compose.yml"
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  motia-1:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - USE_REDIS=true
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

  motia-2:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - USE_REDIS=true
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

  motia-3:
    build: .
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
      - USE_REDIS=true
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
```

All instances share the same state, events, and streams through Redis. Put a load balancer in front and requests get distributed across all instances.

<Callout type="warn">
Without Redis configuration, each Motia instance has isolated state and events. Configure Redis for multi-instance deployments.
</Callout>

[Learn more about adapters →](/docs/development-guide/adapters/usage)

---

## Resources

- [Docker Hub](https://hub.docker.com/r/motiadev/motia) - Official Motia image
- [Example Project](https://github.com/MotiaDev/motia-examples/tree/main/examples/motia-docker) - Full deployment example
- [CLI Reference](/docs/development-guide/cli#docker) - All docker commands
