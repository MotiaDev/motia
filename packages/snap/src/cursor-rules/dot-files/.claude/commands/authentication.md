# Authentication Patterns

Implement secure authentication and authorization in Motia applications.

## Basic JWT Authentication

### 1. User Registration
```typescript
// steps/api/auth/register.step.ts
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain uppercase, lowercase, and number'),
  firstName: z.string().min(2),
  lastName: z.string().min(2)
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Register',
  method: 'POST',
  path: '/auth/register',
  bodySchema: RegisterSchema,
  responseSchema: {
    201: z.object({
      userId: z.string(),
      email: z.string(),
      message: z.string()
    }),
    409: z.object({ error: z.string() })
  },
  emits: ['user.registered', 'email.verification.send']
}

export const handler: Handlers['Register'] = async (req, { emit, state, logger }) => {
  const { email, password, firstName, lastName } = req.body
  
  // Check existing user
  const existing = await state.get('users', `email:${email}`)
  if (existing) {
    return { status: 409, body: { error: 'Email already registered' } }
  }
  
  // Create user
  const userId = crypto.randomUUID()
  const hashedPassword = await bcrypt.hash(password, 12)
  const verificationToken = crypto.randomBytes(32).toString('hex')
  
  const user = {
    id: userId,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    emailVerified: false,
    verificationToken,
    createdAt: new Date().toISOString(),
    roles: ['user']
  }
  
  // Store user
  await state.set('users', userId, user)
  await state.set('users', `email:${email}`, { userId })
  await state.set('verification', verificationToken, { userId }, 86400) // 24h TTL
  
  // Emit events
  await emit({
    topic: 'user.registered',
    data: { userId, email, firstName, lastName }
  })
  
  await emit({
    topic: 'email.verification.send',
    data: { email, token: verificationToken, firstName }
  })
  
  logger.info('User registered', { userId, email })
  
  return {
    status: 201,
    body: {
      userId,
      email,
      message: 'Registration successful. Please check your email to verify your account.'
    }
  }
}
```

### 2. Email Verification
```typescript
// steps/api/auth/verify-email.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'VerifyEmail',
  method: 'GET',
  path: '/auth/verify/:token',
  pathParams: z.object({
    token: z.string()
  }),
  responseSchema: {
    200: z.object({ message: z.string() }),
    400: z.object({ error: z.string() })
  },
  emits: ['user.verified']
}

export const handler: Handlers['VerifyEmail'] = async (req, { emit, state }) => {
  const { token } = req.pathParams
  
  // Get token data
  const tokenData = await state.get('verification', token)
  if (!tokenData) {
    return { status: 400, body: { error: 'Invalid or expired token' } }
  }
  
  // Update user
  const user = await state.get('users', tokenData.userId)
  user.emailVerified = true
  user.verifiedAt = new Date().toISOString()
  delete user.verificationToken
  
  await state.set('users', tokenData.userId, user)
  await state.delete('verification', token)
  
  // Emit verification event
  await emit({
    topic: 'user.verified',
    data: { userId: user.id, email: user.email }
  })
  
  return {
    status: 200,
    body: { message: 'Email verified successfully. You can now login.' }
  }
}
```

### 3. Login with JWT
```typescript
// steps/api/auth/login.step.ts
import jwt from 'jsonwebtoken'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Login',
  method: 'POST',
  path: '/auth/login',
  bodySchema: z.object({
    email: z.string().email(),
    password: z.string()
  }),
  responseSchema: {
    200: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        roles: z.array(z.string())
      })
    }),
    401: z.object({ error: z.string() })
  },
  emits: ['auth.login.success', 'auth.login.failed']
}

export const handler: Handlers['Login'] = async (req, { emit, state, logger }) => {
  const { email, password } = req.body
  
  // Get user
  const userRef = await state.get('users', `email:${email}`)
  if (!userRef) {
    await emit({ topic: 'auth.login.failed', data: { email, reason: 'user_not_found' } })
    return { status: 401, body: { error: 'Invalid credentials' } }
  }
  
  const user = await state.get('users', userRef.userId)
  
  // Check email verified
  if (!user.emailVerified) {
    return { status: 401, body: { error: 'Please verify your email first' } }
  }
  
  // Verify password
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    await emit({ topic: 'auth.login.failed', data: { email, reason: 'invalid_password' } })
    return { status: 401, body: { error: 'Invalid credentials' } }
  }
  
  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, roles: user.roles },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  
  // Store refresh token
  await state.set('refresh_tokens', refreshToken, { 
    userId: user.id, 
    createdAt: new Date().toISOString() 
  }, 604800) // 7 days TTL
  
  // Update last login
  user.lastLoginAt = new Date().toISOString()
  await state.set('users', user.id, user)
  
  // Emit success
  await emit({ 
    topic: 'auth.login.success', 
    data: { userId: user.id, email, timestamp: new Date().toISOString() } 
  })
  
  const { password: _, verificationToken: __, ...safeUser } = user
  
  return {
    status: 200,
    body: {
      accessToken,
      refreshToken,
      user: safeUser
    }
  }
}
```

