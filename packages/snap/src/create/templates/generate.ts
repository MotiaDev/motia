import { promises as fs } from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

export type Generator = (flowDir: string) => Promise<void>

export const generateTemplateSteps = (templateDir: string): Generator => {
  return async (flowDir: string): Promise<void> => {
    const stepsDir = path.join(__dirname, templateDir, 'steps')
    const files = globSync('*.txt', { absolute: true, cwd: stepsDir })

    try {
      for (const fileName of files) {
        const content = await fs.readFile(fileName, 'utf8')
        const filePath = path.join(flowDir, fileName.replace(stepsDir, '').replace('.txt', ''))

        await fs.writeFile(filePath, content, 'utf8')
        console.log(`Step ${filePath} has been created.`)
      }
    } catch (error) {
      console.error('Error generating template files:', error)
    }
  }
}
