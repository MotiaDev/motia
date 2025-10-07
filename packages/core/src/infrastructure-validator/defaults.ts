import { InfrastructureConfig, QueueConfig } from '../types'

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
    type: 'standard',
    maxRetries: 3,
    retryStrategy: 'none',
    visibilityTimeout: 900,
    messageGroupId: null,
    delay: 0,
}

export function getQueueConfigWithDefaults(infrastructure?: InfrastructureConfig): QueueConfig {
    return {
        ...DEFAULT_QUEUE_CONFIG,
        ...(infrastructure?.queue || {}),
    }
}
