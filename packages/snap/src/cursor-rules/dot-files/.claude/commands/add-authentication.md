# Add Authentication to Your Backend

Secure your Motia backend with authentication - from simple API keys to full JWT auth with social logins.

## Quick Start - Basic Auth in 2 Minutes

```javascript
// steps/api/auth/login.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/auth/login'
}

exports.handler = async (req, { state }) => {
  const { email, password } = req.body
  
  // Get user
  const user = await state.get('users', `email:${email}`)
  if (!user || user.password !== password) {
    return { status: 401, body: { error: 'Invalid credentials' } }
  }
  
  // Create token
  const token = crypto.randomUUID()
  await state.set('sessions', token, { userId: user.id }, 86400) // 24h
  
  return { 
    status: 200, 
    body: { token, user: { id: user.id, email: user.email } } 
  }
}
```

```javascript
// steps/middleware/auth.js
exports.authMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return { status: 401, body: { error: 'No token' } }
  }
  
  const session = await ctx.state.get('sessions', token)
  if (!session) {
    return { status: 401, body: { error: 'Invalid token' } }
  }
  
  req.user = { id: session.userId }
  return next()
}
```

That's it! Now protect any API:
```javascript
exports.config = {
  type: 'api',
  path: '/protected',
  middleware: ['authMiddleware']
}
```

## Choose Your Auth Method

### 1. Simple API Keys
Best for: APIs, webhooks, service-to-service

```javascript
// steps/middleware/api-key.js
exports.apiKeyAuth = async (req, ctx, next) => {
  const apiKey = req.headers['x-api-key']
  
  if (!apiKey) {
    return { status: 401, body: { error: 'API key required' } }
  }
  
  const keyData = await ctx.state.get('api_keys', apiKey)
  if (!keyData || !keyData.active) {
    return { status: 401, body: { error: 'Invalid API key' } }
  }
  
  req.apiKey = keyData
  return next()
}

// Use it
exports.config = {
  type: 'api',
  path: '/api/data',
  middleware: ['apiKeyAuth']
}
```

### 2. JWT Authentication  
Best for: Web apps, mobile apps, SPAs

```javascript
// steps/api/auth/jwt-login.step.js
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.config = {
  type: 'api',
  method: 'POST',
  path: '/auth/login',
  bodySchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    required: ['email', 'password']
  }
}

exports.handler = async (req, { state }) => {
  const { email, password } = req.body
  
  const user = await state.get('users', `email:${email}`)
  if (!user) {
    return { status: 401, body: { error: 'Invalid credentials' } }
  }
  
  const valid = await bcrypt.compare(password, user.hashedPassword)
  if (!valid) {
    return { status: 401, body: { error: 'Invalid credentials' } }
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  
  return { 
    status: 200, 
    body: { 
      token,
      user: { id: user.id, email: user.email, name: user.name }
    } 
  }
}
```

### 3. Social Login (OAuth)
Best for: Consumer apps, quick signup

```javascript
// steps/api/auth/google.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/auth/google/callback',
  emits: ['user.created', 'user.login']
}

exports.handler = async (req, { state, emit }) => {
  const { code } = req.queryParams
  
  // Exchange code for token
  const googleToken = await exchangeCodeForToken(code)
  
  // Get user info from Google
  const googleUser = await getGoogleUserInfo(googleToken)
  
  // Find or create user
  let user = await state.get('users', `google:${googleUser.id}`)
  
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
      provider: 'google',
      providerId: googleUser.id,
      createdAt: new Date()
    }
    
    await state.set('users', user.id, user)
    await state.set('users', `google:${googleUser.id}`, user)
    await state.set('users', `email:${user.email}`, user)
    
    await emit({ topic: 'user.created', data: user })
  }
  
  // Create session
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET)
  
  // Redirect to app with token
  return {
    status: 302,
    headers: {
      Location: `${process.env.APP_URL}/auth/success?token=${token}`
    }
  }
}
```

## Complete Auth System

### Registration with Email Verification

```javascript
// steps/api/auth/register.step.js
const bcrypt = require('bcrypt')

exports.config = {
  type: 'api',
  method: 'POST',
  path: '/auth/register',
  bodySchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      name: { type: 'string' }
    },
    required: ['email', 'password', 'name']
  },
  emits: ['user.registered', 'email.verification.send']
}

exports.handler = async (req, { state, emit }) => {
  const { email, password, name } = req.body
  
  // Check if exists
  const existing = await state.get('users', `email:${email}`)
  if (existing) {
    return { status: 409, body: { error: 'Email already registered' } }
  }
  
  // Create user
  const user = {
    id: crypto.randomUUID(),
    email,
    name,
    hashedPassword: await bcrypt.hash(password, 10),
    emailVerified: false,
    verificationToken: crypto.randomUUID(),
    createdAt: new Date()
  }
  
  await state.set('users', user.id, user)
  await state.set('users', `email:${email}`, user)
  await state.set('verify_tokens', user.verificationToken, user.id, 86400)
  
  // Send verification email
  await emit({
    topic: 'email.verification.send',
    data: {
      to: email,
      name,
      token: user.verificationToken
    }
  })
  
  return { 
    status: 201, 
    body: { 
      message: 'Registration successful. Please check your email.' 
    } 
  }
}
```

