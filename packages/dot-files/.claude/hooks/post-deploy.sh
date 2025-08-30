#!/bin/bash
# Post-deployment hook for Motia applications

echo "🚀 Running post-deployment tasks..."

# 1. Health check
echo "💊 Running health check..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
  
  if [ "$response" = "200" ]; then
    echo "✅ Health check passed"
    break
  else
    echo "⏳ Waiting for service to be ready... (attempt $((attempt + 1))/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
  fi
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Health check failed after $max_attempts attempts"
  exit 1
fi

# 2. Run smoke tests
echo "🔥 Running smoke tests..."
npm run test:smoke

# 3. Verify critical endpoints
echo "🔍 Verifying critical endpoints..."
endpoints=(
  "/api/v1/health"
  "/api/v1/auth/login"
  "/api/v1/users"
)

for endpoint in "${endpoints[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${endpoint}")
  if [[ "$response" =~ ^(200|401|405)$ ]]; then
    echo "✅ ${endpoint} - ${response}"
  else
    echo "❌ ${endpoint} - ${response} (unexpected)"
    exit 1
  fi
done

# 4. Check Redis connectivity
echo "🔗 Checking Redis connection..."
node -e "
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

client.on('error', err => {
  console.error('❌ Redis connection failed:', err.message);
  process.exit(1);
});

client.connect().then(async () => {
  await client.set('deploy:test', 'ok', { EX: 60 });
  const value = await client.get('deploy:test');
  
  if (value === 'ok') {
    console.log('✅ Redis connection verified');
    await client.quit();
  } else {
    console.error('❌ Redis read/write test failed');
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Redis error:', err);
  process.exit(1);
});
"

# 5. Send deployment notification
echo "📢 Sending deployment notification..."
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🚀 Motia deployment successful!\",
      \"attachments\": [{
        \"color\": \"good\",
        \"fields\": [
          {\"title\": \"Environment\", \"value\": \"$NODE_ENV\", \"short\": true},
          {\"title\": \"Version\", \"value\": \"$npm_package_version\", \"short\": true},
          {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": false}
        ]
      }]
    }"
fi

echo "✅ Post-deployment tasks completed successfully!"