import type { RedisConfig } from '@motiadev/core'
import type { LoadedMotiaConfig } from '../load-motia-config'

export const shouldUseMemoryServer = (config: LoadedMotiaConfig): boolean => {
  if (process.env.MOTIA_DISABLE_MEMORY_SERVER === 'true') {
    return false
  }

  if (process.env.MOTIA_REDIS_HOST && process.env.MOTIA_REDIS_HOST !== '127.0.0.1') {
    return false
  }

  const redisConfig = config.redis
  if (redisConfig && 'useMemoryServer' in redisConfig && redisConfig.useMemoryServer === false) {
    return false
  }

  return redisConfig?.useMemoryServer !== undefined ? redisConfig.useMemoryServer === true : true
}

export const isExternalRedisConfig = (
  redisConfig: RedisConfig | undefined,
): redisConfig is Extract<RedisConfig, { useMemoryServer?: false; host: string; port: number }> => {
  return redisConfig !== undefined && 'host' in redisConfig && 'port' in redisConfig
}
