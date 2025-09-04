import inquirer, { QuestionCollection } from 'inquirer'
import colors from 'colors'
import { create } from './index'
import { CliContext } from '../cloud/config-utils'

interface InteractiveAnswers {
  template: string
  projectName: string
  proceed: boolean
}

const choices: Record<string, string> = {
  nodejs: 'Base (TypeScript)',
  python: 'Base (Python)',
}

interface CreateInteractiveArgs {
  name?: string
  template?: string
  confirm?: boolean
}

export const createInteractive = async (args: CreateInteractiveArgs, context: CliContext): Promise<void> => {
  context.log('welcome', (message) => message.append('\n🚀 ' + colors.bold('Welcome to Motia Project Creator!')))

  const questions: QuestionCollection<any>[] = []

  let name = args.name
  let template = args.template

  if (!args.template) {
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

  if (!args.confirm) {
    questions.push({
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed? [Y/n]:',
      default: true,
    })
  }

  if (questions.length > 0) {
    const answers: InteractiveAnswers = await inquirer.prompt(questions)

    if (!answers.proceed) {
      context.log('cancelled', (message) => message.tag('info').append('\n❌ Project creation cancelled.'))
      return
    }

    name = args.name || answers.projectName
    template = args.template || answers.template
  }

  context.log('creating', (message) => message.append('\n🔨 Creating your Motia project...\n'))

  await create({
    projectName: name || '.',
    template: template || 'nodejs',
    cursorEnabled: true, // Default to true for cursor rules
    context,
  })
}
