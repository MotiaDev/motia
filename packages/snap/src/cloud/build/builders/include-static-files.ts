import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import { Step } from '@motiadev/core'
import { Builder } from '../builder'
import { Archiver } from './archiver'

export const includeStaticFiles = (steps: Step[], builder: Builder, archive: Archiver) => {
  for (const step of steps) {
    if ('includeFiles' in step.config) {
      const staticFiles = step.config.includeFiles

      if (!staticFiles || !Array.isArray(staticFiles) || staticFiles.length === 0) {
        continue
      }

      staticFiles.forEach((file) => {
        const matches = globSync(file, { cwd: path.dirname(step.filePath), absolute: true })
        matches.forEach((filePath: string) => {
          const relativeFilePath = path.relative(builder.projectDir, filePath)
          archive.append(fs.createReadStream(filePath), relativeFilePath)
        })
      })
    }
  }
}
