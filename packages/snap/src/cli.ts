#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import { program } from 'commander'
import './cloud'
import { version } from './version'

const defaultPort = 3000
const defaultHost = 'localhost'

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
  .option('-t, --template <template name>', 'The motia template name to use for your project')
  .option('-c, --cursor', 'Copy .cursor folder from template')
  .option('-i, --interactive', 'Use interactive prompts to create project')
  .option('-y, --skip-confirmation', 'Skip confirmation prompt')
  .action(async (arg) => {
    if (arg.name || arg.template || arg.cursor) {
      const { create } = require('./create')
      await create({
        projectName: arg.name ?? '.',
        template: arg.template ?? 'default',
        cursorEnabled: arg.cursor,
      })
    } else {
      const skipConfirmation = arg.skipConfirmation ?? false
      const { createInteractive } = require('./create/interactive')

      await createInteractive({ skipConfirmation })
    }
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
  .option('-v, --disable-verbose', 'Disable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const { start } = require('./start')
    await start(port, arg.disableVerbose)
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

program.version(version, '-V, --version', 'Output the current version')
program.parse(process.argv)
