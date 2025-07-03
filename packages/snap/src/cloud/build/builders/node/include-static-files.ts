import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import archiver from 'archiver'
import { Step } from '@motiadev/core'
import { Builder } from '../../builder'

export const includeStaticFiles = (steps: Step[], builder: Builder, archive: archiver.Archiver) => {
  const staticFiles: string[] = []

  for (const step of steps) {
    if ('includeFiles' in step.config) {
      const staticFiles = step.config.includeFiles

      if (!staticFiles || !Array.isArray(staticFiles) || staticFiles.length === 0) {
        continue
      }

      staticFiles.forEach((file) => {
        const globPattern = path.join(path.dirname(step.filePath), file)
        const matches = globSync(globPattern)
        matches.forEach((filePath: string) => {
          const relativeFilePath = path.dirname(filePath.replace(builder.projectDir, ''))
          staticFiles.push(path.resolve(relativeFilePath, path.basename(filePath)))
        })
      })
    }
  }

  for (const filePath of staticFiles) {
    archive.append(fs.createReadStream(filePath), { name: filePath })
  }
}
