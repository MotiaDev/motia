import * as fs from 'fs'
import * as path from 'path'
import { printMotiaDockerIntro } from './utils/print-intro'
import { promiseExec } from './utils/promised-exec'
import { buildDockerImage } from './utils/build-docker-image'
import { identifyUser } from '@/utils/analytics'
import { getProjectIdentifier, trackEvent } from '@motiadev/core'

export const run = async (hostPort = 3000, projectName?: string, skipBuild?: boolean): Promise<void> => {
  printMotiaDockerIntro()

  identifyUser()

  let nextProjectName = projectName
  if (!projectName) {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    nextProjectName = packageJson.name
  }

  trackEvent('docker_run_command', {
    dockerImageName: nextProjectName,
    project_name: getProjectIdentifier(process.cwd()),
  })

  console.log(`Preparing your docker container for project: ${nextProjectName}`)

  const dockerfileContent = fs.readFileSync(path.join(process.cwd(), 'Dockerfile'), 'utf-8')
  const dockerPort = dockerfileContent.match(/EXPOSE\s+(\d+)/)?.[1] || '3000'

  if (!fs.existsSync(path.join(process.cwd(), 'Dockerfile'))) {
    console.error('Dockerfile not found')
    process.exit(1)
  }

  let dockerImageName = nextProjectName
  const dockerRunCommand = `docker run -it --rm -p ${hostPort}:${dockerPort} ${dockerImageName}`

  if (!skipBuild) {
    dockerImageName = await buildDockerImage(dockerImageName)
  } else {
    // check if the image exists
    try {
      await promiseExec(`docker image inspect ${dockerImageName}`, false)
      console.log(`Docker image ${dockerImageName} found`)
    } catch (error) {
      console.error(`Docker image ${dockerImageName} not found, remove the skip flag to build it`)
      process.exit(1)
    }
  }

  console.log(`Running docker container: ${dockerImageName}`)
  await promiseExec(dockerRunCommand)
}
