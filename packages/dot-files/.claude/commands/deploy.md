# Deploy Command

Deploy Motia applications to production environments.

## Environment Setup

```bash
# .env.production
NODE_ENV=production
JWT_SECRET=your-secure-secret-min-32-chars
REDIS_URL=redis://user:pass@redis.example.com:6379
DATABASE_URL=postgresql://user:pass@db.example.com:5432/app
```

## Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 py3-pip ruby ruby-dev build-base

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip ruby

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/steps ./steps
COPY requirements.txt Gemfile* ./

RUN pip3 install -r requirements.txt
RUN gem install bundler && bundle install

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: motia-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: motia
        image: your-registry/motia:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: motia-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: motia-service
spec:
  selector:
    app: motia
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## PM2 (Traditional VPS)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'motia',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Health Checks

```typescript
// steps/api/health.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'HealthCheck',
  method: 'GET',
  path: '/health'
}

export const handler = async (req, { state }) => {
  const checks = {
    redis: await checkRedis(state),
    database: await checkDatabase(),
    storage: await checkS3()
  }
  
  const healthy = Object.values(checks).every(c => c.status === 'ok')
  
  return {
    status: healthy ? 200 : 503,
    body: { status: healthy ? 'healthy' : 'unhealthy', checks }
  }
}
```

## Monitoring

- Use structured JSON logging
- Set up Prometheus metrics endpoint
- Configure Sentry for error tracking
- Enable distributed tracing
- Monitor Redis memory usage

## Security Checklist

- [ ] Set strong JWT secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set security headers
- [ ] Enable rate limiting
- [ ] Validate all inputs
- [ ] Sanitize outputs
- [ ] Rotate secrets regularly

## Performance

- Enable Redis connection pooling
- Use PM2 cluster mode
- Configure nginx as reverse proxy
- Enable gzip compression
- Set appropriate cache headers
- Monitor memory usage