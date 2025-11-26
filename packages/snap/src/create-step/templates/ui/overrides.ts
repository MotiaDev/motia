import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { StepAnswers } from '../../types'

/**
 * Generates a React component override for the step
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export async function generateOverride(answers: StepAnswers): Promise<string> {
  const templatePath = path.join(__dirname, `${answers.type}.step.txt`)
  const content = await fs.readFile(templatePath, 'utf8')

  const replacements: Record<string, string | string[]> = {
    STEP_NAME: answers.name,
    DESCRIPTION: answers.description || '',
    TYPE: answers.type,
    FLOWS: JSON.stringify(answers.flows),
    EMITS: JSON.stringify(answers.emits),
  }

  return Object.entries(replacements).reduce((content, [key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    return content.replace(regex, String(value))
  }, content)
}
