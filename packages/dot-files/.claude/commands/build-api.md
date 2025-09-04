# Build a REST API

Build any REST API with Motia - from simple CRUD to complex business logic.

## Quick Start - Your First API

```javascript
// steps/api/hello.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/hello'
}

exports.handler = async () => {
  return { 
    status: 200, 
    body: { message: 'Hello World!' } 
  }
}
```

That's it! Your API is running at `http://localhost:5173/hello`

## Choose Your Language

### JavaScript - Quick & Simple
Perfect for: Rapid prototyping, simple APIs, MVPs

```javascript
// steps/api/users/create.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/users',
  emits: ['user.created']
}

exports.handler = async (req, { emit, state }) => {
  const user = {
    id: crypto.randomUUID(),
    ...req.body,
    createdAt: new Date()
  }
  
  await state.set('users', user.id, user)
  await emit({ topic: 'user.created', data: user })
  
  return { status: 201, body: user }
}
```

### TypeScript - Type-Safe & Scalable
Perfect for: Enterprise apps, teams, complex logic

```typescript
// steps/api/users/create.step.ts
import { z } from 'zod'

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().min(18)
})

export const config = {
  type: 'api' as const,
  method: 'POST' as const,
  path: '/users',
  bodySchema: UserSchema,
  emits: ['user.created']
}

export const handler = async (req, { emit, state }) => {
  // TypeScript knows req.body matches UserSchema!
  const user = {
    id: crypto.randomUUID(),
    ...req.body,
    createdAt: new Date()
  }
  
  await state.set('users', user.id, user)
  await emit({ topic: 'user.created', data: user })
  
  return { status: 201, body: user }
}
```

## Common API Patterns

### 1. CRUD Operations
```javascript
// Create
exports.config = { type: 'api', method: 'POST', path: '/items' }

// Read  
exports.config = { type: 'api', method: 'GET', path: '/items/:id' }

// Update
exports.config = { type: 'api', method: 'PUT', path: '/items/:id' }

// Delete
exports.config = { type: 'api', method: 'DELETE', path: '/items/:id' }

// List
exports.config = { type: 'api', method: 'GET', path: '/items' }
```

### 2. With Authentication
```javascript
// steps/api/protected.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/protected',
  middleware: ['authMiddleware'] // Add authentication
}

exports.handler = async (req) => {
  // req.user is available from auth middleware
  return { 
    status: 200, 
    body: { 
      message: `Hello ${req.user.name}!`,
      userId: req.user.id 
    } 
  }
}
```

### 3. File Upload
```javascript
// steps/api/upload.step.js
const multer = require('multer')

exports.config = {
  type: 'api',
  method: 'POST',
  path: '/upload',
  middleware: [multer().single('file')]
}

exports.handler = async (req, { state }) => {
  const file = req.file
  const fileId = crypto.randomUUID()
  
  await state.set('files', fileId, {
    originalName: file.originalname,
    size: file.size,
    buffer: file.buffer
  })
  
  return { 
    status: 200, 
    body: { fileId, size: file.size } 
  }
}
```

### 4. With Validation
```javascript
// steps/api/register.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/register',
  bodySchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      age: { type: 'number', minimum: 18 }
    },
    required: ['email', 'password']
  }
}

exports.handler = async (req) => {
  // Body is automatically validated!
  // Invalid requests get 400 response
  return { status: 201, body: { success: true } }
}
```

### 5. Streaming Response
```javascript
// steps/api/stream.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/events/stream'
}

exports.handler = async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })
  
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: new Date() })}\n\n`)
  }, 1000)
  
  req.on('close', () => {
    clearInterval(interval)
    res.end()
  })
}
```

## Real-World Examples

### E-commerce Product API
```javascript
// steps/api/products/search.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/products/search',
  querySchema: {
    type: 'object',
    properties: {
      q: { type: 'string' },
      category: { type: 'string' },
      minPrice: { type: 'number' },
      maxPrice: { type: 'number' },
      page: { type: 'number', default: 1 },
      limit: { type: 'number', default: 20, maximum: 100 }
    }
  }
}

exports.handler = async (req, { state }) => {
  const { q, category, minPrice, maxPrice, page, limit } = req.queryParams
  
  // Get all products
  let products = await state.getGroup('products') || []
  
  // Apply filters
  if (q) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase())
    )
  }
  
  if (category) {
    products = products.filter(p => p.category === category)
  }
  
  if (minPrice) {
    products = products.filter(p => p.price >= minPrice)
  }
  
  if (maxPrice) {
    products = products.filter(p => p.price <= maxPrice)
  }
  
  // Pagination
  const total = products.length
  const offset = (page - 1) * limit
  products = products.slice(offset, offset + limit)
  
  return {
    status: 200,
    body: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
}
```

### Social Media Post API
```javascript
// steps/api/posts/create.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/posts',
  middleware: ['authMiddleware'],
  bodySchema: {
    type: 'object',
    properties: {
      content: { type: 'string', maxLength: 280 },
      media: { 
        type: 'array',
        items: { type: 'string', format: 'url' }
      },
      tags: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['content']
  },
  emits: ['post.created', 'timeline.update']
}

exports.handler = async (req, { emit, state }) => {
  const post = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    content: req.body.content,
    media: req.body.media || [],
    tags: req.body.tags || [],
    likes: 0,
    comments: 0,
    createdAt: new Date()
  }
  
  // Save post
  await state.set('posts', post.id, post)
  
  // Add to user's posts
  const userPosts = await state.get('user_posts', req.user.id) || []
  userPosts.unshift(post.id)
  await state.set('user_posts', req.user.id, userPosts)
  
  // Emit events for timeline updates
  await emit({
    topic: 'post.created',
    data: post
  })
  
  await emit({
    topic: 'timeline.update',
    data: {
      userId: req.user.id,
      postId: post.id
    }
  })
  
  return { status: 201, body: post }
}
```

## API Best Practices

### 1. Always Handle Errors
```javascript
exports.handler = async (req, { state, logger }) => {
  try {
    // Your logic here
    return { status: 200, body: { success: true } }
  } catch (error) {
    logger.error('Operation failed', { error, userId: req.user?.id })
    return { 
      status: 500, 
      body: { error: 'Something went wrong' } 
    }
  }
}
```

### 2. Use Proper Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

### 3. Version Your APIs
```javascript
// steps/api/v1/users.step.js
exports.config = { path: '/api/v1/users' }

// steps/api/v2/users.step.js  
exports.config = { path: '/api/v2/users' }
```

### 4. Add Rate Limiting
```javascript
exports.config = {
  type: 'api',
  path: '/api/data',
  middleware: ['rateLimiter'] // Protect from abuse
}
```

## Testing Your API

```bash
# Test locally
curl http://localhost:5173/hello

# Test with data
curl -X POST http://localhost:5173/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```

## Next Steps

- Add authentication: See `add-authentication.md`
- Process data async: See `process-background-jobs.md`
- Add real-time updates: See `add-realtime.md`
- Deploy to production: See `deploy.md`