---
title: Dynamic Sentiment Analysis
---

Sometimes you don't just want a **simple** "prompt => response." Instead, you want the LLM to decide how to proceed. Below is a minimal example that:

1. Receives user input via `POST /api/analyze-sentiment`
2. Calls OpenAI and **instructs** the LLM to return JSON with a `sentiment` field
3. Parses that JSON and **emits** different events depending on whether `sentiment` is `"positive"` or `"negative"` (or anything else)
4. Two specialized responders handle each sentiment separately

---

## The Steps

<Folder name="steps" defaultOpen>
  <File name="analyzeSentimentApi.step.ts" />
  <File name="openAiAnalyzeSentiment.step.ts" />
  <File name="handlePositive.step.ts" />
  <File name="handleNegative.step.ts" />
</Folder>

<Tabs items={['analyzeSentimentApi', 'openAiAnalyzeSentiment', 'handlePositive', 'handleNegative']}>
  <Tab value="analyzeSentimentApi">
    ```ts
    // Receives user text, emits "openai.analyzeSentimentRequest".
    import { ApiRouteConfig, StepHandler } from 'motia'
    import { z } from 'zod'

    export const config: ApiRouteConfig = {
      type: 'api',
      name: 'Analyze Sentiment (API)',
      path: '/api/analyze-sentiment',
      method: 'POST',
      emits: ['openai.analyzeSentimentRequest'],
      bodySchema: z.object({
        text: z.string().min(1, 'text is required'),
      }),
      flows: ['sentiment-demo'],
    }

    export const handler: StepHandler<typeof config> = async (req, { emit, logger }) => {
      const { text } = req.body

      logger.info('[AnalyzeSentimentAPI] Received text', { text })

      // Emit an event to call OpenAI
      await emit({
        topic: 'openai.analyzeSentimentRequest',
        data: { text },
      })

      // Return right away
      return {
        status: 200,
        body: { status: 'Accepted', message: 'Your text is being analyzed' },
      }
    }
    ```

  </Tab>
  <Tab value="openAiAnalyzeSentiment">
    ```ts
    // Calls OpenAI, instructing it to ONLY return JSON like {"sentiment":"positive","analysis":"..."}
    import { EventConfig, StepHandler } from 'motia'
    import { z } from 'zod'
    import { OpenAI } from 'openai'

    // 1) Create an OpenAI client (newer syntax)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // 2) Define the input schema for your step
    const inputSchema = z.object({
      text: z.string(),
    })

    export const config: EventConfig<typeof inputSchema> = {
      type: 'event',
      name: 'OpenAI Sentiment Analyzer',
      subscribes: ['openai.analyzeSentimentRequest'],
      // We'll emit different events: "openai.positiveSentiment" or "openai.negativeSentiment"
      emits: ['openai.positiveSentiment', 'openai.negativeSentiment'],
      input: inputSchema,
      flows: ['sentiment-demo'],
    }

    // 3) Provide the code that runs on each event
    export const handler: StepHandler<typeof config> = async (input, { emit, logger }) => {
      logger.info('[OpenAI Sentiment Analyzer] Prompting OpenAI...', { text: input.text })

      try {
        // We'll ask the model to ONLY return JSON with a "sentiment" field
        const systemPrompt =
          'You are an assistant that returns only JSON: {"sentiment":"positive|negative","analysis":"..."}'
        const userPrompt = `Analyze the sentiment of this text: "${input.text}". Return JSON with keys "sentiment" and "analysis".`

        // 4) Use the new openai syntax:
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        })

        // 5) Log and parse the response
        const content = response.choices[0]?.message?.content || ''
        logger.info('[OpenAI Sentiment Analyzer] Raw response', { content })

        let parsed: { sentiment?: string; analysis?: string } = {}
        try {
          parsed = JSON.parse(content.trim())
        } catch (err) {
          logger.error('[OpenAI Sentiment Analyzer] Unable to parse JSON', { error: err })
          // If it's not JSON, we bail or handle differently
          return
        }

        // 6) Decide how to route the event
        if (parsed.sentiment?.toLowerCase() === 'positive') {
          await emit({
            topic: 'openai.positiveSentiment',
            data: { ...parsed },
          })
        } else {
          // default to negative
          await emit({
            topic: 'openai.negativeSentiment',
            data: { ...parsed },
          })
        }
      } catch (err: any) {
        logger.error('[OpenAI Sentiment Analyzer] Error calling OpenAI', { error: err.message })
      }
    }
    ```

  </Tab>
  <Tab value="handlePositive">
    ```ts
    // Handles "openai.positiveSentiment"
    import { EventConfig, StepHandler } from 'motia'
    import { z } from 'zod'

    const positiveSchema = z.object({
      sentiment: z.string(),
      analysis: z.string().optional(),
    })

    export const config: EventConfig<typeof positiveSchema> = {
      type: 'event',
      name: 'Positive Sentiment Responder',
      subscribes: ['openai.positiveSentiment'],
      emits: [],
      input: positiveSchema,
      flows: ['sentiment-demo'],
    }

    export const handler: StepHandler<typeof config> = async (input, { logger }) => {
      logger.info('[Positive Responder] The sentiment is positive!', { analysis: input.analysis })
      // Maybe notify a Slack channel: "All good vibes here!"
    }
    ```

  </Tab>
  <Tab value="handleNegative">
    ```ts
    // Handles "openai.negativeSentiment"
    import { EventConfig, StepHandler } from 'motia'
    import { z } from 'zod'

    const negativeSchema = z.object({
      sentiment: z.string(),
      analysis: z.string().optional(),
    })

    export const config: EventConfig<typeof negativeSchema> = {
      type: 'event',
      name: 'Negative Sentiment Responder',
      subscribes: ['openai.negativeSentiment'],
      emits: [],
      input: negativeSchema,
      flows: ['sentiment-demo'],
    }

    export const handler: StepHandler<typeof config> = async (input, { logger }) => {
      logger.info('[Negative Responder] The sentiment is negative or unknown.', { analysis: input.analysis })
      // Could escalate to a service, or respond gently, etc.
    }
    ```

  </Tab>
