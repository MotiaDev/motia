#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import { program } from 'commander'
import './cloud'
import { version } from './version'
import { handler } from './cloud/config-utils'

const defaultPort = 3000
const defaultHost = '0.0.0.0'

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

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
  .option('-i, --interactive', 'Use interactive prompts to create project') // it's default
  .action(
    handler(async (arg, context) => {
      const { createInteractive } = require('./create/interactive')

      await createInteractive({ name: arg.name }, context)
    }),
  )

program
  .command('generate-types')
  .description('Generate types.d.ts file for your project')
  .action(async () => {
    const { generateTypes } = require('./generate-types')
    await generateTypes(process.cwd())
    process.exit(0)
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
  .option('-H, --host [host]', 'The host address for the server', `${defaultHost}`)
  .option('-v, --disable-verbose', 'Disable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .option('-m, --mermaid', 'Enable mermaid diagram generation')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const host = arg.host ? arg.host : defaultHost
    const { dev } = require('./dev')
    await dev(port, host, arg.disableVerbose, arg.mermaid)
  })

program
  .command('start')
  .description('Start a server to run your Motia project')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-H, --host [host]', 'The host address for the server', `${defaultHost}`)
  .option('-v, --disable-verbose', 'Disable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const host = arg.host ? arg.host : defaultHost
    const { start } = require('./start')
    await start(port, host, arg.disableVerbose)
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

const docker = program.command('docker').description('Motia docker commands')

docker
  .command('setup')
  .description('Setup a motia-docker for your project')
  .action(async () => {
    const { setup } = require('./docker/setup')
    await setup()
    process.exit(0)
  })

docker
  .command('run')
  .description('Build and run your project in a docker container')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-n, --project-name <project name>', 'The name for your project')
  .option('-s, --skip-build', 'Skip docker build')
  .action(async (arg) => {
    const { run } = require('./docker/run')
    await run(arg.port, arg.projectName, arg.skipBuild)
    process.exit(0)
  })

docker
  .command('build')
  .description('Build your project in a docker container')
  .option('-n, --project-name <project name>', 'The name for your project')
  .action(async (arg) => {
    const { build } = require('./docker/build')
    await build(arg.projectName)
    process.exit(0)
  })

const rules = program
  .command('rules')
  .description('Manage Motia AI development guides (AGENTS.md, CLAUDE.md) and IDE-specific rules')

rules
  .command('pull')
  .description('Install essential AI development guides (AGENTS.md, CLAUDE.md) and optional Cursor IDE rules')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    const { handleAIGuides } = require('./cursor-rules')
    await handleAIGuides({ force: options.force })
  })

rules
  .command('list')
  .description('List available AI development guides and IDE rules')
  .action(async () => {
    const { handleAIGuides } = require('./cursor-rules')
    await handleAIGuides({ list: true })
  })

rules
  .command('show <rule-name>')
  .description('Show content of a specific AI guide or IDE rule')
  .action(async (ruleName) => {
    const { handleAIGuides } = require('./cursor-rules')
    await handleAIGuides({ show: ruleName })
  })

rules
  .command('remove')
  .description('Remove AI development guides and IDE rules from your project')
  .action(async () => {
    const { handleAIGuides } = require('./cursor-rules')
    await handleAIGuides({ remove: true })
  })

rules
  .command('version')
  .description('Show AI development guides version')
  .action(async () => {
    const { handleAIGuides } = require('./cursor-rules')
    await handleAIGuides({ version: true })
  })

program.version(version, '-V, --version', 'Output the current version')
program.parse(process.argv)
