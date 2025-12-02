import { z } from 'zod'

export const baseEventSchema = z
  .object({
    testCaseId: z.string(),
    failUntilAttempt: z.number().nonnegative().optional(),
    sequence: z.number().int().optional(),
    label: z.string().optional(),
  })
  .passthrough()

export type BullMQEventInput = z.infer<typeof baseEventSchema>
