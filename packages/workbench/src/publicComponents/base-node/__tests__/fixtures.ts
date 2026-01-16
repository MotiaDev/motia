import type { JSONSchema7 } from 'json-schema'

export const mockApiStepConfig = {
  type: 'api',
  path: '/test',
  method: 'POST',
  bodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name'],
  } as JSONSchema7,
}

export const mockApiStepConfigGet = {
  type: 'api',
  path: '/api/users',
  method: 'GET',
  bodySchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  } as JSONSchema7,
}

export const mockEventStepConfig = {
  type: 'event',
  subscribes: ['test.event'] as string[],
  bodySchema: {
    type: 'object',
    properties: {
      data: { type: 'string' },
    },
  } as JSONSchema7,
}

export const mockCronStepConfig = {
  type: 'cron',
  cron: '* * * * *',
}

export const mockStepConfigNoSchema = {
  type: 'api',
  path: '/test',
  method: 'POST',
}
