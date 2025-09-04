import { add, Identify, identify, init, setOptOut, Types } from '@amplitude/analytics-node'
import { getUserIdentifier, isAnalyticsEnabled } from '@motiadev/core'
import { getProjectName } from '@motiadev/core/dist/src/analytics/utils'
import { version } from '../version'
import { MotiaEnrichmentPlugin } from './amplitude/enrichment-plugin'

init('ab2408031a38aa5cb85587a27ecfc69c', {
  logLevel: Types.LogLevel.None,
})

const updateOptOutStatus = () => {
  const optOut = !isAnalyticsEnabled()
  setOptOut(optOut)
}

updateOptOutStatus()

add(new MotiaEnrichmentPlugin())

export const enableAnalytics = () => {
  setOptOut(false)
}

export const disableAnalytics = () => {
  setOptOut(true)
}

export const identifyUser = () => {
  try {
    const identifyObj = new Identify()
    identifyObj.postInsert('project_id', getProjectName(process.cwd()))
    identifyObj.postInsert('motia_version', version || 'unknown')
    identifyObj.postInsert('project_version', process.env.npm_package_version || 'unknown')
    identify(identifyObj, {
      user_id: getUserIdentifier(),
    })
  } catch (error) {
    // Silently fail
  }
}
