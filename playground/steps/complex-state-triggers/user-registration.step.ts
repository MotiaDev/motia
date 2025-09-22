import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'UserRegistration',
  description: 'API endpoint to register a new user with initial profile data',
  triggers: [{ type: 'api', path: '/complex/register', method: 'POST' }],
  input: z.object({
    email: z.string().email(),
    name: z.string().min(2),
    initialScore: z.number().default(0),
    tier: z.enum(['bronze', 'silver', 'gold']).default('bronze'),
  }),
  responseSchema: {
    201: z.object({
      message: z.string(),
      userId: z.string(),
      email: z.string(),
      tier: z.string(),
    }),
    400: z.object({ error: z.string() }),
  },
  emits: [],
  flows: ['user-lifecycle'],
  virtualEmits: [
    { topic: 'user.profile', label: 'User profile created' },
    { topic: 'user.score', label: 'Initial score set' },
    { topic: 'user.tier', label: 'User tier set' },
    { topic: 'user.status', label: 'User status set' },
    { topic: 'user.notifications', label: 'Notifications initialized' },
  ],
}

export const handler: Handlers['UserRegistration'] = async (req, { state, logger, traceId }) => {
  const { email, name, initialScore, tier } = req.body

  try {
    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`


    // Set initial user state - this will trigger multiple state monitors
    await state.set(userId, 'user.profile', {
      email,
      name,
      tier,
      registeredAt: new Date().toISOString(),
      status: 'pending_verification',
    })

    await state.set(userId, 'user.score', initialScore)
    await state.set(userId, 'user.tier', tier)
    await state.set(userId, 'user.status', 'pending_verification')
    await state.set(userId, 'user.verification.attempts', 0)
    await state.set(userId, 'user.achievements', [])
    await state.set(userId, 'user.notifications', [])


    return {
      status: 201,
      body: {
        message: 'User registered successfully',
        userId,
        email,
        tier,
      },
    }
  } catch (error: unknown) {
    return {
      status: 400,
      body: { error: 'Registration failed' },
    }
  }
}
