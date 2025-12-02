import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import path from 'path'

const copyDirectory = (source: string, destination: string) => {
  if (!existsSync(source)) {
    throw new Error(`Missing BullMQ assets at ${source}`)
  }

  if (existsSync(destination)) {
    rmSync(destination, { recursive: true, force: true })
  }

  mkdirSync(destination, { recursive: true })

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const srcPath = path.join(source, entry.name)
    const destPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else if (entry.isFile()) {
      cpSync(srcPath, destPath)
    }
  }
}

type ConfigureOptions = {
  projectPath: string
  workspaceRoot: string
}

export const configureBullMQProject = ({ projectPath, workspaceRoot }: ConfigureOptions) => {
  const assetsRoot = path.join(workspaceRoot, 'packages', 'e2e', 'assets', 'bullmq', 'steps', 'bullmq-tests')
  const targetSteps = path.join(projectPath, 'steps', 'bullmq-tests')
  copyDirectory(assetsRoot, targetSteps)
}
