import { init } from '@iii-dev/sdk'

export const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')
