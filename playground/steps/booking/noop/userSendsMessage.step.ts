import { NoopConfig } from '@motia/core'

export const config: NoopConfig = {
  type: 'noop',
  name: 'User Sends Message',
  description: 'User sends a message',
  virtualEmits: ['/api/booking/initialize'],
  virtualSubscribes: ['dbz.message-sent'],
  flows: ['booking'],
}
