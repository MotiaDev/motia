import { LockedData } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { collectFlows } from '../../generate-locked-data'
import { Builder } from './builder'
import { NodeBuilder } from './builders/node'
import { PythonBuilder } from './builders/python'
import { CliContext } from '../config-utils'

export const build = async (context: CliContext): Promise<Builder> => {
  const projectDir = process.cwd()
  const builder = new Builder(projectDir)
  const stepsConfigPath = path.join(projectDir, 'dist', 'motia.steps.json')
  const streamsConfigPath = path.join(projectDir, 'dist', 'motia.streams.json')

  // Register language-specific builders
  builder.registerBuilder('node', new NodeBuilder(builder))

  const distDir = builder.distDir
  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  const lockedData = new LockedData(projectDir)

  lockedData.disablePrinter()

  const invalidSteps = await collectFlows(projectDir, lockedData)
  const hasPythonSteps = lockedData.activeSteps.some((step) => step.filePath.endsWith('.py'))

  if (hasPythonSteps) {
    builder.registerBuilder('python', new PythonBuilder(builder))
  }

  if (invalidSteps.length > 0) {
    context.exitWithError('Project contains invalid steps, please fix them before building')
  }

  await Promise.all(lockedData.activeSteps.map((step) => builder.buildStep(step)))

  const streams = lockedData.listStreams()

  for (const stream of streams) {
    if (stream.config.baseConfig.storageType === 'state') {
      builder.registerStateStream(stream)
    } else {
      context.log(stream.filePath, (message) =>
        message.tag('warning').append('Custom streams are not supported yet in the cloud'),
      )
    }
  }

  fs.writeFileSync(stepsConfigPath, JSON.stringify(builder.stepsConfig, null, 2))
  fs.writeFileSync(streamsConfigPath, JSON.stringify(builder.streamsConfig, null, 2))

  return builder
}
