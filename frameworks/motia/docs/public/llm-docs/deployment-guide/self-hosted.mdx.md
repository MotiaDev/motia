---
title: Self-Hosted Deployment
description: Learn how to deploy your Motia project to production using motia-docker
---

<video controls className="mb-8 w-full rounded-xl" poster="https://assets.motia.dev/images/gifs/v1/8-motia-self-hosting.gif">
  <source src="https://assets.motia.dev/videos/mp4/site/v1/8-motia-self-hosting.mp4" type="video/mp4" />
</video>

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

If you're using a minimal Docker image like `node:24-slim` instead of the official `motiadev/motia:latest` image, you may encounter errors when creating a new Motia project or running the dev server, 
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

Create a production `config.yaml` that uses Redis adapters for all modules:

```yaml title="config.yaml"
modules:
  - class: modules::stream::StreamModule
    config:
      port: ${STREAMS_PORT:31112}
      host: 0.0.0.0
      auth_function: motia.streams.authenticate
      adapter:
        class: modules::stream::adapters::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::state::StateModule
    config:
      adapter:
        class: modules::state::adapters::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::api::RestApiModule
    config:
      port: ${PORT:3111}
      host: 0.0.0.0
      default_timeout: 30000
      concurrency_request_limit: 1024

  - class: modules::queue::QueueModule
    config:
      adapter:
        class: modules::queue::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::observability::OtelModule
    config:
      enabled: true
      service_name: ${OTEL_SERVICE_NAME:my-app}
      exporter: otlp

  - class: modules::pubsub::PubSubModule
    config:
      adapter:
        class: modules::pubsub::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::cron::CronModule
    config:
      adapter:
        class: modules::cron::KvCronAdapter
```

<Callout type="info">
The `${REDIS_URL:redis://localhost:6379}` syntax uses environment variable interpolation with a default value. Set the `REDIS_URL` env var in your docker-compose.yml or deployment platform.
</Callout>

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
