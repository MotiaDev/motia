import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface UvPackageConfig {
  pythonVersion?: string
  platform?: string
  onlyBinary?: boolean
}

export const defaultUvConfig: UvPackageConfig = {
  pythonVersion: '3.11',
  platform: 'manylinux2014_x86_64',
  onlyBinary: true
}

export class UvPackager {
  constructor(
    private readonly projectDir: string,
    private readonly config: UvPackageConfig = defaultUvConfig
  ) {}

  async checkUvInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('uv', ['--version'], { stdio: 'pipe' })
      child.on('close', (code) => resolve(code === 0))
      child.on('error', () => resolve(false))
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
      'pip', 'install',
      '--target', targetDir,
      '--requirement', requirementsFile,
      '--python-version', this.config.pythonVersion || '3.11',
      '--force-reinstall'
    ]

    if (this.config.onlyBinary) {
      args.push('--only-binary=:all:')
    }

    await this.runUvCommand(args)
  }

  private async runUvCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('uv', args, {
        cwd: this.projectDir,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`UV command failed: ${stderr || stdout}`))
        }
      })

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn UV: ${error.message}`))
      })
    })
  }
}
