import fs from 'fs'
import { execSync } from 'child_process'
import { internalLogger } from './internal-logger'

interface VenvConfig {
  requirementsList: string[]
  isVerbose?: boolean
}

export const installLambdaPythonPackages = ({ isVerbose = false, requirementsList }: VenvConfig): void => {
  const sitePackagesPath = `${process.env.PYTHON_SITE_PACKAGES}-lambda`

  for (const requirement of requirementsList) {
    if (!fs.existsSync(requirement)) {
      if (isVerbose) {
        internalLogger.warn(`requirements.txt not found at ${requirement}`)
      }
      return
    }

    try {
      // Install packages to lambda site-packages with platform specification
      const command = `pip install -r "${requirement}" --target "${sitePackagesPath}" --platform manylinux2014_x86_64 --only-binary=:all: --upgrade --upgrade-strategy only-if-needed`

      if (isVerbose) {
        console.log('📦 Installing Python packages with platform specification...')
        console.log('📦 Command:', command)
      }

      execSync(command, { stdio: 'inherit' })
      internalLogger.info('Python packages for lambda installed successfully')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      internalLogger.error('Failed to install Python packages for lambda', error.message)
      throw error
    }
  }
}
