import { StateStreamConfig } from 'motia'
import { z } from 'zod'

export const config: StateStreamConfig = {
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
     * There are two storage types: state and custom
     * State will use the state manager to store the data.
     *
     * Custom will use a custom storage, you need to implement
     * the StateStream class.
     */
    storageType: 'state',

    /**
     * When storageType is state, this will be the property saved
     * to the state, similarly to using:
     *
     * context.state.set(traceId, 'message', { ...data })
     */
    property: 'message',
  },
}
