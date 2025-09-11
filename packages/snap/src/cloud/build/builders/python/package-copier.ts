import fs from 'fs'
import path from 'path'
import { findPythonSitePackagesDir } from '../../../../utils/python-version-utils'

export interface PackageCopyResult {
  copiedPackages: string[]
  skippedPackages: string[]
  errors: string[]
}

export class PackageCopier {
  private lambdaSitePackagesPath: string | null = null

  constructor(
    private readonly projectDir: string,
    private readonly pythonVersion: string = '3.13',
  ) {}

  private getLambdaSitePackagesPath(): string | null {
    if (this.lambdaSitePackagesPath) {
      return this.lambdaSitePackagesPath
    }

    const venvPath = path.join(this.projectDir, 'python_modules')
    const libPath = path.join(venvPath, 'lib')

    try {
      const actualPythonVersionPath = findPythonSitePackagesDir(libPath, this.pythonVersion)
      this.lambdaSitePackagesPath = path.join(venvPath, 'lib', actualPythonVersionPath, 'site-packages-lambda')

      if (!fs.existsSync(this.lambdaSitePackagesPath)) {
        return null
      }

      return this.lambdaSitePackagesPath
    } catch (_error) {
      return null
    }
  }

  isLambdaSitePackagesAvailable(): boolean {
    return this.getLambdaSitePackagesPath() !== null
  }
}
