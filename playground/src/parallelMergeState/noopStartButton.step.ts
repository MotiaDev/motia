import type { NoopConfig } from 'motia'

export const config: NoopConfig = {
  type: 'noop',
  name: 'Test the flow',
  description: 'This node does nothing, but it is useful for testing the flow',
  virtualSubscribes: [],
  virtualEmits: ['/api/parallel-merge'],
  flows: ['parallel-merge'],
}
