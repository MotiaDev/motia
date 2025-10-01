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

This enabled new types of triggers, like State changes or even adding conditions to trigger the Step only
when the condition criteria is met.

We'll also remove the `type` property from the StepConfig, and instead use the `triggers` property to define the triggers.

Here's an example:

```typescript
import { StepConfig, triggers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'OpenAI Model',
  description: 'Executes on a player move when AI Model is OpenAI',
  triggers: [
    triggers.topic('player-move', {
      input: z.object({
        gameId: z.string({ description: 'The ID of the game' }),
        fenBefore: z.string({ description: 'The FEN of the game before the move' }),
        ai: z.object({
          model: z.string({ description: 'The model of the AI' }),
        }),
      }),
      condition: input.get('ai.model').eq('open-ai'),
    }),
    triggers.stateUpdate(state.get('ai.model').eq('open-ai')),
  ],

  flows: ['chess'],
  emits: ['test'],
}
```

## Conditions

Conditions are a configuration, we don't want to have condition execution to be an arbitrary function because it adds
complexity about what imports the file can have that may turn the arbitrary function heavyweight.

## More complexity to the Infrastructure

This proposal adds tons of complexity to the infrastructure, which lots of questions that need to be answered:

- How to scale state condition checkers?
- What if a single Step has 2 different triggers, like API and Event, what will be the input? How to we ensure the types are created?
- How to implement the condition checkers in Self-host deployment in a sacalable way?
- How to implement adapters for these triggers?

## Concerns to the development experience

Since Steps won't be connected directly because they can be triggered based on conditions in State changes and so,
it will become much harder to understand the flow of the application and side-effects can happen.
