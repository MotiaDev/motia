import type { ApiRequest, Handlers, StepConfig, TriggerCondition } from '@iii-dev/motia'
import { z } from 'zod'

const isBusinessHours: TriggerCondition = (input, ctx) => {
  const hour = new Date().getHours()
  return hour >= 9 && hour < 17
}

const isHighValue: TriggerCondition<{ amount: number; description: string }> = (input, ctx) => {
  if (!input || typeof input !== 'object') return false
  return (input as { amount: number }).amount > 1000
}

const isVerifiedUser: TriggerCondition<{ user: { verified: boolean }; amount: number; description: string }> = (
  input,
  ctx,
) => {
  if (ctx.trigger.type !== 'api' || !input) return false
  const apiInput = input as ApiRequest<{ user: { verified: boolean }; amount: number; description: string }>
  return apiInput.body.user.verified === true
}

export const config = {
  name: 'MultiTriggerExample',
  description: 'Demonstrates multi-trigger with conditions - processes orders via event, API, or cron',
  flows: ['multi-trigger-demo'],
  triggers: [
    {
      type: 'event',
      topic: 'order.created',
      input: z.object({
        amount: z.number(),
        description: z.string(),
      }),
      condition: (input, ctx) => {
        return isHighValue(input, ctx)
      },
    },
    {
      type: 'api',
      method: 'POST',
      path: '/orders/manual',
      bodySchema: z.object({
        user: z.object({
          verified: z.boolean(),
        }),
        amount: z.number(),
        description: z.string(),
      }),
      responseSchema: {
        200: z.object({
          message: z.string(),
          orderId: z.string(),
          processedBy: z.string(),
        }),
        403: z.object({
          error: z.string(),
        }),
      },
      condition: isVerifiedUser,
    },
    {
      type: 'cron',
      expression: '* * * * *', //
    },
  ],
  emits: ['order.processed'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, ctx): Promise<any> => {
  const { logger, emit, state, trigger } = ctx

  logger.info('Processing order')

  const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(7)}`

  if (trigger.type === 'api') {
    const request = input as any
    if (!request) return
    const body = request.body

    logger.info('Processing manual order via API', {
      amount: body.amount,
      user: body.user,
    })

    await state.set('orders', orderId, {
      id: orderId,
      amount: body.amount,
      description: body.description,
      source: 'manual-api',
      createdAt: new Date().toISOString(),
    })

    await emit({
      topic: 'order.processed',
      data: {
        orderId,
        amount: body.amount,
        source: 'manual-api',
      },
    })

    return {
      status: 200,
      body: {
        message: 'Order processed successfully',
        orderId,
        processedBy: 'manual-api',
      },
    }
  }

  if (trigger.type === 'event') {
    const eventData = input as { amount: number; description: string }

    logger.info('Processing order from event', {
      amount: eventData.amount,
      description: eventData.description,
    })

    await state.set('orders', orderId, {
      id: orderId,
      amount: eventData.amount,
      description: eventData.description,
      source: 'event',
      createdAt: new Date().toISOString(),
    })

    await emit({
      topic: 'order.processed',
      data: {
        orderId,
        amount: eventData.amount,
        source: 'event',
      },
    })
  }

  if (trigger.type === 'cron') {
    logger.info('Processing scheduled order batch')

    const pendingOrders = await state.getGroup<{ id: string; amount: number }>('pending-orders')

    for (const order of pendingOrders) {
      await emit({
        topic: 'order.processed',
        data: {
          orderId: order.id,
          amount: order.amount,
          source: 'cron-batch',
        },
      })
    }

    logger.info('Scheduled batch processing complete', {
      processedCount: pendingOrders.length,
    })
  }
}
