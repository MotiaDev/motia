# Reactive Steps

This proposal simplifies the way steps are defined and triggered. Today there are 4 types of steps, one is
a noop step, which never triggers,
Other 3 types of steps are:

- API Step
- Event Step
- Cron Step

They're all triggered by something, API Step is triggered by an HTTP Request, Event Step is triggered by Emits from
another step and Cron Step is triggered by a CRON expression regularly.

What we want to promose, is to streamling a Step to be just a Step, not a API Step or so. And inside the step,
developers can define what type of triggers they want to use, in a single Step they could use two HTTP triggers, like two
routes calling the same step, typically used when they're moving the API to a new endpoint but don't want to
have breaking changes.

This enables new types of triggers, like State changes or even adding conditions to trigger the Step only
when the condition criteria is met or Point-in-time triggers.

We'll remove the `type` property from the StepConfig, and instead use the `trigger` property to define the trigger.

Here's an example:

## Event Step

```typescript
import { StepConfig } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'OpenAI Model',
  description: 'Executes on a player move when AI Model is OpenAI',

  trigger: {
    type: 'event',
    subscribes: ['player-move'],
    input: z.object({
      gameId: z.string({ description: 'The ID of the game' }),
      fenBefore: z.string({ description: 'The FEN of the game before the move' }),
      ai: z.object({
        model: z.string({ description: 'The model of the AI' }),
      }),
    }),
    condition: input.get('ai.model').eq('open-ai'),
  },

  flows: ['chess'],
  emits: ['topic'],
}
```

## API Step

```typescript
import { StepConfig } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'ApiTrigger',
  description: 'basic-tutorial api trigger',
  trigger: {
    type: 'api',
    method: 'POST',
    path: '/basic-tutorial',
    bodySchema: z.object({
      pet: z.object({
        name: z.string(),
        photoUrl: z.string(),
      }),
      foodOrder: z
        .object({
          id: z.string(),
          quantity: z.number(),
        })
        .optional(),
    }),
    responseSchema: {
      200: petSchema,
    },
  },

  flows: ['chess'],
  emits: ['topic'],
}
```

## Cron Step

```typescript
import { StepConfig } from 'motia'

export const config: StepConfig = {
  name: 'CronTrigger',
  description: 'basic-tutorial cron trigger',
  trigger: {
    type: 'cron',
    cron: '* * * * *',
  },

  flows: ['chess'],
  emits: ['topic'],
}
```
