import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { printMotiaDockerIntro } from './utils/print-intro'
import { identifyUser } from '@/utils/analytics'
import { getProjectIdentifier, trackEvent } from '@motiadev/core'

const updatePackageJson = (): void => {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }
    packageJson.scripts.start = 'motia start'
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log('Updated package.json with start script')
  }
}

const createDockerfile = async () => {
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile')

  if (fs.existsSync(dockerfilePath)) {
    console.log('Dockerfile already exists')

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const shouldOverride = await new Promise<boolean>((resolve) => {
      rl.question('Do you want to override the existing Dockerfile? (y/N): ', (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      })
    })

    if (!shouldOverride) {
      console.log('Dockerfile generation cancelled')
      return
    }
  }

  const dockerfileContent = fs.readFileSync(
    path.join(__dirname, '../../../../docker', 'templates', 'MotiaDockerSample'),
    'utf-8',
  )

  try {
    fs.writeFileSync(dockerfilePath, dockerfileContent)
    console.log('Dockerfile generated successfully!')
  } catch (error) {
    console.error('Error generating Dockerfile:', (error as Error).message)
    throw error
  }
}

const createDockerignore = async () => {
  identifyUser()

  trackEvent('docker_setup_command', {
    project_name: getProjectIdentifier(process.cwd()),
  })

  const dockerignoreContent = fs.readFileSync(
    path.join(__dirname, '../../../../docker', 'templates', '.dockerignore.sample'),
    'utf-8',
  )

  const dockerignorePath = path.join(process.cwd(), '.dockerignore')

  if (fs.existsSync(dockerignorePath)) {
    console.log('.dockerignore already exists')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const shouldOverride = await new Promise<boolean>((resolve) => {
      rl.question('Do you want to override the existing .dockerignore? (y/N): ', (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      })
    })

    if (!shouldOverride) {
      console.log('.dockerignore generation cancelled')
      return
    }
  }

  try {
    fs.writeFileSync(dockerignorePath, dockerignoreContent)
    console.log('.dockerignore generated successfully!')
  } catch (error) {
    console.error('Error generating .dockerignore:', (error as Error).message)
    throw error
  }
}

export const setup = async (): Promise<void> => {
  printMotiaDockerIntro()

  await createDockerfile()
  await createDockerignore()
  updatePackageJson()
}
