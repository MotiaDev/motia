import type { StreamConfig } from 'motia'
import { z } from 'zod'

export const messageSchema = z.object({
  message: z.string(),
  from: z.enum(['user', 'assistant']),
  status: z.enum(['created', 'pending', 'completed']),
})

export type Message = z.infer<typeof messageSchema>

export const config: StreamConfig = {
  name: 'message',
  schema: messageSchema,
  baseConfig: { storageType: 'default' },
}