</Tabs>

---

## Visual Overview

Here's how the events chain together:

<div className="my-8">![Flow: Sentiment Analysis Steps](./../img/sentiment-analyzer.png)</div>

1. **Analyze Sentiment (API)** → emits `openai.analyzeSentimentRequest`
2. **OpenAI Sentiment Analyzer** → calls OpenAI, parses JSON →
   - If `sentiment: "positive"` → emits `openai.positiveSentiment`
   - Else → emits `openai.negativeSentiment`
3. **Positive Sentiment Responder** or **Negative Sentiment Responder**

---

## Trying It Out

<Steps>

### Install Dependencies

```shell
pnpm install motia openai
```

### Create Project Structure

<Folder name="steps" defaultOpen>
  <File name="analyzeSentimentApi.step.ts" />
  <File name="openAiAnalyzeSentiment.step.ts" />
  <File name="handlePositive.step.ts" />
  <File name="handleNegative.step.ts" />
</Folder>

### Set Environment Variables

```shell
export OPENAI_API_KEY="sk-..."
```

### Run the Project

```shell
pnpm motia dev
```

### Test the API

```shell
curl -X POST http://localhost:3000/api/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text":"I absolutely love this new device!"}'
```

Check your logs - you should see either the `[Positive Responder]` or `[Negative Responder]` step firing, depending on the LLM's JSON output.

### Extend Further

Here are some ways to build upon this example:

- Tweak the system instructions to force certain outputs or include more details
- Create more specialized responders (like "neutralSentiment")
- Integrate a notification step (Slack, database, etc.)

</Steps>

Try it out, see the branching logic in action, and enjoy skipping all the boring boilerplate!
