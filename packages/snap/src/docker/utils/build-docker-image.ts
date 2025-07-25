import * as fs from 'fs'
import * as path from 'path'
import { promiseExec } from './promised-exec'

export const buildDockerImage = async (projectName?: string): Promise<string> => {
  if (!fs.existsSync(path.join(process.cwd(), 'Dockerfile'))) {
    console.error('Dockerfile not found')
    process.exit(1)
  }

  const dockerImageName = `${projectName}`
  const dockerBuildCommand = `docker build -t ${dockerImageName} .`

  console.log(`Building docker image: ${dockerImageName}`)
  await promiseExec(dockerBuildCommand)
  console.log(`Docker image ${dockerImageName} built successfully`)

  return dockerImageName
}
