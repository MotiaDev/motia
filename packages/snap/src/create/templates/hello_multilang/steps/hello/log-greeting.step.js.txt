import { z } from 'zod';

const inputSchema = z.object({
  requestId: z.string(),
  greeting: z.string(),
  processedBy: z.string()
});

export const config = {
  name: 'LogGreeting',
  type: 'event',
  description: 'Logs the processed greeting (JavaScript)',
  subscribes: ['greeting-processed'],
  emits: [],
  flows: ['hello-world-flow'],
  input: inputSchema
};

export const handler = async (input, { logger, state }) => {
  const { requestId, greeting, processedBy } = input;
  
  logger.info('Logging greeting (JavaScript)', { requestId, processedBy });
  
  // Retrieve the stored greeting from state
  const storedData = await state.get('greetings', requestId);
  
  logger.info('Greeting workflow complete (JavaScript)', { 
    requestId,
    greeting,
    processedBy,
    storedAt: storedData?.processedAt,
    workflowComplete: true
  });
};