```python
# steps/send_verification_email_step.py
import sendgrid

config = {
    "type": "event",
    "subscribes": ["email.verification.send"]
}

async def handler(input_data, ctx):
    sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
    
    message = {
        'to': input_data['to'],
        'from': 'noreply@yourapp.com',
        'subject': 'Verify your email',
        'html': f"""
            <h1>Welcome {input_data['name']}!</h1>
            <p>Click below to verify your email:</p>
            <a href="{os.environ.get('APP_URL')}/verify/{input_data['token']}">
                Verify Email
            </a>
        """
    }
    
    sg.send(message)
    ctx.logger.info(f"Verification email sent to {input_data['to']}")
```

### Password Reset Flow

```javascript
// steps/api/auth/forgot-password.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/auth/forgot-password',
  bodySchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' }
    },
    required: ['email']
  },
  emits: ['password.reset.requested']
}

exports.handler = async (req, { state, emit }) => {
  const { email } = req.body
  
  const user = await state.get('users', `email:${email}`)
  if (!user) {
    // Don't reveal if email exists
    return { status: 200, body: { message: 'If the email exists, reset link sent' } }
  }
  
  const resetToken = crypto.randomUUID()
  await state.set('reset_tokens', resetToken, user.id, 3600) // 1 hour
  
  await emit({
    topic: 'password.reset.requested',
    data: {
      email: user.email,
      name: user.name,
      token: resetToken
    }
  })
  
  return { status: 200, body: { message: 'If the email exists, reset link sent' } }
}
```

### Two-Factor Authentication

```javascript
// steps/api/auth/enable-2fa.step.js
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')

exports.config = {
  type: 'api',
  method: 'POST',
  path: '/auth/2fa/enable',
  middleware: ['authMiddleware']
}

exports.handler = async (req, { state }) => {
  const userId = req.user.id
  
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `YourApp (${req.user.email})`
  })
  
  // Store temporarily
  await state.set('2fa_temp', userId, secret.base32, 600) // 10 min
  
  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url)
  
  return {
    status: 200,
    body: {
      secret: secret.base32,
      qrCode
    }
  }
}
```

## Session Management

### Active Sessions List
```javascript
// steps/api/auth/sessions.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/auth/sessions',
  middleware: ['authMiddleware']
}

exports.handler = async (req, { state }) => {
  const sessions = await state.getGroup(`sessions:${req.user.id}`) || []
  
  return {
    status: 200,
    body: {
      sessions: sessions.map(s => ({
        id: s.id,
        device: s.userAgent,
        ip: s.ip,
        location: s.location,
        lastActive: s.lastActive,
        current: s.id === req.sessionId
      }))
    }
  }
}
```

### Revoke Session
```javascript
// steps/api/auth/logout-device.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/auth/sessions/:sessionId/revoke',
  middleware: ['authMiddleware']
}

exports.handler = async (req, { state }) => {
  const { sessionId } = req.pathParams
  
  // Delete specific session
  await state.delete('sessions', sessionId)
  await state.delete(`sessions:${req.user.id}`, sessionId)
  
  return { status: 200, body: { message: 'Session revoked' } }
}
```

## Security Best Practices

### 1. Rate Limit Auth Endpoints
```javascript
exports.config = {
  type: 'api',
  path: '/auth/login',
  middleware: ['rateLimiter'] // Max 5 attempts per 15 min
}
```

### 2. Log Security Events
```javascript
// In login handler
if (!valid) {
  await emit({
    topic: 'security.login.failed',
    data: { email, ip: req.ip, timestamp: new Date() }
  })
}
```

### 3. Use Secure Headers
```javascript
exports.securityHeaders = async (req, ctx, next) => {
  const response = await next()
  return {
    ...response,
    headers: {
      ...response.headers,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000'
    }
  }
}
```

## Testing Authentication

```bash
# Register
curl -X POST http://localhost:5173/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secure123", "name": "Test User"}'

# Login
curl -X POST http://localhost:5173/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secure123"}'

# Use token
curl http://localhost:5173/protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

- Add social logins: Google, Facebook, GitHub
- Implement RBAC: See `add-authorization.md`
- Add API keys: See `api-key-management.md`
- Security audit: See `security-checklist.md`