import { StepConfig } from 'motia'

export const config: StepConfig = {
  name: 'Test the flow',
  description: 'This node does nothing, but it is useful for testing the flow',
  triggers: [],
  virtualSubscribes: [],
  virtualEmits: ['/api/parallel-merge'],
  flows: ['parallel-merge'],
}
