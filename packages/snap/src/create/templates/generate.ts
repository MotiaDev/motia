import { promises as fs, statSync, mkdirSync } from 'fs'
import * as path from 'path'
import { globSync } from 'glob'
import { CliContext } from '../../cloud/config-utils'

export type Generator = (rootDir: string, context: CliContext) => Promise<void>

export const generateTemplateSteps = (templateFolder: string): Generator => {
  return async (rootDir: string, context: CliContext): Promise<void> => {
    const templatePath = path.join(__dirname, templateFolder)
    const files = globSync('**/*', { absolute: false, cwd: templatePath })

    try {
      for (const fileName of files) {
        const filePath = path.join(templatePath, fileName)

        if (statSync(filePath).isDirectory() && !filePath.match(/services|utils|lib/)) {
          // ignore folders
          continue
        }

        if (statSync(filePath).isDirectory()) {
          const folderPath = path.basename(filePath)
          mkdirSync(path.join(rootDir, templateFolder, folderPath))
          continue
        }

        const sanitizedFileName = fileName.replace('.txt', '')
        const isWorkbenchConfig = fileName.match('motia-workbench.json')
        const generateFilePath = path.join(
          ...(isWorkbenchConfig ? [rootDir, sanitizedFileName] : [rootDir, templateFolder, sanitizedFileName]),
        )
        let content = await fs.readFile(filePath, 'utf8')

        // Make sure statSync doesn't break the execution if the file doesn't exist
        try {
          if (isWorkbenchConfig && statSync(generateFilePath).isFile()) {
            const existingWorkbenchConfig = await fs.readFile(generateFilePath, 'utf8')
            const workbenchContent = JSON.parse(content)

            content = JSON.stringify([...JSON.parse(existingWorkbenchConfig), ...workbenchContent], null, 2)

            context.log('workbench-config-updated', (message) =>
              message.tag('success').append('Workbench config').append('has been updated.'),
            )
          }
        } catch {
          void 0
        }

        await fs.writeFile(generateFilePath, content, 'utf8')
        context.log(sanitizedFileName, (message) => {
          message.tag('success').append('File').append(sanitizedFileName, 'cyan').append('has been created.')
        })
      }
    } catch (error) {
      console.error('Error generating template files:', error)
    }
  }
}
