// import { z } from 'zod'
// import { StreamConfig, FlowContext, UngroupedStateObjectStream } from 'motia'

// export const config: StreamConfig = {
//   name: 'openai',
//   type: 'object',
//   schema: z.object({ message: z.string() }),
// }

// type OpenAIMessage = z.infer<typeof config.schema>

// class OpenAIStream extends UngroupedStateObjectStream<OpenAIMessage> {
//   constructor(context: FlowContext) {
//     super(context, 'message')
//   }
// }

// export default OpenAIStream
