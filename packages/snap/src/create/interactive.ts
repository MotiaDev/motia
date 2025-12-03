import inquirer, { type QuestionCollection } from 'inquirer'
import pc from 'picocolors'
import type { CliContext, Message } from '../cloud/config-utils'
import { create } from './index'

interface InteractiveAnswers {
  template: string
  projectName: string
}

const choices: Record<string, string> = {
  'motia-tutorial-typescript': 'Tutorial (TypeScript)',
  'motia-tutorial-python': 'Tutorial (Python)',
  'starter-typescript': 'Starter (TypeScript)',
  'starter-javascript': 'Starter (JavaScript)',
  'starter-python': 'Starter (Python)',
  'starter-multilang': 'Starter (Multi-language: TypeScript + Python)',
}

interface CreateInteractiveArgs {
  name?: string
  template?: string
  plugin?: boolean
}

export const createInteractive = async (args: CreateInteractiveArgs, context: CliContext): Promise<void> => {
  context.log('welcome', (message: Message) =>
    message.append(
      `\n🚀 ${pc.bold(args.plugin ? 'Welcome to Motia Plugin Creator!' : 'Welcome to Motia Project Creator!')}`,
    ),
  )

  const questions: QuestionCollection<never>[] = []

  let name = args.name
  let template = args.template

  if (args.plugin) {
    if (!args.name) {
      context.log('failed', (message: Message) =>
        message.tag('failed').append(`Project name is required: ${pc.bold('motia create --plugin [project-name]')}\n`),
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
    questions.push({
      type: 'list',
      name: 'template',
      message: 'What template do you want to use? (Use arrow keys)',
      choices: Object.keys(choices).map((key) => ({
        name: choices[key],
        value: key,
      })),
    })
  }

  if (!args.name) {
    questions.push({
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
    })
  }

  if (questions.length > 0) {
    const answers: InteractiveAnswers = await inquirer.prompt(questions)
    name = args.name || answers.projectName
    template = args.template || answers.template
  }

  context.log('creating', (message: Message) => message.append('\n🔨 Creating your Motia project...\n'))

  await create({
    projectName: name || '.',
    template: template || 'motia-tutorial-typescript',
    cursorEnabled: true, // Default to true for cursor rules
    context,
  })

  process.exit(0)
}
