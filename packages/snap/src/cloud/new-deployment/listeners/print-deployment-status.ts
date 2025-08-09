import { CliContext } from '../../config-utils'
import { DeployData, DeployStatus } from './listener.types'
import colors from 'colors'

let spinnerIndex = 0

export const printDeploymentStatus = (data: DeployData, context: CliContext) => {
  const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  const getSpinner = () => {
    const spinner = spinners[spinnerIndex]
    spinnerIndex = (spinnerIndex + 1) % spinners.length
    return colors.gray(spinner)
  }

  context.log('deployment-status-blank-1', (message) => message.append(''))

  const generateEmitList = (emits: string[]) => {
    return emits.map((e) => colors.yellow(`⌁ ${e}`)).join(colors.gray(', '))
  }

  const getStatus = (status: DeployStatus) => {
    return status === 'failed' ? colors.red('✘') : status === 'completed' ? colors.green('✓') : getSpinner()
  }
  const lambda = (stepName: string) => colors.gray(`λ ${stepName}`)
  const cronStatus = data.cron.reduce((acc, cron) => {
    return acc === 'failed' ? 'failed' : acc === 'completed' ? cron.status : acc
  }, 'completed' as DeployStatus)
  const apigwStatus = data.endpoints.reduce((acc, endpoint) => {
    return acc === 'failed' ? 'failed' : acc === 'completed' ? endpoint.status : acc
  }, 'completed' as DeployStatus)

  // Display event listeners
  data.events.forEach((event) => {
    const status = getStatus(event.status)
    const topicList = generateEmitList(event.topics)

    context.log(`event-${event.stepName}`, (message) => {
      message.append(`[${status}]   [${topicList}] → [≡ ${event.queue}] → [${lambda(event.stepName)}]`)
    })
  })

  context.log('deployment-status-blank-2', (message) => message.append(''))

  // Display API Gateway
  context.log('deployment-status-api-gateway', (message) =>
    message.append(`[${getStatus(apigwStatus)}]   [⛩ API Gateway]`),
  )

  data.endpoints.forEach((endpoint) => {
    const status = getStatus(endpoint.status)
    const emitsList = generateEmitList(endpoint.emits)

    context.log(`endpoint-${endpoint.stepName}`, (message) => {
      message.append(
        `[${status}]    ↳ /${endpoint.method} ${endpoint.path} → [${lambda(endpoint.stepName)}] → [${emitsList}]`,
      )
    })
  })
  context.log('deployment-status-blank-3', (message) => message.append(''))

  // Display Cron jobs
  context.log('deployment-status-cron', (message) => message.append(`[${getStatus(cronStatus)}]   [↺ Cron]`))

  if (data.cron.length > 0) {
    data.cron.forEach((cronJob) => {
      const status = getStatus(cronJob.status)
      const emitsList = generateEmitList(cronJob.emits)

      context.log(`cron-${cronJob.stepName}`, (message) => {
        message.append(`[${status}]    ↳ ${cronJob.cron} → [${emitsList}]`)
      })
    })
  } else {
    context.log('deployment-status-cron-no-jobs', (message) =>
      message.append(`[${colors.green('✓')}]    ↳ No cron jobs configured`),
    )
  }

  // Display Legend
  context.log('deployment-status-legent', (message) => message.append('\nLegend'))
  context.log('deployment-status-legent-queue', (message) => message.append('↳ ≡ Queue'))
  context.log('deployment-status-legent-api-gateway', (message) => message.append('↳ ⛩ API Gateway'))
  context.log('deployment-status-legent-topic', (message) => message.append('↳ ⌁ Topic'))
  context.log('deployment-status-legent-function-handler', (message) => message.append('↳ λ Function Handler'))
  context.log('deployment-status-legent-cron-job', (message) => message.append('↳ ↺ Cron Job'))
}
