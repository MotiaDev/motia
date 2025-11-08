import colors from 'colors'
import inquirer, { type QuestionCollection } from 'inquirer'
import type { CliContext } from '../cloud/config-utils'
import { create } from './index'

interface InteractiveAnswers {
  language: string
  template: string
  projectName: string
  proceed: boolean
}

export const choices: Record<string, string> = {
  nodejs: 'Tutorial (TypeScript)',
  python: 'Tutorial (Python)',
  'starter-typescript': 'Starter (TypeScript)',
  'starter-javascript': 'Starter (JavaScript)',
  'starter-python': 'Starter (Python)',
  'getting-started-ts': 'Getting Started (TypeScript)',
  'api-with-background-jobs-ts': 'API with Background Jobs (TS)',
}

const templatesByLanguage: Record<string, { name: string; value: string }[]> = {
  javascript: [{ name: choices['starter-javascript'], value: 'starter-javascript' }],
  typescript: [
    { name: choices['nodejs'], value: 'nodejs' },
    { name: choices['starter-typescript'], value: 'starter-typescript' },
    { name: choices['getting-started-ts'], value: 'getting-started-ts' },
    { name: choices['api-with-background-jobs-ts'], value: 'api-with-background-jobs-ts' },
  ],
  python: [
    { name: choices['python'], value: 'python' },
    { name: choices['starter-python'], value: 'starter-python' },
  ],
}

interface CreateInteractiveArgs {
  name?: string
  template?: string
  plugin?: boolean
  confirm?: boolean
}

export const createInteractive = async (args: CreateInteractiveArgs, context: CliContext): Promise<void> => {
  context.log('welcome', (message) =>
    message.append(
      `\n🚀 ${colors.bold(args.plugin ? 'Welcome to Motia Plugin Creator!' : 'Welcome to Motia Project Creator!')}`,
    ),
  )

  const questions: QuestionCollection<never>[] = []
  let name = args.name
  let template = args.template

  // Plugin path stays same
  if (args.plugin) {
    if (!args.name) {
      context.log('failed', (message) =>
        message
          .tag('failed')
          .append(`Project name is required: ${colors.bold('motia create --plugin [project-name]')}\n`),
      )
      return
    }

    return create({
      projectName: args.name,
      template: 'plugin',
      cursorEnabled: false,
      context,
    })
  } else if (!args.template) {
    // Step 1: Ask for language
    const { language } = await inquirer.prompt<{ language: string }>([
      {
        type: 'list',
        name: 'language',
        message: 'Select your preferred language:',
        choices: [
          { name: 'JavaScript', value: 'javascript' },
          { name: 'TypeScript', value: 'typescript' },
          { name: 'Python', value: 'python' },
        ],
      },
    ])

    // Step 2: Ask for template within that language
    const { selectedTemplate } = await inquirer.prompt<{ selectedTemplate: string }>([
      {
        type: 'list',
        name: 'selectedTemplate',
        message: `Select a ${colors.bold(language)} template:`,
        choices: templatesByLanguage[language],
      },
    ])

    template = selectedTemplate
  }

  // Step 3: Ask for project name if not provided
  if (!args.name) {
    const { projectName } = await inquirer.prompt<{ projectName: string }>([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name (leave blank to use current folder):',
        validate: (input: string) => {
          if (input && input.trim().length > 0) {
            if (!/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(input.trim())) {
              return 'Project name must start with a letter or number and contain only letters, numbers, hyphens, and underscores'
            }
          }
          return true
        },
        filter: (input: string) => input.trim(),
      },
    ])
    name = projectName
  }

  // Step 4: Confirm before proceeding (if confirm not passed)
  let proceed = true
  if (!args.confirm) {
    const confirmAnswer = await inquirer.prompt<{ proceed: boolean }>([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed? [Y/n]:',
        default: true,
      },
    ])
    proceed = confirmAnswer.proceed
  }

  if (!proceed) {
    context.log('cancelled', (message) => message.tag('info').append('\n❌ Project creation cancelled.'))
    return
  }

  // Step 5: Create project
  context.log('creating', (message) => message.append('\n🔨 Creating your Motia project...\n'))

  await create({
    projectName: name || '.',
    template: template || 'nodejs',
    cursorEnabled: true,
    context,
  })
}
