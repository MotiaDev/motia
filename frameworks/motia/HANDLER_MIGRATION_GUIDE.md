# HTTP Handler Migration Guide

This guide covers migrating HTTP step handlers from the old `(req, ctx)` signature to the new `MotiaHttpArgs`-based approach with `{ request, response }` destructuring. It also introduces Server-Sent Events (SSE) support.

---

## Table of Contents

1. [Overview](#1-overview)
2. [TypeScript / JavaScript](#2-typescript--javascript)
3. [Python](#3-python)
4. [Middleware](#4-middleware)
5. [Server-Sent Events (SSE)](#5-server-sent-events-sse)
6. [Migration Checklist](#6-migration-checklist)

---

## 1. Overview

HTTP step handlers now receive a `MotiaHttpArgs` object as their first argument instead of a bare request object. This object contains both `request` and `response`, enabling streaming patterns like SSE alongside standard request/response flows.

| Aspect | Old | New |
|---|---|---|
| First argument (TS/JS) | `req` (request object directly) | `{ request, response }` (`MotiaHttpArgs`) |
| First argument (Python) | `req` (dict-like object) | `request: ApiRequest` or `args: MotiaHttpArgs` |
| Body access (TS/JS) | `req.body` | `request.body` |
| Path params (TS/JS) | `req.pathParams` | `request.pathParams` |
| Query params (TS/JS) | `req.queryParams` | `request.queryParams` |
| Headers (TS/JS) | `req.headers` | `request.headers` |
| Body access (Python) | `req.get("body", {})` | `request.body` |
| Path params (Python) | `req.get("pathParams", {}).get("id")` | `request.path_params.get("id")` |
| Return type (Python) | `{"status": 200, "body": {...}}` | `ApiResponse(status=200, body={...})` |
| Middleware placement | Config root: `middleware: [...]` | Inside trigger: `{ type: 'http', ..., middleware: [...] }` |
| Middleware first arg | `req` | `{ request, response }` |

---

## 2. TypeScript / JavaScript

### Standard HTTP Handler

**Old:**

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'GetUser',
  triggers: [
    { type: 'http', path: '/users/:id', method: 'GET' },
  ],
  enqueues: [],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { logger }) => {
  const userId = req.pathParams.id
  const { name } = req.body
  logger.info('Getting user', { userId })
  return { status: 200, body: { id: userId, name } }
}
```

**New:**

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'GetUser',
  triggers: [
    { type: 'http', path: '/users/:id', method: 'GET' },
  ],
  enqueues: [],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async ({ request }, { logger }) => {
  const userId = request.pathParams.id
  const { name } = request.body
  logger.info('Getting user', { userId })
  return { status: 200, body: { id: userId, name } }
}
```

### Key Changes

1. Destructure `{ request }` (or `{ request, response }`) from the first argument
2. Access `request.body`, `request.pathParams`, `request.queryParams`, `request.headers` instead of `req.body`, etc.
3. Return value stays the same: `{ status, body, headers? }`

### Types

```typescript
interface MotiaHttpArgs<TBody = unknown> {
  request: MotiaHttpRequest<TBody>
  response: MotiaHttpResponse
}

interface MotiaHttpRequest<TBody = unknown> {
  pathParams: Record<string, string>
  queryParams: Record<string, string | string[]>
  body: TBody
  headers: Record<string, string | string[]>
  method: string
  requestBody: ChannelReader
}

type MotiaHttpResponse = {
  status: (statusCode: number) => void
  headers: (headers: Record<string, string>) => void
  stream: NodeJS.WritableStream
  close: () => void
}
```

### Multi-Trigger Steps

When using `ctx.match()`, the HTTP branch handler also receives `MotiaHttpArgs`:

**Old:**

```typescript
return ctx.match({
  http: async (request) => {
    const { userId } = request.body
    return { status: 200, body: { ok: true } }
  },
})
```

**New:**

```typescript
return ctx.match({
  http: async ({ request }) => {
    const { userId } = request.body
    return { status: 200, body: { ok: true } }
  },
})
```

---

## 3. Python

### Standard HTTP Handler

**Old:**

```python
config = {
    "name": "GetUser",
    "triggers": [
        {"type": "http", "path": "/users/:id", "method": "GET"}
    ],
    "enqueues": [],
}

async def handler(req, ctx):
    user_id = req.get("pathParams", {}).get("id")
    ctx.logger.info("Getting user", {"userId": user_id})
    return {"status": 200, "body": {"id": user_id}}
```

**New:**

```python
from typing import Any
from motia import ApiRequest, ApiResponse, FlowContext, http

config = {
    "name": "GetUser",
    "triggers": [
        http("GET", "/users/:id"),
    ],
    "enqueues": [],
}

async def handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    user_id = request.path_params.get("id")
    ctx.logger.info("Getting user", {"userId": user_id})
    return ApiResponse(status=200, body={"id": user_id})
```

### Key Changes

1. Import `ApiRequest`, `ApiResponse`, `FlowContext` from `motia`
2. Use `http()` helper for trigger definitions
3. Handler signature: `request: ApiRequest[Any]` and `ctx: FlowContext[Any]`
4. Access typed properties: `request.body`, `request.path_params`, `request.query_params`, `request.headers`
5. Return `ApiResponse(status=..., body=...)` instead of a plain dict

### Python Types

```python
class ApiRequest(BaseModel, Generic[TBody]):
    path_params: dict[str, str]
    query_params: dict[str, str | list[str]]
    body: TBody | None
    headers: dict[str, str | list[str]]

class ApiResponse(BaseModel, Generic[TOutput]):
    status: int
    body: Any
    headers: dict[str, str] = Field(default_factory=dict)
```

---

## 4. Middleware

### Placement Change

Middleware has moved from the config root into the HTTP trigger object.

**Old:**

```typescript
export const config = {
  name: 'ProtectedEndpoint',
  triggers: [
    { type: 'http', path: '/protected', method: 'GET' },
  ],
  middleware: [authMiddleware],  // at config root
  enqueues: [],
} as const satisfies StepConfig
```

**New:**

```typescript
export const config = {
  name: 'ProtectedEndpoint',
  triggers: [
    { type: 'http', path: '/protected', method: 'GET', middleware: [authMiddleware] },
  ],
  enqueues: [],
} as const satisfies StepConfig
```

### Middleware Signature Change

**Old:**

```typescript
const authMiddleware: ApiMiddleware = async (req, ctx, next) => {
  if (!req.headers.authorization) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }
  return next()
}
```

**New:**

```typescript
const authMiddleware: ApiMiddleware = async ({ request }, ctx, next) => {
  if (!request.headers.authorization) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }
  return next()
}
```

---

## 5. Server-Sent Events (SSE)

SSE is a new capability enabled by the `response` object in `MotiaHttpArgs`. Instead of returning a response, you write directly to the stream.

### TypeScript

```typescript
import { type Handlers, http, type StepConfig } from 'motia'

export const config = {
  name: 'SSE Example',
  description: 'Streams data back to the client as SSE',
  flows: ['sse-example'],
  triggers: [http('POST', '/sse')],
  enqueues: [],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async ({ request, response }, { logger }) => {
  logger.info('SSE request received')

  response.status(200)
  response.headers({
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })

  const chunks: string[] = []
  for await (const chunk of request.requestBody.stream) {
    chunks.push(Buffer.from(chunk).toString('utf-8'))
  }

  const items = ['alpha', 'bravo', 'charlie']
  for (const item of items) {
    response.stream.write(`event: item\ndata: ${JSON.stringify({ item })}\n\n`)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  response.stream.write(`event: done\ndata: ${JSON.stringify({ total: items.length })}\n\n`)
  response.close()
}
```

### Python

```python
import asyncio
import json
from typing import Any

from motia import MotiaHttpArgs, FlowContext, http

config = {
    "name": "SSE Example",
    "description": "Streams data back to the client as SSE",
    "flows": ["sse-example"],
    "triggers": [
        http("POST", "/sse"),
    ],
    "enqueues": [],
}

async def handler(args: MotiaHttpArgs[Any], ctx: FlowContext[Any]) -> None:
    request = args.request
    response = args.response

    ctx.logger.info("SSE request received")

    await response.status(200)
    await response.headers({
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "connection": "keep-alive",
    })

    raw_chunks: list[str] = []
    async for chunk in request.request_body.stream:
        if isinstance(chunk, bytes):
            raw_chunks.append(chunk.decode("utf-8", errors="replace"))
        else:
            raw_chunks.append(str(chunk))

    items = ["alpha", "bravo", "charlie"]
    for item in items:
        response.writer.stream.write(
            f"event: item\ndata: {json.dumps({'item': item})}\n\n".encode("utf-8")
        )
        await asyncio.sleep(0.5)

    response.writer.stream.write(
        f"event: done\ndata: {json.dumps({'total': len(items)})}\n\n".encode("utf-8")
    )
    response.close()
```

### SSE Key Points

- Destructure **both** `request` and `response` from the first argument
- Use `response.status()` and `response.headers()` to configure the response
- Write SSE-formatted data to `response.stream` (TS/JS) or `response.writer.stream` (Python)
- Call `response.close()` when done streaming
- Do **not** return a response object

---

## 6. Migration Checklist

### TypeScript / JavaScript

- [ ] Change handler first argument from `(req, ctx)` to `({ request }, ctx)` for all HTTP steps
- [ ] Replace `req.body` with `request.body`
- [ ] Replace `req.pathParams` with `request.pathParams`
- [ ] Replace `req.queryParams` with `request.queryParams`
- [ ] Replace `req.headers` with `request.headers`
- [ ] Move `middleware` arrays from config root into HTTP trigger objects
- [ ] Update middleware functions: change `(req, ctx, next)` to `({ request }, ctx, next)`
- [ ] Update `ctx.match()` HTTP handlers: change `(request) =>` to `({ request }) =>`

### Python

- [ ] Add imports: `from motia import ApiRequest, ApiResponse, FlowContext, http`
- [ ] Use `http()` helper in trigger definitions
- [ ] Change handler signature to `handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]`
- [ ] Replace `req.get("body", {})` with `request.body`
- [ ] Replace `req.get("pathParams", {}).get("id")` with `request.path_params.get("id")`
- [ ] Replace `req.get("queryParams", {})` with `request.query_params`
- [ ] Replace `req.get("headers", {})` with `request.headers`
- [ ] Return `ApiResponse(status=..., body=...)` instead of plain dicts
- [ ] For SSE: use `MotiaHttpArgs` instead of `ApiRequest`
