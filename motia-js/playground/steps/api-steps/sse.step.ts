import { type Handlers, http, type StepConfig } from 'motia'

export const config = {
  name: "SSE Example",
  description: "Accepts form-data and streams back random items as SSE",
  flows: ["sse-example"],
  triggers: [http("POST", "/sse")],
  enqueues: [],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async ({ request, response }, { logger }) => {
  logger.info('FormData received', { headers: request.headers })
  response.status(200)
  response.headers({ 
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })
  logger.info('Headers set', { headers: response.headers })

  const responses: string[] = []

  for await (const chunk of request.requestBody.stream) {
    responses.push(Buffer.from(chunk).toString('binary'))
  }

  const parts: Record<string, string> = {}
  
  responses
    .filter(s => typeof s === 'string' && s.trim().length > 0)
    .forEach((s) => {
      const pairs = s.split('&')
      for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key) {
          parts[decodeURIComponent(key)] = value ? decodeURIComponent(value) : ''
        }
      }
    })

  const items = generateRandomItems(parts)

  for (const item of items) {
    response.stream.write(`event: item\ndata: ${JSON.stringify(item)}\n\n`)
    await sleep(300 + Math.random() * 700)
  }

  response.stream.write(`event: done\ndata: ${JSON.stringify({ total: items.length })}\n\n`)
  response.close()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type FormField = { name: string; value: string }

function generateRandomItems(parts: Record<string, string>) {
  const fields: FormField[] = Object.entries(parts).map(([name, value]) => ({ name, value }))
  const count = 5 + Math.floor(Math.random() * 6)
  const adjectives = ['swift', 'lazy', 'bold', 'calm', 'fierce', 'gentle', 'sharp', 'wild']
  const nouns = ['falcon', 'river', 'mountain', 'crystal', 'thunder', 'shadow', 'ember', 'frost']

  return Array.from({ length: count }, (_, i) => ({
    id: `item-${Date.now()}-${i}`,
    label: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
    score: Math.round(Math.random() * 100),
    source: fields.length > 0 ? fields[i % fields.length] : null,
  }))
}