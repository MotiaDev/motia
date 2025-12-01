import pc from 'picocolors'
import type { CliContext } from '../../config-utils'
import type { DeployData, DeployStatus } from './listener.types'

type ColorFn = (text: string) => string

let spinnerIndex = 0

export const getStatusColor = (status: DeployStatus): ColorFn => {
  switch (status) {
    case 'completed':
      return pc.green
    case 'failed':
      return pc.red
    case 'progress':
      return pc.yellow
    case 'pending':
      return pc.gray
    default:
      return pc.gray
  }
}

export const printDeploymentStatus = (data: DeployData, context: CliContext) => {
  const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  const getSpinner = () => {
    const spinner = spinners[spinnerIndex]
    spinnerIndex = (spinnerIndex + 1) % spinners.length
    return pc.gray(spinner)
  }

  context.log('deployment-status-blank-1', (message) => message.append(''))

  const generateEmitList = (emits: string[] = []) => {
    return emits.map((e) => pc.white(`⌁ ${e}`)).join(pc.white(', '))
  }

  const getStatus = (status: DeployStatus) => {
    return status === 'failed' ? pc.red('✘') : status === 'completed' ? pc.green('✓') : getSpinner()
  }

  const lambda = (stepName: string, color: ColorFn) => color(`λ ${stepName}`)
  const eventStatus = data.events.reduce((acc, event) => {
    return acc === 'failed' ? 'failed' : acc === 'completed' ? event.status : acc
  }, 'completed' as DeployStatus)
  const cronStatus = data.cron.reduce((acc, cron) => {
    return acc === 'failed' ? 'failed' : acc === 'completed' ? cron.status : acc
  }, 'completed' as DeployStatus)
  const apigwStatus = data.endpoints.reduce((acc, endpoint) => {
    return acc === 'failed' ? 'failed' : acc === 'completed' ? endpoint.status : acc
  }, 'completed' as DeployStatus)

  context.log('deployment-status-step-handler', (message) =>
    message.append(`[${getStatus(eventStatus)}]   [λ Step Handler]`),
  )

  // Display event listeners
  data.events.forEach((event) => {
    const color = getStatusColor(event.status)
    const status = getStatus(event.status)
    const topicList = generateEmitList(event.topics)

    context.log(`event-${event.stepName}`, (message) => {
      message.append(`[${status}]    ↳ [${topicList}] → [≡ ${color(event.queue)}] → [${lambda(event.stepName, color)}]`)
    })
  })

  context.log('deployment-status-blank-2', (message) => message.append(''))

  // Display API Gateway
  context.log('deployment-status-api-gateway', (message) =>
    message.append(`[${getStatus(apigwStatus)}]   [⛩ API Gateway]`),
  )

  data.endpoints.forEach((endpoint) => {
    const color = getStatusColor(endpoint.status)
    const status = getStatus(endpoint.status)
    const emitsList = generateEmitList(endpoint.emits)

    context.log(`endpoint-${endpoint.stepName}`, (message) => {
      message.append(
        `[${status}]    ↳ /${endpoint.method} ${endpoint.path} → [${lambda(endpoint.stepName, color)}] → [${emitsList}]`,
      )
    })
  })
  context.log('deployment-status-blank-3', (message) => message.append(''))

  // Display Cron jobs
  context.log('deployment-status-cron', (message) => message.append(`[${getStatus(cronStatus)}]   [↺ Cron]`))

  if (data.cron.length > 0) {
    data.cron.forEach((cronJob) => {
      const color = getStatusColor(cronJob.status)
      const status = getStatus(cronJob.status)
      const emitsList = generateEmitList(cronJob.emits)

      context.log(`cron-${cronJob.stepName}`, (message) => {
        message.append(`[${status}]    ↳ ${cronJob.cron} → [${lambda(cronJob.stepName, color)}] → [${emitsList}]`)
      })
    })
  } else {
    context.log('deployment-status-cron-no-jobs', (message) =>
      message.append(`[${pc.green('✓')}]    ↳ No cron jobs configured`),
    )
  }

  // Display Legend
  context.log('deployment-status-legent', (message) => message.append('\nLegend'))
  context.log('deployment-status-legent-queue', (message) => message.append('↳ ≡ Queue'))
  context.log('deployment-status-legent-api-gateway', (message) => message.append('↳ ⛩ API Gateway'))
  context.log('deployment-status-legent-topic', (message) => message.append('↳ ⌁ Topic'))
  context.log('deployment-status-legent-function-handler', (message) => message.append('↳ λ Step Handler'))
  context.log('deployment-status-legent-cron-job', (message) => message.append('↳ ↺ Cron Job'))
}
