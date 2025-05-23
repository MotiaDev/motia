#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import { program } from 'commander'
import path from 'path'
import fs from 'fs'
import { getStage, Stage } from './infrastructure/config-utils'

const defaultPort = 3000

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = `${packageJson.version}`

program
  .command('version')
  .description('Display detailed version information')
  .action(() => {
    console.log(`Motia CLI v${version}`)
    process.exit(0)
  })

program
  .command('create')
  .description('Create a new motia project')
  .option(
    '-n, --name <project name>',
    'The name for your project, used to create a directory, use ./ or . to create it under the existing directory',
  )
  .option('-t, --template <template name>', 'The motia template name to use for your project', 'default')
  .option('-c, --cursor', 'Copy .cursor folder from template')
  .action(async (arg) => {
    const { create } = require('./create')
    await create({
      projectName: arg.name ?? '.',
      template: arg.template ?? 'default',
      cursorEnabled: arg.cursor,
    })
    process.exit(0)
  })

program
  .command('generate-types')
  .description('Generate types.d.ts file for your project')
  .action(async () => {
    const { generateTypes } = require('./generate-types')
    await generateTypes(process.cwd())
    process.exit(0)
  })

program
  .command('templates')
  .description('Prints the list of available templates')
  .action(async () => {
    const { templates } = require('./create/templates')
    console.log(`📝 Available templates: \n\n ${Object.keys(templates).join('\n')}`)
  })

program
  .command('install')
  .description('Sets up Python virtual environment and install dependencies')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    const { install } = require('./install')
    await install({ isVerbose: options.verbose })
  })

program
  .command('dev')
  .description('Start the development server')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .option('-m, --mermaid', 'Enable mermaid diagram generation')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const { dev } = require('./dev')
    await dev(port, arg.verbose, arg.mermaid)
  })

program
  .command('build')
  .description('Build the project')
  .action(async () => {
    const { build } = require('./builder/build')
    await build()
  })

program
  .command('get-config')
  .description('Get the generated config for your project')
  .option('-o, --output <port>', 'Path to write the generated config')
  .action(async (arg) => {
    const { generateLockedData } = require('./src/generate/locked-data')
    const lockedData = await generateLockedData(path.join(process.cwd()))

    if (arg.output) {
      const fs = require('fs')
      fs.writeFileSync(path.join(arg.output, '.motia.generated.json'), JSON.stringify(lockedData, null, 2))
      console.log(`📄 Wrote locked data to ${arg.output}`)

      return
    }
    console.log(JSON.stringify(lockedData, null, 2))
  })

