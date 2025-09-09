import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface UvPackageConfig {
  pythonVersion?: string
  platform?: string
  onlyBinary?: boolean
}

export const defaultUvConfig: UvPackageConfig = {
  pythonVersion: process.env.MOTIA_PYTHON_VERSION || '3.13',
  platform: process.env.MOTIA_PLATFORM || 'x86_64-manylinux2014',
  onlyBinary: process.env.MOTIA_ONLY_BINARY !== 'false',
}

export class UvPackager {
  constructor(
    private readonly projectDir: string,
    private readonly config: UvPackageConfig = defaultUvConfig,
  ) {}

  private async runCommand(
    command: string,
    args: string[],
    options?: {
      cwd?: string
      showOutput?: boolean
    },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
        if (options?.showOutput) {
          process.stdout.write(data)
        }
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          const errorPrefix = `Command '${command}'`
          reject(new Error(`${errorPrefix} failed: ${stderr || stdout}`))
        }
      })

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn ${command}: ${error.message}`))
      })
    })
  }

  async packageDependencies(targetDir: string): Promise<void> {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const requirementsFile = path.join(this.projectDir, 'requirements.txt')
    if (!fs.existsSync(requirementsFile)) {
      return
    }

    const args = [
      'pip',
      'install',
      '--target',
      targetDir,
      '--requirement',
      requirementsFile,
      '--python-version',
      this.config.pythonVersion || '3.13',
      '--python-platform',
      this.config.platform || 'x86_64-manylinux2014',
    ]

    if (this.config.onlyBinary) {
      args.push('--only-binary=:all:')
    }

    await this.runCommand('uv', args, { cwd: this.projectDir })
  }

  async packageSpecificDependencies(targetDir: string, packages: Set<string>): Promise<void> {
    if (packages.size === 0) {
      return
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const requirementsFile = path.join(this.projectDir, 'requirements.txt')
    const packageVersions = new Map<string, string>()

    if (fs.existsSync(requirementsFile)) {
      const requirements = fs.readFileSync(requirementsFile, 'utf-8')
      const lines = requirements.split('\n').filter((line) => line.trim() && !line.startsWith('#'))

      for (const line of lines) {
        const match = line.match(/^([a-zA-Z0-9_-]+)(.*)$/)
        if (match) {
          const [, packageName, versionSpec] = match
          packageVersions.set(packageName.toLowerCase(), versionSpec || '')
        }
      }
    }

    const packagesToInstall: string[] = []
    for (const pkg of packages) {
      const versionSpec = packageVersions.get(pkg.toLowerCase()) || ''
      packagesToInstall.push(`${pkg}${versionSpec}`)
    }

    if (packagesToInstall.length === 0) {
      return
    }

    const args = [
      'pip',
      'install',
      '--target',
      targetDir,
      '--python-version',
      this.config.pythonVersion || '3.13',
      '--python-platform',
      this.config.platform || 'x86_64-manylinux2014',
    ]

    if (this.config.onlyBinary) {
      args.push('--only-binary=:all:')
    }

    args.push(...packagesToInstall)

    await this.runCommand('uv', args, { cwd: this.projectDir })
  }
}
