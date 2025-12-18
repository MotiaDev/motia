#!/usr/bin/env node

import 'dotenv/config'

import { program } from 'commander'
import { type CliContext, handler } from './cloud/config-utils'
import './cloud/index'
import { loadMotiaConfig } from './load-motia-config'
import { wrapAction } from './utils/analytics'
import { version } from './version'

const defaultPort = 3000
const defaultHost = '0.0.0.0'

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
  .option('-i, --interactive', 'Use interactive prompts to create project') // it's default
  .option('--skip-redis', 'Skip Redis binary installation and use external Redis')
  .action((projectName, options) => {
    const mergedArgs = { ...options, name: projectName }
    return handler(async (arg: any, context: CliContext) => {
      const { createInteractive } = await import('./create/interactive')
      await createInteractive(
        {
          name: arg.name,
          template: arg.template,
          plugin: !!arg.plugin,
          skipRedis: !!arg.skipRedis,
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
    handler(async (arg: any, context: CliContext) => {
      const { pullRules } = await import('./create/pull-rules')
      await pullRules({ force: arg.force, rootDir: process.cwd() }, context)
    }),
  )

program
  .command('generate-types')
  .description('Generate types.d.ts file for your project')
  .action(
    wrapAction(async () => {
      const { generateTypes } = await import('./generate-types')
      await generateTypes(process.cwd())
      process.exit(0)
    }),
  )

program
  .command('install')
  .description('Sets up Python virtual environment and install dependencies')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(
    wrapAction(async (options: any) => {
      const { install } = await import('./install')
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
    wrapAction(async (arg: any) => {
      if (arg.debug) {
        console.log('🔍 Debug logging enabled')
        process.env.LOG_LEVEL = 'debug'
      }

      const port = arg.port ? parseInt(arg.port) : defaultPort
      const host = arg.host ? arg.host : defaultHost
      const { dev } = await import('./dev')
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
    wrapAction(async (arg: any) => {
      if (arg.debug) {
        console.log('🔍 Debug logging enabled')
        process.env.LOG_LEVEL = 'debug'
      }

      const port = arg.port ? parseInt(arg.port) : defaultPort
      const host = arg.host ? arg.host : defaultHost
      const { start } = await import('./start')
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
    wrapAction(async (options: any) => {
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
  .option('-d, --dir <step file path>', 'The path relative to the src directory, used to create the step file')
  .action(
    wrapAction(async (arg: any) => {
      const { createStep } = await import('./create-step/index')
      return createStep({
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
    wrapAction(async (options: any) => {
      const { generateLockedData, getStepFiles, getStreamFiles } = await import('./generate-locked-data')
      const { validatePythonEnvironment } = await import('./utils/validate-python-environment')
      const { activatePythonVenv } = await import('./utils/activate-python-env')
      const { generateOpenApi } = await import('./openapi/generate')
      const { MemoryStreamAdapterManager } = await import('@motiadev/core')

      const baseDir = process.cwd()
      const appConfig = await loadMotiaConfig(baseDir)

      const stepFiles = [...getStepFiles(baseDir), ...getStreamFiles(baseDir)]
      const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

      const pythonValidation = await validatePythonEnvironment({ baseDir, hasPythonFiles })
      if (!pythonValidation.success) {
        process.exit(1)
      }

      if (hasPythonFiles) {
        activatePythonVenv({ baseDir })
      }

      const lockedData = await generateLockedData({
        projectDir: baseDir,
        streamAdapter: new MemoryStreamAdapterManager(),
        streamAuth: appConfig.streamAuth,
        printerType: 'disabled',
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
      const { setup } = await import('./docker/setup')
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
    wrapAction(async (arg: any) => {
      const { run } = await import('./docker/run')
      await run(arg.port, arg.projectName, arg.skipBuild)
      process.exit(0)
    }),
  )

docker
  .command('build')
  .description('Build your project in a docker container')
  .option('-n, --project-name <project name>', 'The name for your project')
  .action(
    wrapAction(async (arg: any) => {
      const { build } = await import('./docker/build')
      await build(arg.projectName)
      process.exit(0)
    }),
  )

program.version(version, '-V, --version', 'Output the current version')
program.parseAsync(process.argv).catch(() => {
  process.exit(1)
})
