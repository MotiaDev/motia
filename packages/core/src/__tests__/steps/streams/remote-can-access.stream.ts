import { z } from 'zod'
import type { StreamConfig, StreamSubscription } from '../../../types-stream'

export const config: StreamConfig = {
  name: 'remote-access-stream',
  schema: z.object({ groupId: z.string() }),
  baseConfig: { storageType: 'default' },
  canAccess: ({ groupId }: StreamSubscription, authContext?: unknown) => {
    const token = (authContext as { token?: string })?.token

    if (!token) {
      return groupId.startsWith('public:')
    }

    return token === groupId
  },
}
