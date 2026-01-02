import { track } from '@amplitude/analytics-node'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { environmentDetector } from './environment-detector'

export const getProjectName = (baseDir: string): string => {
  const packageJsonPath = path.join(baseDir, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    return packageJson.name || path.basename(baseDir)
  }

  return 'unknown'
}

export const getUserIdentifier = (): string => {
  const userInfo = `${os.userInfo().username}${os.hostname()}`
  return crypto.createHash('sha256').update(userInfo).digest('hex').substring(0, 16)
}

export const getProjectIdentifier = (baseDir: string): string => {
  try {
    return crypto.createHash('sha256').update(getProjectName(baseDir)).digest('hex').substring(0, 16)
  } catch {
    return 'unknown'
  }
}

export const isAnalyticsEnabled = (): boolean => {
  return process.env.MOTIA_ANALYTICS_DISABLED !== 'true'
}

export const trackEvent = (eventName: string, properties: Record<string, unknown> = {}) => {
  try {
    if (isAnalyticsEnabled()) {
      const envContext = environmentDetector.getEnvironmentContext()
      const enrichedProperties = {
        ...properties,
        is_docker: envContext.is_docker,
        is_ci: envContext.is_ci,
        is_test: envContext.is_test,
        environment_type: envContext.environment_type,
        execution_context: envContext.execution_context,
      }

      track(eventName, enrichedProperties, {
        user_id: getUserIdentifier() || 'unknown',
      })
    }
  } catch {
    // Silently fail to not disrupt dev server
  }
}
