import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { CliContext, Message } from '../cloud/config-utils'
import { copyWithWSLCompat } from './utils'

type PullRulesArgs = {
  rootDir: string
  force?: boolean
}

export const pullRules = async (args: PullRulesArgs, context: CliContext) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const cursorTemplateDir = path.join(__dirname, '..', 'cursor-rules', 'dot-files')
  const files = fs.readdirSync(cursorTemplateDir)

  for (const file of files) {
    const targetFile = path.join(args.rootDir, file)
    const isFolder = fs.statSync(path.join(cursorTemplateDir, file)).isDirectory()
    const type = isFolder ? 'Folder' : 'File'

    if (args.force || !fs.existsSync(targetFile)) {
      try {
        copyWithWSLCompat(path.join(cursorTemplateDir, file), targetFile, isFolder)
        context.log(`${file}-created`, (message: Message) =>
          message.tag('success').append(type).append(file, 'cyan').append('has been created.'),
        )
      } catch (error: any) {
        context.log(`${file}-error`, (message: Message) =>
          message
            .tag('error')
            .append('Failed to create')
            .append(type, 'yellow')
            .append(file, 'cyan')
            .append(`: ${error.message}`),
        )
        throw error
      }
    } else {
      context.log(`${file}-skipped`, (message: Message) =>
        message.tag('warning').append(type).append(file, 'cyan').append('already exists, skipping...'),
      )
    }
  }
}
