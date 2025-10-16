import fs from 'fs'
import path from 'path'
import type { CliContext } from '../cloud/config-utils'

type PullRulesArgs = {
  rootDir: string
  force?: boolean
}

export const pullRules = async (args: PullRulesArgs, context: CliContext) => {
  const cursorTemplateDir = path.join(__dirname, '..', 'cursor-rules', 'dot-files')
  const files = fs.readdirSync(cursorTemplateDir)

  for (const file of files) {
    const targetFile = path.join(args.rootDir, file)
    const isFolder = fs.statSync(path.join(cursorTemplateDir, file)).isDirectory()
    const type = isFolder ? 'Folder' : 'File'

    if (args.force || !fs.existsSync(targetFile)) {
      fs.cpSync(path.join(cursorTemplateDir, file), targetFile, {
        recursive: isFolder,
        force: true,
      })

      context.log(`${file}-created`, (message) =>
        message.tag('success').append(type).append(file, 'cyan').append('has been created.'),
      )
    } else {
      context.log(`${file}-skipped`, (message) =>
        message.tag('warning').append(type).append(file, 'cyan').append('already exists, skipping...'),
      )
    }
  }
}
