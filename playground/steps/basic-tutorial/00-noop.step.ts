import { NoopConfig } from 'motia'

/**
 * NOOP Steps don't hold any logic in code, it's a
 * way to connect nodes in workflow to make it comprehensive
 * like representing a man in the loop or a manual operation that can
 * happen between one step and another.
 *
 * For more information, refer to the documentation: https://www.motia.dev/docs/workbench/noop-steps
 */
export const config: NoopConfig = {
  type: 'noop',
  name: 'ExternalRequest',
  description: 'basic-tutorial noop step example, representing an external http request',

  /**
   * Used mostly to connect nodes that emit to this
   */
  virtualSubscribes: [],

  /**
   * Used mostly to connect nodes that subscribes to this
   */
  virtualEmits: ['/basic-tutorial'],

  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['basic-tutorial'],
}
