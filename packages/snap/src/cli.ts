#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import { program } from 'commander'
import path from 'path'
import fs from 'fs'

const defaultPort = 3000

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

program
  .version(packageJson.version, '-v, --version', 'Output the current version')

program
  .command('version')
  .description('Display detailed version information')
  .action(() => {
    console.log(`Motia CLI v${packageJson.version}`)
  })

program
  .command('create')
  .description('Create a new motia project')
  .option(
    '-n, --name <project name>',
    'The name for your project, used to create a directory, use ./ or . to create it under the existing directory',
  )
  .option('-t, --template <template name>', 'The motia template name to use for your project')
  .action(async (arg) => {
    const { create } = require('./create')
    await create({
      projectName: arg.name ?? '.',
      template: arg.template ?? undefined,
    })
  })

program
  .command('templates')
  .description('Prints the list of available templates')
  .action(async () => {
    const { templates } = require('./create/templates')
    console.log(`📝 Available templates: \n\n ${Object.keys(templates).join('\n')}`)
  })

program
  .command('dev')
  .description('Start the development server')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const { dev } = require('./dev')
    await dev(port, arg.verbose)
  })

program
  .command('build')
  .description('Build the project')
  .action(async () => {
    const { build } = require('./builder/build')
    await build()
  })

program
  .command('deploy')
  .description('Deploy the project to the Motia deployment service')
  .requiredOption('-k, --api-key <key>', 'The API key for authentication')
  .option('-e, --env <environment>', 'The environment to deploy to', 'dev')
  .option('-v, --version <version>', 'The version to deploy', 'latest')
  .action(async (arg) => {
    try {
      const { deploy } = require('./deploy/deploy')
      await deploy(arg.apiKey, process.cwd(), arg.env, arg.version)
    } catch (error) {
      console.error('❌ Deployment failed:', error)
      process.exit(1)
    }
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

program.parse(process.argv)
