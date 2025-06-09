import inquirer from 'inquirer'
import { ApiFactory } from './api/api-factory'
import { CliHandler, question, writeConfig } from './config-utils'

export const pollEnvironmentStatus: CliHandler = async (options, context): Promise<void> => {
  const { environmentId, projectId } = options
  const environmentsClient = context.apiFactory.getEnvironmentsClient()

  context.log('create-environment-progress', (message) =>
    message.tag('progress').append('Environment creation in progress...'),
  )

  const MAX_ATTEMPTS = 40
  const POLLING_INTERVAL_MS = 5_000
  const startTime = Date.now()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    const elapsedTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`

    context.log('create-environment-progress', (message) =>
      message.tag('progress').append(`Checking environment status... (Elapsed time: ${elapsedTime})`),
    )

    const environment = await environmentsClient.getEnvironment(projectId, environmentId).catch((error) => {
      context.log('create-environment-failed', (message) =>
        message.tag('failed').append('Failed to get environment status'),
      )
      throw context.exitWithError('Failed to get environment status', error)
    })

    if (environment.status === 'completed' || environment.status === 'live') {
      const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`

      context.log('create-environment-progress', (message) =>
        message.tag('success').append(`Environment creation completed successfully in ${totalTime}`),
      )

      return
    } else if (environment.status === 'failed') {
      context.log('create-environment-failed', (message) => message.tag('failed').append('Environment creation failed'))
      throw context.exitWithError('Environment creation failed', new Error(environment.status))
    }

    if (attempt < MAX_ATTEMPTS) {
      context.log('create-environment-progress', (message) =>
        message.tag('progress').append('Environment creation in progress... Elapsed time:').append(elapsedTime, 'dark'),
      )
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS))
    } else {
      const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
      context.log('create-environment-progress', (message) =>
        message.tag('failed').append(`Environment creation status check timed out after ${totalTime}`),
      )

      context.exit(1)
    }
  }

  context.exit(1)
}

export const createEnvironment: CliHandler = async (options, context): Promise<void> => {
  const config = context.requireConfig()
  const environmentName = options.name || (await question('Environment name: '))
  const environmentDescription = options.description || (await question('Environment description (optional): '))
  const projectId = config.id
  const apiKey = options.apiKey

  if (!environmentName) {
    context.exitWithError('Environment name is required')
  } else if (!projectId) {
    context.exitWithError('Project ID is required')
  }

  context.log('create-environment', (message) =>
    message.tag('progress').append(`Creating environment "${environmentName}" via API...`),
  )

  const apiFactory = new ApiFactory(apiKey)
  const environmentsClient = apiFactory.getEnvironmentsClient()
  const environmentData = await environmentsClient.createEnvironment(environmentName, projectId, environmentDescription)

  await pollEnvironmentStatus({ environmentId: environmentData.id, projectId }, context)

  config.selectedEnvironment = environmentData.id

  if (writeConfig(config)) {
    const environmentNameStr = environmentName ?? 'unknown'
    const environmentIdStr = environmentData.id ?? 'unknown'

    context.log('create-environment', (message) =>
      message
        .tag('success')
        .append('Environment')
        .append(environmentNameStr, 'dark')
        .append('created successfully with ID:')
        .append(environmentIdStr, 'dark'),
    )

    if (config.selectedEnvironment === environmentName) {
      context.log('selected-environment', (message) =>
        message.tag('info').append(`Environment "${environmentName}" is now the selected environment.`),
      )
    }

    if (environmentData.apiGatewayUrl) {
      context.log('api-url', (message) =>
        message
          .tag('info')
          .append(`API URL for environment "${environmentName}":`)
          .append(`${environmentData.apiGatewayUrl}`, 'dark'),
      )
    }
  }
}

export const listEnvironments: CliHandler = async (_, context): Promise<void> => {
  const environmentsClient = context.apiFactory.getEnvironmentsClient()
  const config = context.requireConfig()
  const environments = await environmentsClient.getEnvironments(config.id)

  if (environments.length === 0) {
    context.log('list-environments', (message) =>
      message.tag('info').append('No environments found. Create a environment first using environment create command.'),
    )
  } else {
    context.log('title', (message) => message.tag('info').append('Available environments'))
    context.log('list-environments', (message) =>
      message.table(
        ['', 'Name', 'Version', 'ID', 'Api Gateway', 'Description'],
        environments.map((environment) => [
          config.selectedEnvironment === environment.id ? '✓' : '',
          environment.name,
          environment.currentVersion ?? '',
          environment.id,
          environment.apiGatewayDomain ?? environment.apiGatewayUrl ?? '',
          environment.description ?? '',
        ]),
      ),
    )
  }
}

export const deleteEnvironment: CliHandler = async (options, context): Promise<void> => {
  const environmentsClient = context.apiFactory.getEnvironmentsClient()
  const config = context.requireConfig()
  const environments = await environmentsClient.getEnvironments(config.id)
  const environment = environments.find((environment) => environment.name === options.name)

  if (!environment) {
    return context.exitWithError(`Environment "${options.name}" not found`)
  }

  context.log('delete-environment', (message) =>
    message.tag('progress').append('Deleting environment').append(environment.name, 'dark'),
  )

  await environmentsClient.deleteEnvironment(config.id, environment.id)

  context.log('delete-environment', (message) =>
    message.tag('success').append('Environment').append(environment.name, 'dark').append('deleted successfully.'),
  )

  context.log('delete-environment', (message) =>
    message.tag('success').append('Environment').append(environment.name, 'dark').append('deleted successfully.'),
  )

  if (config.selectedEnvironment === environment.id) {
    config.selectedEnvironment = undefined
    writeConfig(config)
  }
}

export const selectEnvironment: CliHandler = async (options, context): Promise<void> => {
  const config = context.requireConfig()
  const environmentsClient = context.apiFactory.getEnvironmentsClient()
  const environments = await environmentsClient.getEnvironments(config.id)

  if (environments.length === 0) {
    return context.exitWithError('No environments found. Create a environment first using environment create command.')
  }

  if (!options.name) {
    const environmentChoices = environments.map((environment) => ({
      name: `${environment.name}${environment.description ? ` - ${environment.description}` : ''}`,
      value: environment.id,
    }))

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Select a version environment:',
        choices: environmentChoices,
        default: config?.selectedEnvironment,
      },
    ])

    writeConfig({ ...config, selectedEnvironment: answer.environment })
  } else {
    const environment = environments.find((environment) => environment.name === options.name)

    if (!environment) {
      return context.exitWithError(`Environment "${options.name}" not found`)
    }

    writeConfig({ ...config, selectedEnvironment: environment.id })
  }
}

export const updateEnvironment: CliHandler = async (arg, context) => {
  if (!context.config?.selectedEnvironment) {
    return context.exitWithError(
      'Environment not selected. Please select a environment first using environment select command.',
    )
  }

  await context.versionService.promoteVersion({
    projectId: context.config.id,
    environmentId: context.config.selectedEnvironment,
    versionName: arg.versionName,
  })
}
