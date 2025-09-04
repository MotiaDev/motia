import { promises as fs } from 'fs'
import path from 'path'
import type { StepAnswers } from './types'

/**
 * Reads a template file and replaces variables
 */
async function readTemplate(templatePath: string, answers: StepAnswers): Promise<string> {
  const content = await fs.readFile(templatePath, 'utf8')
  return replaceTemplateVariables(content, answers)
}

/**
 * Replaces template variables with actual values
 */
function replaceTemplateVariables(content: string, answers: StepAnswers): string {
  const replacements: Record<string, string | string[]> = {
    STEP_NAME: answers.name,
    DESCRIPTION: answers.description || '',
    FLOWS: JSON.stringify(answers.flows),
    EMITS: JSON.stringify(answers.emits),
    METHOD: answers.method || '',
    PATH: answers.path || '',
    SUBSCRIPTIONS: JSON.stringify(answers.subscriptions || []),
    CRON_EXPRESSION: answers.cronExpression || '',
    VIRTUAL_EMITS: JSON.stringify(answers.virtualEmits || []),
    VIRTUAL_SUBSCRIBES: JSON.stringify(answers.virtualSubscribes || []),
  }

  return Object.entries(replacements).reduce((content, [key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    return content.replace(regex, String(value))
  }, content)
}

/**
 * Generates the appropriate template based on language and type
 */
export async function generateTemplate(answers: StepAnswers): Promise<string> {
  const templateDir = path.join(__dirname, 'templates', answers.type)
  const templateFile = `template.${answers.language}.txt`
  const templatePath = path.join(templateDir, templateFile)

  try {
    return await readTemplate(templatePath, answers)
  } catch (error) {
    throw new Error(`Failed to generate template: ${error}`)
  }
}
