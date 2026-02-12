import { init } from 'iii-sdk'

export const iii = init(process.env.III_URL ?? 'ws://localhost:49134')
