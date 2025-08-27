import { isApiStep, LockedData } from '@motiadev/core'
import { NoPrinter } from '@motiadev/core/dist/src/printer'
import fs from 'fs'
import { collectFlows, getStepFiles } from '../../generate-locked-data'
import { Builder, StepsConfigFile } from '../build/builder'
import { NodeBuilder } from '../build/builders/node'
import { PythonBuilder } from '../build/builders/python'
import { distDir, projectDir, stepsConfigPath } from './constants'
import { BuildListener } from './listeners/listener.types'

const hasPythonSteps = (projectDir: string) => {
  const stepFiles = getStepFiles(projectDir)
  return stepFiles.some((file) => file.endsWith('.py'))
}

export const build = async (listener: BuildListener): Promise<Builder> => {
  const builder = new Builder(projectDir, listener)

  // Register language-specific builders
  builder.registerBuilder('node', new NodeBuilder(builder, listener))

  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  const lockedData = new LockedData(projectDir, 'memory', new NoPrinter())

  if (hasPythonSteps(projectDir)) {
    builder.registerBuilder('python', new PythonBuilder(builder, listener))
  }

  const invalidSteps = await collectFlows(projectDir, lockedData)

  if (invalidSteps.length > 0) {
    throw new Error('Project contains invalid steps, please fix them before building')
  }

  const stepPromises = lockedData.activeSteps.map((step) => builder.buildStep(step))
  const apiStepPromise = builder.buildApiSteps(lockedData.activeSteps.filter(isApiStep))
  await Promise.all([...stepPromises, apiStepPromise])

  const streams = lockedData.listStreams()

  for (const stream of streams) {
    if (stream.config.baseConfig.storageType === 'default') {
      builder.registerStateStream(stream)
    } else {
      listener.onWarning(stream.filePath, 'Custom streams are not supported yet in the cloud')
    }
  }

  const stepsFile: StepsConfigFile = {
    steps: builder.stepsConfig,
    streams: builder.streamsConfig,
    routers: builder.routersConfig,
  }
  fs.writeFileSync(stepsConfigPath, JSON.stringify(stepsFile, null, 2))

  return builder
}
