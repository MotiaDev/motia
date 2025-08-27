import inquirer from 'inquirer'
import colors from 'colors'
import { create } from './index'
import { CliContext } from '../cloud/config-utils'

interface InteractiveAnswers {
  template: string
  projectName: string
  proceed: boolean
}

const choices: Record<string, string> = {
  typescript: 'Base (TypeScript)',
  python: 'Base (Python)',
}

interface CreateInteractiveArgs {
  skipConfirmation?: boolean
}

export const createInteractive = async (_args: CreateInteractiveArgs, context: CliContext): Promise<void> => {
  context.log('welcome', (message) => message.append('\n🚀 ' + colors.bold('Welcome to Motia Project Creator!')))

  const answers: InteractiveAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: '1. What template do you want to use? (Use arrow keys)',
      choices: Object.keys(choices).map((key) => ({
        name: choices[key],
        value: key,
      })),
    },
    {
      type: 'input',
      name: 'projectName',
      message: '2. Project name (leave blank to use current folder):',
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
    {
      type: 'confirm',
      name: 'proceed',
      message: '3. Proceed? [Y/n]:',
      default: true,
    },
  ])

  if (!answers.proceed) {
    context.log('cancelled', (message) => message.tag('info').append('\n❌ Project creation cancelled.'))
    return
  }

  context.log('creating', (message) => message.append('\n🔨 Creating your Motia project...\n'))

  await create({
    projectName: answers.projectName || '.',
    template: answers.template,
    cursorEnabled: true, // Default to true for cursor rules
    context,
  })
}
