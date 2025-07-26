import * as fs from 'fs'
import * as path from 'path'
import { printMotiaDockerIntro } from './utils/print-intro'
import { buildDockerImage } from './utils/build-docker-image'
import { identifyUser } from '@/utils/analytics'
import { getProjectIdentifier, trackEvent } from '@motiadev/core'

export const build = async (projectName?: string): Promise<void> => {
  printMotiaDockerIntro()

  identifyUser()

  let nextProjectName = projectName
  if (!projectName) {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    nextProjectName = packageJson.name
  }

  trackEvent('docker_build_command', {
    dockerImageName: nextProjectName,
    project_name: getProjectIdentifier(process.cwd()),
  })

  console.log(`Preparing the docker image for project: ${nextProjectName}`)

  await buildDockerImage(nextProjectName)
}
