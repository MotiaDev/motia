---
title: Streams
description: Motia Streams are a way to quickly push updates from your asynchronous workflows to the client without having to implement any sort of polling processes.
---

## How it works

You first need to define a stream in your project

### Defining a stream

To be able to use Motia Sockets, you need to define a stream

Create a file called `open-ai.stream.ts` under `steps/` folder

```typescript
import { StreamConfig } from 'motia'
import { z } from 'zod'

export const config: StreamConfig = {
  /**
   * This will be converted in the property on the FlowContext:
   *
   * context.streams.openai
   */
  name: 'openai',
  /**
   * Schema is important to define the type of the stream, the API
   * generated to interact with this stream will have the structure defined here
   */
  schema: z.object({ message: z.string() }),

  /**
   * Base config is used to configure the stream
   */
  baseConfig: {
    /**
     * There are two storage types: default and custom
     * Default will use the default storage to store the data.
     *
     * Custom will use a custom storage, you need to implement
     * the StateStream class.
     */
    storageType: 'default',
  },
}
```

Once a stream is created, it should be immediately available in FlowContext (make sure to have motia running on the project)

Then you can simply create records using the streams API in your step

```typescript
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'OpenAiApi',
  description: 'Call OpenAI',
  path: '/open-ai',
  method: 'POST',
  emits: ['openai-prompt'],
  flows: ['open-ai'],
  bodySchema: z.object({ message: z.string({ description: 'The message to send to OpenAI' }) }),
  responseSchema: {
    200: z.object({ message: z.string({ description: 'The message from OpenAI' }) }),
  },
}

export const handler: Handlers['OpenAiApi'] = async (req, { traceId, logger, emit, streams }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', { message: req.body.message })

  /**
   * This creates a record with empty message string to be populated in the next step
   */
  const result = await streams.openai.set(traceId, 'message', { message: '' })

  await emit({
    topic: 'openai-prompt',
    data: { message: req.body.message },
  })

  return { status: 200, body: result }
}
```

The previous step just prepares a message to be created by Open AI via OpenAI SDK stream, which will be populated in the next step

```typescript
import { EventConfig, Handlers } from 'motia'
import { OpenAI } from 'openai'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'CallOpenAi',
  description: 'Call OpenAI',
  subscribes: ['openai-prompt'],
  emits: [],
  input: z.object({
    message: z.string({ description: 'The message to send to OpenAI' }),
  }),
  flows: ['open-ai'],
}

export const handler: Handlers['CallOpenAi'] = async (input, context) => {
  const { logger, traceId } = context
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  logger.info('[Call OpenAI] Received callOpenAi event', input)

  const result = await openai.chat.completions.create({
    messages: [{ role: 'system', content: input.message }],
    model: 'gpt-4o-mini',
    stream: true,
  })

  const messages: string[] = []

  for await (const chunk of result) {
    messages.push(chunk.choices[0].delta.content ?? '')

    /**
     * Now we're populating a previously created message with the streamed data from OpenAI
     */
    await context.streams.openai.set(traceId, 'message', {
      message: messages.join(''),
    })
  }

  logger.info('[Call OpenAI] OpenAI response', result)
}
```

## Testing Streams in Workbench

We know testing real time events is not easy as a backend developer, so we've added a way to test streams in the Workbench.

Here are the steps to test streams in the Workbench:

1. The API Step that provides a stream item should return the object

```typescript
export const handler: Handlers['OpenAiApi'] = async (req, { traceId, logger, emit, streams }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', { message: req.body.message })

  /**
   * This creates a record with empty message string to be populated in the next step
   */
  const result = await streams.openai.set(traceId, 'message', { message: '' })

  await emit({
    topic: 'openai-prompt',
    data: { message: req.body.message },
  })

  /**
   * Return the entire object received from the create method
   */
  return { status: 200, body: result }
}
```

2. Navigate to [http://localhost:3000/endpoints](http://localhost:3000/endpoints) in your Workbench
3. Open up your endpoint and click on the `Test` button
4. The result will automatically be streamed from the server to the client streaming it's state real-time.

![Stream Test in Workbench](./../img/streams-test-workbench.gif)

## Consuming stream on the browser

```
npm install @motiadev/stream-client-react
```

Then add the provider to the root of your project

```tsx
<MotiaStreamProvider address="ws://localhost:3000">...</MotiaStreamProvider>
```

then on your component or hook, just use

```typescript
const messageId = '' // get the id back from the API call

// data below will be updated whenever it's updated in the server
const { data } = useStreamItem({
  streamName: 'openai',
  groupId: messageId,
  id: 'message',
})
```
