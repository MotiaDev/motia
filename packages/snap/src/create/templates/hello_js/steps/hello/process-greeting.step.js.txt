import { z } from 'zod';

const inputSchema = z.object({
  timestamp: z.string(),
  appName: z.string(),
  greetingPrefix: z.string(),
  requestId: z.string()
});

export const config = {
  name: 'ProcessGreeting',
  type: 'event',
  description: 'Processes greeting in the background',
  subscribes: ['process-greeting'],
  emits: [],
  flows: ['hello-world-flow'],
  input: inputSchema
};

export const handler = async (input, { logger, state }) => {
  const { timestamp, appName, greetingPrefix, requestId } = input;
  
  logger.info('Processing greeting', { requestId, appName });
  
  const greeting = `${greetingPrefix} ${appName}!`;

  // Store result in state (demonstrates state usage)
  // Note: The state.set method takes (groupId, key, value)
  await state.set('greetings', requestId, {
    greeting,
    processedAt: new Date().toISOString(),
    originalTimestamp: timestamp
  });

  logger.info('Greeting processed successfully', { 
    requestId, 
    greeting,
    storedInState: true 
  });
};
