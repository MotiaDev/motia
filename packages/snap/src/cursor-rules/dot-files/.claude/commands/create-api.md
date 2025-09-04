# Create REST API Command

Create production-ready REST APIs following Motia patterns.

## Basic CRUD API

```typescript
// steps/api/[resource]/create.step.ts
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

const Schema = z.object({
  // Define your schema
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Create[Resource]',
  method: 'POST',
  path: '/[resources]',
  bodySchema: Schema,
  responseSchema: {
    201: Schema,
    400: z.object({ error: z.string() })
  },
  emits: ['[resource].created']
}

export const handler: Handlers['Create[Resource]'] = async (req, { emit, state }) => {
  // Implementation
}
```

## Complete CRUD Set

1. **Create**: `POST /[resources]`
2. **Read**: `GET /[resources]/:id`
3. **Update**: `PUT /[resources]/:id`
4. **Delete**: `DELETE /[resources]/:id`
5. **List**: `GET /[resources]` (with pagination)

## Authentication

```typescript
// steps/api/auth/login.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Login',
  method: 'POST',
  path: '/auth/login',
  bodySchema: z.object({
    email: z.string().email(),
    password: z.string()
  }),
  emits: ['auth.login.success', 'auth.login.failed']
}
```

## Middleware

```typescript
// steps/middleware/auth.ts
export const authMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return { status: 401, body: { error: 'No token' } }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    return next()
  } catch {
    return { status: 401, body: { error: 'Invalid token' } }
  }
}
```

## File Upload

```typescript
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Upload',
  method: 'POST',
  path: '/upload',
  middleware: [multer().single('file')],
  emits: ['file.uploaded']
}
```

## Patterns

- Always validate input with Zod
- Emit events for async processing
- Return appropriate HTTP status codes
- Include error details in responses
- Use middleware for cross-cutting concerns