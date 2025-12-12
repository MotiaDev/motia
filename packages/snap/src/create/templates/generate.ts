import { constants, promises as fs, mkdirSync, statSync } from 'fs'
import { globSync } from 'glob'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { CliContext } from '../../cloud/config-utils'
import { version } from '../../version'

export type Generator = (rootDir: string, context: CliContext) => Promise<void>

const replaceTemplateVariables = (content: string, projectName: string, version?: string): string => {
  const replacements: Record<string, string> = {
    '{{PROJECT_NAME}}': projectName,
    '{{PLUGIN_NAME}}': toPascalCase(projectName),
    '{{VERSION}}': version || 'latest',
  }

  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(new RegExp(key, 'g'), value)
  }, content)
}

const toPascalCase = (str: string): string => {
  // Remove @ and scope if present
  const name = str.replace(/^@[^/]+\//, '')
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const generateTemplateSteps = (templateFolder: string): Generator => {
  return async (rootDir: string, context: CliContext): Promise<void> => {
    const templatePath = path.join(__dirname, templateFolder)
    const files = globSync('**/*', { absolute: false, cwd: templatePath, dot: true })
    const projectName = path.basename(rootDir)

    try {
      for (const fileName of files) {
        const filePath = path.join(templatePath, fileName)
        const targetFilePath = path.join(rootDir, fileName)
        const targetDir = path.dirname(targetFilePath)

        mkdirSync(targetDir, { recursive: true })

        if (statSync(filePath).isDirectory()) {
          const folderPath = filePath.replace(templatePath, '')
          mkdirSync(path.join(rootDir, folderPath), { recursive: true })
          continue
        }

        const sanitizedFileName = fileName === 'requirements.txt' ? fileName : fileName.replace('.txt', '')
        const isWorkbenchConfig = fileName.match('motia-workbench.json')
        const generateFilePath = path.join(rootDir, sanitizedFileName)
        let content = await fs.readFile(filePath, 'utf8')

        if (isWorkbenchConfig) {
          try {
            // Use file descriptor to avoid TOCTOU vulnerability
            let fd: fs.FileHandle | null = null
            try {
              // Try to open existing file for reading
              fd = await fs.open(generateFilePath, constants.O_RDONLY)
              const existingWorkbenchConfig = await fd.readFile('utf8')
              const workbenchContent = JSON.parse(content)

              content = JSON.stringify([...JSON.parse(existingWorkbenchConfig), ...workbenchContent], null, 2)

              context.log('workbench-config-updated', (message) =>
                message.tag('success').append('Workbench config').append('has been updated.'),
              )
            } finally {
              if (fd) await fd.close()
            }
          } catch {
            void 0
          }
        } else {
          content = replaceTemplateVariables(content, projectName)
        }

        // Use file descriptor for atomic write operation
        let fd: fs.FileHandle | null = null
        try {
          fd = await fs.open(generateFilePath, constants.O_CREAT | constants.O_WRONLY | constants.O_TRUNC, 0o644)
          await fd.writeFile(content, 'utf8')
        } finally {
          if (fd) await fd.close()
        }
        context.log(sanitizedFileName, (message) => {
          message.tag('success').append('File').append(sanitizedFileName, 'cyan').append('has been created.')
        })
      }
    } catch (error) {
      console.error('Error generating template files:', error)
    }
  }
}

export const generatePluginTemplate = (templateFolder: string): Generator => {
  return async (rootDir: string, context: CliContext): Promise<void> => {
    const templatePath = path.join(__dirname, templateFolder)
    const files = globSync('**/*', { absolute: false, cwd: templatePath, dot: true })
    const projectName = path.basename(rootDir)

    try {
      for (const fileName of files) {
        const filePath = path.join(templatePath, fileName)
        const targetFilePath = path.join(rootDir, fileName)
        const targetDir = path.dirname(targetFilePath)

        mkdirSync(targetDir, { recursive: true })

        if (statSync(filePath).isDirectory()) {
          const folderPath = filePath.replace(templatePath, '')
          mkdirSync(path.join(rootDir, folderPath), { recursive: true })
          continue
        }

        const sanitizedFileName = fileName.replace('.txt', '')
        const generateFilePath = path.join(rootDir, sanitizedFileName)
        let content = await fs.readFile(filePath, 'utf8')

        content = replaceTemplateVariables(content, projectName, version)

        // Use file descriptor for atomic write operation
        let fd: fs.FileHandle | null = null
        try {
          fd = await fs.open(generateFilePath, constants.O_CREAT | constants.O_WRONLY | constants.O_TRUNC, 0o644)
          await fd.writeFile(content, 'utf8')
        } finally {
          if (fd) await fd.close()
        }
        context.log(sanitizedFileName, (message) => {
          message.tag('success').append('File').append(sanitizedFileName, 'cyan').append('has been created.')
        })
      }
    } catch (error) {
      console.error('Error generating template files:', error)
    }
  }
}
