#!/usr/bin/env node

import { program } from 'commander'
import { handler } from './cloud/config-utils'
import { wrapAction } from './utils/analytics'
import { version } from './version'

const defaultPort = 3000
const defaultHost = '0.0.0.0'

const registerTsNode = () => {
  require('dotenv/config')
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' },
  })
}

const registerCloudCommands = () => {
  require('./cloud')
}

program
  .command('version')
  .description('Display detailed version information')
  .action(() => {
    console.log(`Motia CLI v${version}`)
    process.exit(0)
  })

program
  .command('create [name]')
  .description('Create a new motia project')
  .option('-t, --template <template>', 'The template to use for your project')
  .option('-p, --plugin', 'Create a plugin project')
  .option('-i, --interactive', 'Use interactive prompts to create project')
  .action((projectName, options) => {
    const mergedArgs = { ...options, name: projectName }
    return handler(async (arg, context) => {
      const { createInteractive } = require('./create/interactive')
      await createInteractive(
        {
          name: arg.name,
          template: arg.template,
          plugin: !!arg.plugin,
        },
        context,
      )
    })(mergedArgs)
  })

program
  .command('rules')
  .command('pull')
  .description('Install essential AI development guides (AGENTS.md, CLAUDE.md) and optional Cursor IDE rules')
  .option('-f, --force', 'Overwrite existing files')
  .action(
    handler(async (arg, context) => {
      const { pullRules } = require('./create/pull-rules')
      await pullRules({ force: arg.force, rootDir: process.cwd() }, context)
    }),
  )

program
  .command('generate-types')
  .description('Generate types.d.ts file for your project')
  .action(
    wrapAction(async () => {
      registerTsNode()
      const { generateTypes } = require('./generate-types')
      await generateTypes(process.cwd())
      process.exit(0)
    }),
  )

program
  .command('install')
  .description('Sets up Python virtual environment and install dependencies')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(
    wrapAction(async (options) => {
      const { install } = require('./install')
      await install({ isVerbose: options.verbose })
    }),
  )

program
  .command('dev')
  .description('Start the development server')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-H, --host [host]', 'The host address for the server', `${defaultHost}`)
  .option('-v, --disable-verbose', 'Disable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .option('-m, --mermaid', 'Enable mermaid diagram generation')
  .option('--motia-dir <path>', 'Path where .motia folder will be created')
  .action(
    wrapAction(async (arg) => {
      registerTsNode()
      if (arg.debug) {
        console.log('🔍 Debug logging enabled')
        process.env.LOG_LEVEL = 'debug'
      }

      const port = arg.port ? parseInt(arg.port) : defaultPort
      const host = arg.host ? arg.host : defaultHost
      const { dev } = require('./dev')
      await dev(port, host, arg.disableVerbose, arg.mermaid, arg.motiaDir)
    }),
  )

program
  .command('start')
  .description('Start a server to run your Motia project')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-H, --host [host]', 'The host address for the server', `${defaultHost}`)
  .option('-v, --disable-verbose', 'Disable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .option('--motia-dir <path>', 'Path where .motia folder will be created')
  .action(
    wrapAction(async (arg) => {
      registerTsNode()
      if (arg.debug) {
        console.log('🔍 Debug logging enabled')
        process.env.LOG_LEVEL = 'debug'
      }

      const port = arg.port ? parseInt(arg.port) : defaultPort
      const host = arg.host ? arg.host : defaultHost
      const { start } = require('./start')
      await start(port, host, arg.disableVerbose, arg.motiaDir)
    }),
  )

program
  .command('emit')
  .description('Emit an event to the Motia server')
  .requiredOption('--topic <topic>', 'Event topic/type to emit')
  .requiredOption('--message <message>', 'Event payload as JSON string')
  .option('-p, --port <number>', 'Port number (default: 3000)')
  .action(
    wrapAction(async (options) => {
      const port = options.port || 3000
      const url = `http://localhost:${port}/emit`

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
    }),
  )

const generate = program.command('generate').description('Generate motia resources')

generate
  .command('step')
  .description('Create a new step with interactive prompts')
  .option('-d, --dir <step file path>', 'The path relative to the steps directory, used to create the step file')
  .action(
    wrapAction(async (arg) => {
      const { createStep } = require('./create-step')
      await createStep({
        stepFilePath: arg.dir,
      })
    }),
  )

generate
  .command('openapi')
  .description('Generate OpenAPI spec for your project')
  .option('-t, --title <title>', 'Title for the OpenAPI document. Defaults to project name')
  .option('-v, --version <version>', 'Version for the OpenAPI document. Defaults to 1.0.0', '1.0.0')
  .option('-o, --output <output>', 'Output file for the OpenAPI document. Defaults to openapi.json', 'openapi.json')
  .action(
    wrapAction(async (options) => {
      registerTsNode()
      const { MemoryStreamAdapterManager } = require('@motiadev/core')
      const { loadMotiaConfig } = require('./load-motia-config')
      const { generateLockedData } = require('./generate-locked-data')
      const { generateOpenApi } = require('./openapi/generate')

      const baseDir = process.cwd()
      const appConfig = await loadMotiaConfig(baseDir)

      const lockedData = await generateLockedData({
        projectDir: baseDir,
        streamAdapter: new MemoryStreamAdapterManager(),
        streamAuth: appConfig.streamAuth,
      })
      const apiSteps = lockedData.apiSteps()

      generateOpenApi(process.cwd(), apiSteps, options.title, options.version, options.output)
      process.exit(0)
    }),
  )

const docker = program.command('docker').description('Motia docker commands')

docker
  .command('setup')
  .description('Setup a motia-docker for your project')
  .action(
    wrapAction(async () => {
      const { setup } = require('./docker/setup')
      await setup()
      process.exit(0)
    }),
  )

docker
  .command('run')
  .description('Build and run your project in a docker container')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-n, --project-name <project name>', 'The name for your project')
  .option('-s, --skip-build', 'Skip docker build')
  .action(
    wrapAction(async (arg) => {
      const { run } = require('./docker/run')
      await run(arg.port, arg.projectName, arg.skipBuild)
      process.exit(0)
    }),
  )

docker
  .command('build')
  .description('Build your project in a docker container')
  .option('-n, --project-name <project name>', 'The name for your project')
  .action(
    wrapAction(async (arg) => {
      const { build } = require('./docker/build')
      await build(arg.projectName)
      process.exit(0)
    }),
  )

registerCloudCommands()

program.version(version, '-V, --version', 'Output the current version')
program.parseAsync(process.argv).catch(() => {
  process.exit(1)
})
