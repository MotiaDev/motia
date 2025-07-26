import { isApiStep, LockedData } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { collectFlows, getStepFiles } from '../../generate-locked-data'
import { Builder, StepsConfigFile } from './builder'
import { NodeBuilder } from './builders/node'
import { PythonBuilder } from './builders/python'
import { CliContext } from '../config-utils'
import { NoPrinter } from '@motiadev/core/dist/src/printer'

const hasPythonSteps = (projectDir: string) => {
  const stepFiles = getStepFiles(projectDir)
  return stepFiles.some((file) => file.endsWith('.py'))
}

export const build = async (context: CliContext): Promise<Builder> => {
  const projectDir = process.cwd()
  const builder = new Builder(projectDir)
  const stepsConfigPath = path.join(projectDir, 'dist', 'motia.steps.json')

  // Register language-specific builders
  builder.registerBuilder('node', new NodeBuilder(builder))

  const distDir = builder.distDir
  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  const lockedData = new LockedData(projectDir, 'memory', new NoPrinter())

  if (hasPythonSteps(projectDir)) {
    builder.registerBuilder('python', new PythonBuilder(builder))
  }

  const invalidSteps = await collectFlows(projectDir, lockedData)

  if (invalidSteps.length > 0) {
    context.exitWithError('Project contains invalid steps, please fix them before building')
  }

  await Promise.all(lockedData.activeSteps.map((step) => builder.buildStep(step)))

  const streams = lockedData.listStreams()

  for (const stream of streams) {
    if (stream.config.baseConfig.storageType === 'default') {
      builder.registerStateStream(stream)
    } else {
      context.log(stream.filePath, (message) =>
        message.tag('warning').append('Custom streams are not supported yet in the cloud'),
      )
    }
  }

  const routersConfig = await builder.buildApiSteps(lockedData.activeSteps.filter(isApiStep))
  const stepsFile: StepsConfigFile = {
    steps: builder.stepsConfig,
    streams: builder.streamsConfig,
    routers: routersConfig,
  }
  fs.writeFileSync(stepsConfigPath, JSON.stringify(stepsFile, null, 2))

  return builder
}
