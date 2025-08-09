import { NoopConfig } from 'motia'

/**
 * NOOP Steps don"t hold any logic in code. They are a way
 * to create custom nodes for flows on the workbench and
 * represent external actions such as human in the loop.
 * 
 * In this case, we are using it to add a custom UI 
 * node with a play button to allow you to trigger the first 
 * API step in this flow.
 *
 * For more information, refer to the documentation: https://www.motia.dev/docs/workbench/noop-steps
 */
export const config: NoopConfig = {
  type: 'noop',
  name: 'Flow Starter',
  description: 'Start the default flow',

  /**
   * Used mostly to connect nodes that emit to this
   */
  virtualSubscribes: [],

  /**
   * Used mostly to connect nodes that subscribes to this
   */
  virtualEmits: ['/default'],

  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['default'],
}
