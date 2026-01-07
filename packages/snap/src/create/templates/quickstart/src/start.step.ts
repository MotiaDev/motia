import type { Handlers } from '@motiadev/core'
import type { ApiRouteConfig } from 'motia'

export const config: ApiRouteConfig = {
  // Required fields for API routes
  type: 'api',
  name: 'GetHello',
  path: '/hello',
  method: 'GET',
  emits: ['hello'],

  // Some optional fields. Full list here: https://www.motia.dev/docs/api-reference#apirouteconfig
  description: 'Emits a hello event that other steps can listen to',
  flows: ['hello'],
  virtualEmits: ['notification.sent'], // These are visual indicators in Workbench only.
  virtualSubscribes: [], // They don't have any impact on code execution.
}

export const handler: Handlers['PostHello'] = async (req, { emit, logger }) => {
  emit({
    topic: 'hello',
    data: {
      extra: `Pass any data to subscribing events with the data property. 
Use primitive types and simple objects, and don't pass functions.
This data will be serialized and passed to JavaScript or Python handler functions.`,
    },
  })
}
