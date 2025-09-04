import colors from 'colors'
import inquirer from 'inquirer'
import { HTTP_METHODS, LANGUAGES, STEP_TYPES, type StepAnswers } from './types'

export const getStepAnswers = async (): Promise<StepAnswers> => {
  console.log('\n📝 ', colors.bold('Create a new Motia step\n'))

  // Basic information prompts
  const basicInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Step name:',
      validate: (input: string) => {
        if (input.length === 0) return 'Name is required'
        if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(input)) {
          return 'Name must start with a letter and contain only letters, numbers, hyphens, and underscores'
        }
        return true
      },
    },
    {
      type: 'list',
      name: 'type',
      message: 'Select step type:',
      choices: STEP_TYPES.map((type) => ({
        name: type.toUpperCase(),
        value: type,
      })),
    },
  ])

  let answers = { ...basicInfo }

  /* biome-ignore lint/suspicious/noExplicitAny: migration */
  const languageAnswer: any = {
    type: 'list',
    name: 'language',
    message: 'Select language:',
    choices: LANGUAGES.map((lang) => ({
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      value: lang,
    })),
  }

  // Type-specific configuration prompts
  if (answers.type === 'api') {
    const apiConfig = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'HTTP method:',
        choices: HTTP_METHODS,
      },
      {
        type: 'input',
        name: 'path',
        message: 'API path (e.g. /users):',
        validate: (input: string) => {
          if (!input.startsWith('/')) return 'Path must start with /'
          return true
        },
      },
    ])
    answers = { ...answers, ...apiConfig }
  } else if (answers.type === 'event') {
    const eventConfig = await inquirer.prompt([
      languageAnswer,
      {
        type: 'input',
        name: 'subscriptions',
        message: 'Event subscriptions (comma-separated):',
        filter: (input: string) =>
          input
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      },
    ])
    answers = { ...answers, ...eventConfig }
  } else if (answers.type === 'cron') {
    const cronConfig = await inquirer.prompt([
      languageAnswer,
      {
        type: 'input',
        name: 'cronExpression',
        message: 'Cron expression:',
        validate: (input: string) => {
          if (!input) return 'Cron expression is required'
          const parts = input.split(' ')
          if (parts.length !== 5) return 'Invalid cron expression format'
          return true
        },
      },
    ])
    answers = { ...answers, ...cronConfig }
  } else if (answers.type === 'noop') {
    const noopConfig = await inquirer.prompt([
      languageAnswer,
      {
        type: 'input',
        name: 'virtualEmits',
        message: 'Virtual emits (comma-separated):',
        filter: (input: string) =>
          input
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      },
      {
        type: 'input',
        name: 'virtualSubscribes',
        message: 'Virtual subscribes (comma-separated):',
        filter: (input: string) =>
          input
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      },
    ])
    answers = { ...answers, ...noopConfig }
  }

  // Common configuration prompts
  const commonConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'flows',
      message: 'Flow names (comma-separated):',
      filter: (input: string) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      validate: (input: string) => {
        if (input.length === 0) return 'At least one flow is required'
        return true
      },
    },
    {
      type: 'input',
      name: 'emits',
      message: 'Events to emit (comma-separated):',
      filter: (input: string) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Step description:',
    },
    {
      type: 'confirm',
      name: 'createOverride',
      message: 'Create UI component override?',
      default: false,
    },
  ])

  const nextAnswers = { ...answers, ...commonConfig } as StepAnswers

  return {
    ...nextAnswers,
    language: nextAnswers.type === 'api' ? 'typescript' : nextAnswers.language,
  }
}
