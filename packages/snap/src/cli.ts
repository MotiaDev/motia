#!/usr/bin/env node

import { program } from 'commander'
import './cloud'
import { execSync } from 'child_process'
import fs from 'fs'
import inquirer from 'inquirer'
import os from 'os'
import path from 'path'
import { handler } from './cloud/config-utils'
import { version } from './version'

const defaultPort = 3000
const defaultHost = '0.0.0.0'

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

// 🔹 Remote templates index
const TEMPLATE_INDEX = 'https://raw.githubusercontent.com/MotiaDev/motia-examples/main/examples/templates.json'

interface Template {
  name: string
  description: string
  repo: string
  tags?: string[]
}

async function fetchTemplates(): Promise<Template[]> {
  try {
    const res = await fetch(TEMPLATE_INDEX)
    if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`)
    return (await res.json()) as Template[]
  } catch (err: any) {
    console.error('❌ Unable to fetch templates:', err.message)
    return []
  }
}

async function cloneProject(templateRepo: string, projectName?: string) {
  try {
    const cwd = process.cwd()
    const targetDir = projectName ? path.join(cwd, projectName) : cwd

    const match = templateRepo.match(/(https:\/\/github\.com\/[^/]+\/[^/]+)\/tree\/([^/]+)\/(.+)/)
    if (match) {
      const [_, repoBase, branch, folderPath] = match
      console.log(`\n📦 Cloning subdirectory ${folderPath} from ${repoBase} (${branch})...`)

      const tempDir = path.join(cwd, `.motia-temp-${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      // ✅ Detect shell
      const isWindows = os.platform() === 'win32'
      const shell = isWindows ? undefined : '/bin/bash'

      // ✅ Sparse checkout for only that folder
      const commands = [
        `git clone --no-checkout --depth 1 --branch ${branch} ${repoBase}.git ${tempDir}`,
        `cd ${tempDir}`,
        `git sparse-checkout init --cone`,
        `git sparse-checkout set ${folderPath}`,
        `git checkout`,
      ]

      execSync(commands.join(isWindows ? ' & ' : ' && '), {
        stdio: 'inherit',
        shell,
      })

      const sourceDir = path.join(tempDir, folderPath)
      fs.cpSync(sourceDir, targetDir, { recursive: true })
      fs.rmSync(tempDir, { recursive: true, force: true })
    } else {
      console.log(`\n🚀 Cloning ${templateRepo}...`)
      execSync(`git clone ${templateRepo} ${projectName || '.'}`, { stdio: 'inherit' })
    }

    const gitDir = path.join(targetDir, '.git')
    if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true })

    console.log(`\n✅ Project ready at: ${targetDir}`)
  } catch (err: any) {
    console.error('❌ Failed to clone repository:', err.message)
    process.exit(1)
  }
}

/* ------------------ COMMANDS ------------------- */

program
  .command('version')
  .description('Display detailed version information')
  .action(() => {
    console.log(`Motia CLI v${version}`)
    process.exit(0)
  })

// ✅ CREATE command - now directly clones repo
program
  .command('create [name]')
  .description('Create a new Motia project')
  .option('-t, --template <template>', 'Specify template name to use')
  .action(async (projectName, options) => {
    const templates = await fetchTemplates()

    if (!templates.length) {
      console.log('⚠️ No templates found.')
      process.exit(1)
    }

    let templateRepo = options.template

    // If no template specified, prompt user
    if (!templateRepo) {
      const { chosen } = await inquirer.prompt([
        {
          type: 'list',
          name: 'chosen',
          message: 'Choose a starter template:',
          choices: templates.map((t) => ({
            name: `${t.name} - ${t.description}`,
            value: t.repo,
          })),
        },
      ])
      templateRepo = chosen
    } else {
      // match by name if provided
      const found = templates.find((t) => t.name === templateRepo)
      if (found) templateRepo = found.repo
    }

    await cloneProject(templateRepo, projectName)
  })

// ✅ SEARCH command with optional create
program
  .command('search [query]')
  .description('Search available Motia templates')
  .option('-c, --create', 'Create a project directly from a selected template after search')
  .action(async (query, options) => {
    const templates = await fetchTemplates()

    if (!templates.length) {
      console.log('⚠️ No templates found.')
      process.exit(1)
    }

    const filtered = query
      ? templates.filter((t) => {
          const text = [t.name, t.description].join(' ').toLowerCase()
          const tags = (t.tags || []).map((tag) => tag.toLowerCase())
          return text.includes(query.toLowerCase()) || tags.includes(query.toLowerCase())
        })
      : templates

    if (!filtered.length) {
      console.log(`❌ No templates found for query "${query}"`)
      process.exit(0)
    }

    console.log('\nAvailable templates:\n')
    filtered.forEach((t, idx) => {
      console.log(`${idx + 1}. 📦 ${t.name}`)
      console.log(`   ${t.description}`)
      console.log(`   🔗 ${t.repo}\n`)
    })

    if (options.create) {
      const { chosenTemplate } = await inquirer.prompt([
        {
          type: 'list',
          name: 'chosenTemplate',
          message: 'Choose a template to clone:',
          choices: filtered.map((t) => ({
            name: `${t.name} - ${t.description}`,
            value: t.repo,
          })),
        },
      ])

      const { projectName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Enter your new project name (leave blank to use current folder):',
        },
      ])

      const finalName = projectName && projectName.trim().length > 0 ? projectName.trim() : path.basename(process.cwd())

      await cloneProject(chosenTemplate, finalName)
    }
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
  .option('--motia-dir <path>', 'Path where .motia folder will be created')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const host = arg.host ? arg.host : defaultHost
    const { dev } = require('./dev')
    await dev(port, host, arg.disableVerbose, arg.mermaid, arg.motiaDir)
  })

program
  .command('start')
  .description('Start a server to run your Motia project')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-H, --host [host]', 'The host address for the server', `${defaultHost}`)
  .option('-v, --disable-verbose', 'Disable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .option('--motia-dir <path>', 'Path where .motia folder will be created')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const host = arg.host ? arg.host : defaultHost
    const { start } = require('./start')
    await start(port, host, arg.disableVerbose, arg.motiaDir)
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

generate
  .command('openapi')
  .description('Generate OpenAPI spec for your project')
  .option('-t, --title <title>', 'Title for the OpenAPI document. Defaults to project name')
  .option('-v, --version <version>', 'Version for the OpenAPI document. Defaults to 1.0.0', '1.0.0')
  .option('-o, --output <output>', 'Output file for the OpenAPI document. Defaults to openapi.json', 'openapi.json')
  .action(async (options) => {
    const { generateLockedData } = require('./generate-locked-data')
    const { generateOpenApi } = require('./openapi/generate')

    const lockedData = await generateLockedData({ projectDir: process.cwd() })
    const apiSteps = lockedData.apiSteps()

    generateOpenApi(process.cwd(), apiSteps, options.title, options.version, options.output)
    process.exit(0)
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

program.version(version, '-V, --version', 'Output the current version')
program.parse(process.argv)
