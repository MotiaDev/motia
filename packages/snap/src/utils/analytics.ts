import { add, flush, Identify, identify, init, setOptOut, Types } from '@amplitude/analytics-node'
import { getUserIdentifier, isAnalyticsEnabled, trackEvent } from '@motiadev/core'
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

export const logCliError = (command: string, error: unknown) => {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown'
    const errorStack =
      error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 10).join('\n') : undefined

    const truncatedMessage = errorMessage.length > 500 ? `${errorMessage.substring(0, 500)}...` : errorMessage

    trackEvent('cli_command_error', {
      command,
      error_message: truncatedMessage,
      error_type: errorType,
      ...(errorStack && { error_stack: errorStack }),
    })
  } catch (logError) {
    // Silently fail to not disrupt CLI operations
  }
}

const getCommandNameFromArgs = (): string => {
  const args = process.argv.slice(2)
  const commandParts: string[] = []

  for (let i = 0; i < args.length && i < 3; i++) {
    const arg = args[i]
    if (!arg.startsWith('-') && !arg.startsWith('--')) {
      commandParts.push(arg)
    } else {
      break
    }
  }

  return commandParts.join(' ') || 'unknown'
}

export const wrapAction = <T extends (...args: any[]) => Promise<any>>(action: T): T => {
  return (async (...args: any[]) => {
    try {
      return await action(...args)
    } catch (error) {
      const commandName = getCommandNameFromArgs()
      logCliError(commandName, error)
      await flush().promise.catch(() => {
        // Silently fail
      })
      throw error
    }
  }) as T
}