### 4. Auth Middleware
```typescript
// steps/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken'

export const authMiddleware = async (req: any, ctx: any, next: any) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { status: 401, body: { error: 'No token provided' } }
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Check if user still exists
    const user = await ctx.state.get('users', decoded.userId)
    if (!user) {
      return { status: 401, body: { error: 'User not found' } }
    }
    
    // Check if user is active
    if (user.status === 'suspended' || user.status === 'deleted') {
      return { status: 403, body: { error: 'Account suspended' } }
    }
    
    // Add user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles
    }
    
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { status: 401, body: { error: 'Token expired' } }
    }
    return { status: 401, body: { error: 'Invalid token' } }
  }
}

// Role-based middleware
export const requireRole = (roles: string[]) => {
  return async (req: any, ctx: any, next: any) => {
    if (!req.user) {
      return { status: 401, body: { error: 'Unauthorized' } }
    }
    
    const hasRole = roles.some(role => req.user.roles.includes(role))
    if (!hasRole) {
      ctx.logger.warn('Access denied', { 
        userId: req.user.userId, 
        required: roles, 
        actual: req.user.roles 
      })
      return { status: 403, body: { error: 'Insufficient permissions' } }
    }
    
    return next()
  }
}
```

## Advanced Authentication

### OAuth2 Integration
```typescript
// steps/api/auth/oauth.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'OAuthCallback',
  method: 'GET',
  path: '/auth/oauth/:provider/callback',
  emits: ['user.oauth.login']
}

export const handler = async (req, { emit, state }) => {
  const { provider } = req.pathParams
  const { code } = req.queryParams
  
  // Exchange code for token
  const oauthToken = await exchangeCodeForToken(provider, code)
  
  // Get user info from provider
  const providerUser = await getOAuthUserInfo(provider, oauthToken)
  
  // Find or create user
  let user = await state.get('users', `oauth:${provider}:${providerUser.id}`)
  
  if (!user) {
    // Create new user from OAuth
    const userId = crypto.randomUUID()
    user = {
      id: userId,
      email: providerUser.email,
      firstName: providerUser.given_name,
      lastName: providerUser.family_name,
      emailVerified: true,
      oauthProviders: [{
        provider,
        providerId: providerUser.id,
        email: providerUser.email
      }],
      createdAt: new Date().toISOString(),
      roles: ['user']
    }
    
    await state.set('users', userId, user)
    await state.set('users', `oauth:${provider}:${providerUser.id}`, { userId })
    
    await emit({
      topic: 'user.oauth.login',
      data: { userId, provider, firstTime: true }
    })
  }
  
  // Generate tokens
  const tokens = generateTokens(user)
  
  // Redirect with tokens
  return {
    status: 302,
    headers: {
      Location: `${process.env.FRONTEND_URL}/auth/success?token=${tokens.accessToken}`
    }
  }
}
```

### Two-Factor Authentication
```typescript
// steps/api/auth/2fa-setup.step.ts
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Setup2FA',
  method: 'POST',
  path: '/auth/2fa/setup',
  middleware: [authMiddleware],
  responseSchema: {
    200: z.object({
      secret: z.string(),
      qrCode: z.string()
    })
  }
}

export const handler = async (req, { state }) => {
  const userId = req.user.userId
  const user = await state.get('users', userId)
  
  // Generate secret
  const secret = speakeasy.generateSecret({
    length: 32,
    name: `Motia (${user.email})`,
    issuer: 'Motia'
  })
  
  // Store secret temporarily
  await state.set('2fa_setup', userId, {
    secret: secret.base32,
    tempSecret: true
  }, 600) // 10 min TTL
  
  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!)
  
  return {
    status: 200,
    body: {
      secret: secret.base32,
      qrCode
    }
  }
}
```

### Session Management
```typescript
// steps/api/auth/sessions.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetSessions',
  method: 'GET',
  path: '/auth/sessions',
  middleware: [authMiddleware],
  responseSchema: {
    200: z.object({
      sessions: z.array(z.object({
        id: z.string(),
        device: z.string(),
        lastActive: z.string(),
        current: z.boolean()
      }))
    })
  }
}

export const handler = async (req, { state }) => {
  const userId = req.user.userId
  const currentSessionId = req.sessionId
  
  // Get all user sessions
  const sessions = await state.getGroup(`sessions:${userId}`) || []
  
  const sessionList = sessions.map(session => ({
    id: session.id,
    device: session.userAgent,
    lastActive: session.lastActive,
    current: session.id === currentSessionId
  }))
  
  return {
    status: 200,
    body: { sessions: sessionList }
  }
}
```

## Security Best Practices

### Password Reset Flow
```typescript
// 1. Request reset
await emit({
  topic: 'password.reset.requested',
  data: { email, token, ip: req.ip }
})

// 2. Validate token
const resetData = await state.get('password_reset', token)
if (!resetData || resetData.used) {
  return { status: 400, body: { error: 'Invalid token' } }
}

// 3. Update password
const hashedPassword = await bcrypt.hash(newPassword, 12)
user.password = hashedPassword
user.passwordChangedAt = new Date().toISOString()

// 4. Invalidate all sessions
await state.delete(`sessions:${userId}`)
```

### Rate Limiting Auth Endpoints
```typescript
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || ''}`
})

// Apply to login/register
middleware: [authRateLimiter]
```

### Audit Logging
```typescript
// Log all auth events
await emit({
  topic: 'audit.log',
  data: {
    action: 'login',
    userId: user.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    success: true
  }
})
```