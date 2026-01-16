import type { Handlers, StepConfig } from '@iii-dev/motia'
import { z } from 'zod'
import { todoSchema } from './create-todo.step'

export const config = {
  name: 'UpdateTodo',
  description: 'Update an existing todo item',
  flows: ['todo-app'],
  triggers: [
    {
      type: 'api',
      method: 'PUT',
      path: '/todo/:todoId',
      bodySchema: z.object({
        description: z.string().optional(),
        dueDate: z.string().optional(),
        checked: z.boolean().optional(),
      }),
      responseSchema: {
        200: todoSchema,
        404: z.object({ error: z.string() }),
      },
    },
  ],
  emits: [],
  virtualSubscribes: ['todo-created'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (request, { logger, streams }) => {
  const { todoId } = request.pathParams || {}
  const body = request.body || {}

  logger.info('Updating todo', { todoId, body })

  const existingTodo = await streams.todo.get('inbox', todoId)

  if (!existingTodo) {
    logger.warn('Todo not found', { todoId })

    return {
      status: 404,
      body: { error: `Todo with id ${todoId} not found` },
    }
  }

  const updatedTodo = { ...existingTodo }

  if (body.checked !== undefined) {
    updatedTodo.completedAt = body.checked ? new Date().toISOString() : undefined
  }

  if (body.description !== undefined) {
    updatedTodo.description = body.description
  }

  if (body.dueDate !== undefined) {
    updatedTodo.dueDate = body.dueDate
  }

  const result = await streams.todo.set('inbox', todoId, updatedTodo)

  logger.info('Todo updated successfully', { todoId })

  return { status: 200, body: result }
}