program
  .command('emit')
  .description('Emit an event to the Motia server')
  .requiredOption('--topic <topic>', 'Event topic/type to emit')
  .requiredOption('--message <message>', 'Event payload as JSON string')
  .option('-p, --port <number>', 'Port number (default: 3000)')
  .action(async (options) => {
    const port = options.port || 3000
    const url = `http://localhost:${port}/emit`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: options.topic,
          data: JSON.parse(options.message),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Event emitted successfully:', result)
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

const generate = program.command('generate').description('Generate motia resources')
generate
  .command('step')
  .description('Create a new step with interactive prompts')
  .option('-d, --dir <step file path>', 'The path relative to the steps directory, used to create the step file')
  .action(async (arg) => {
    const { createStep } = require('./create-step')
    await createStep({
      stepFilePath: arg.dir,
    })
  })

const state = program.command('state').description('Manage application state')

state
  .command('list')
  .description('List the current file state')
  .action(async () => {
    try {
      const statePath = path.join(process.cwd(), '.motia', 'motia.state.json')

      if (!fs.existsSync(statePath)) {
        console.error('Error: State file not found at', statePath)
        process.exit(1)
      }

      const state = require(statePath)
      console.log(JSON.stringify(state, null, 2))
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

const infrastructure = program
  .command('infrastructure')
  .description('Manage motia infrastructure deployment services')
  .option('--verbose', 'Enable verbose logging')

infrastructure
  .command('init')
  .description('Initialize a new Motia infrastructure deployment project')
  .requiredOption(
    '-k, --api-key <api key>',
    'API key for authentication (not stored in config)',
    process.env.MOTIA_API_KEY,
  )
  .option('-n, --name <project name>', 'The name for your infrastructure deployment project')
  .option('-d, --description <description>', 'Description of the infrastructure deployment service')
  .action(async (arg) => {
    try {
      const { initInfrastructure } = require('./infrastructure/init')
      await initInfrastructure({
        name: arg.name,
        description: arg.description,
        apiKey: arg.apiKey,
      })
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Infrastructure initialization failed:', error)
      } else {
        console.error('❌ Infrastructure initialization failed')
      }
      process.exit(1)
    }
  })

infrastructure
  .command('deploy')
  .description('Deploy the project to the Motia deployment service')
  .requiredOption('-k, --api-key <key>', 'The API key for authentication', process.env.MOTIA_API_KEY)
  .option('-v, --version <version>', 'The version to deploy', 'latest')
  .option('-s, --stage <stage>', 'Override the selected stage')
  .option('-e, --env-file <path>', 'Path to environment file')
  .action(async (arg) => {
    try {
      const { build } = require('./builder/build')
      await build()

      const { DeploymentManager } = require('./infrastructure/deploy/deploy')
      const deploymentManager = new DeploymentManager()
      await deploymentManager.deploy(arg.apiKey, process.cwd(), arg.version, {
        stage: arg.stage,
        envFile: arg.envFile,
      })
      process.exit(0)
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Deployment failed:', error)
      } else {
        console.error('❌ Deployment failed')
      }
      process.exit(1)
    }
  })

infrastructure
  .command('list-projects')
  .description('List all projects')
  .requiredOption(
    '-k, --api-key <api key>',
    'API key for authentication (not stored in config)',
    process.env.MOTIA_API_KEY,
  )
  .option(
    '-u, --api-base-url <url>',
    'Base URL for the API (defaults to MOTIA_API_URL env var or https://api.motia.io)',
  )
  .action(async (arg) => {
    try {
      const { listProjects } = require('./infrastructure/project')
      await listProjects({
        apiKey: arg.apiKey,
        apiBaseUrl: arg.apiBaseUrl,
      })
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Failed to list projects:', error)
      } else {
        console.error('❌ Failed to list projects')
      }
      process.exit(1)
    }
  })

infrastructure
  .command('create-stage')
  .description('Create a new deployment stage')
  .requiredOption(
    '-k, --api-key <api key>',
    'API key for authentication (not stored in config)',
    process.env.MOTIA_API_KEY,
  )
  .option('-n, --name <stage name>', 'The name for your deployment stage')
  .option('-d, --description <description>', 'Description of the deployment stage')
  .action(async (arg) => {
    try {
      const { createStage } = require('./infrastructure/stage')
      await createStage({
        name: arg.name,
        description: arg.description,
        apiKey: arg.apiKey,
      })
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Stage creation failed:', error)
      } else {
        console.error('❌ Stage creation failed')
      }
      process.exit(1)
    }
  })

infrastructure
  .command('select-stage')
  .description('Select a deployment stage')
  .option('-n, --name <stage name>', 'The name of the stage to select')
  .action(async (arg) => {
    try {
      const inquirer = require('inquirer')
      const { selectStage } = require('./infrastructure/stage')
      const { readConfig } = require('./infrastructure/config-utils')

      const config = readConfig()
      if (!config || !config.stages || Object.keys(config.stages).length === 0) {
        console.error('❌ No stages found. Create a stage first using create-stage command.')
        process.exit(1)
      }

      let stageName = arg.name
      if (!stageName) {
        const stageChoices = Object.entries(config.stages as Record<string, Stage>).map(([name, stage]) => ({
          name: `${name}${stage.description ? ` - ${stage.description}` : ''}`,
          value: name,
        }))

        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'stage',
            message: 'Select a deployment stage:',
            choices: stageChoices,
            default: config.selectedStage,
          },
        ])
        stageName = answer.stage
      }

      await selectStage({
        name: stageName,
      })
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Stage selection failed:', error)
      } else {
        console.error('❌ Stage selection failed')
      }
      process.exit(1)
    }
  })

infrastructure
  .command('list-stages')
  .description('List all deployment stages')
  .requiredOption('-k, --api-key <api key>', 'API key for authentication (when using API)', process.env.MOTIA_API_KEY)
  .option('-a, --api', 'Fetch stages from API instead of local config')
  .action(async (arg) => {
    try {
      const { listStages } = require('./infrastructure/stage')
      await listStages({
        useApi: arg.api,
        apiKey: arg.apiKey,
      })
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Failed to list stages:', error)
      } else {
        console.error('❌ Failed to list stages')
      }
      process.exit(1)
    }
  })

infrastructure
  .command('update')
  .description('Update a stage to a specific version')
  .requiredOption('-k, --api-key <api key>', 'API key for authentication', process.env.MOTIA_API_KEY)
  .requiredOption('-s, --stage <stage>', 'The stage to update')
  .requiredOption('-v, --version <version>', 'The version to promote')
  .action(async (arg) => {
    try {
      const stage = getStage(arg.stage)
      if (!stage) {
        throw new Error(`Stage "${arg.stage}" not found`)
      }

      const { DeploymentService } = require('./infrastructure/deploy/services/deployment-service')
      const deploymentService = new DeploymentService(arg.apiKey)
      await deploymentService.promoteVersion(stage.id, arg.version)
      console.log(`✅ Version ${arg.version} promoted successfully to ${arg.stage}`)
      process.exit(0)
    } catch (error) {
      if (infrastructure.opts().verbose) {
        console.error('❌ Version promotion failed:', error)
      } else {
        console.error('❌ Version promotion failed')
      }
      process.exit(1)
    }
  })

program.version(version, '-V, --version', 'Output the current version')

program.parse(process.argv)
