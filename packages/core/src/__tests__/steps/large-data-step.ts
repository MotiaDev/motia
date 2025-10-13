// Minimal step that returns the size of the incoming data.
// Types are intentionally loose; node-runner runs with transpileOnly.
export const config = {
  type: 'api',
  name: 'large-data-step',
  emits: [],
  path: '/large',
  method: 'POST',
}

export const handler = async (data: unknown) => {
  if (typeof data === 'string') return data.length
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

