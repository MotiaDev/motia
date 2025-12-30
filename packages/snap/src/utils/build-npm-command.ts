import { shouldUseNoBinLinks } from './detect-wsl'

/**
 * Build an npm install command with appropriate flags for the environment.
 * Adds --no-bin-links when running in WSL2 on Windows filesystem to prevent
 * EPERM errors during npm install.
 *
 * @param baseCommand - The base npm command (e.g., 'npm install --save' or 'npm install')
 * @param targetPath - The path where the command will be executed
 * @returns The command with appropriate flags added
 */
export function buildNpmCommand(baseCommand: string, targetPath: string): string {
  // Only modify npm commands
  if (!baseCommand.startsWith('npm ')) {
    return baseCommand
  }

  // Add --no-bin-links if needed for WSL2 on Windows filesystem
  if (shouldUseNoBinLinks(targetPath)) {
    // Insert --no-bin-links after 'npm install' but before any other flags
    // Handle both 'npm install' and 'npm install --save' patterns
    if (baseCommand.includes('npm install')) {
      return baseCommand.replace('npm install', 'npm install --no-bin-links')
    }
  }

  return baseCommand
}

/**
 * Get install commands for all package managers, with WSL2 compatibility for npm.
 *
 * @param targetPath - The path where the command will be executed
 * @returns Record of package manager to install command
 */
export function getInstallCommands(targetPath: string): Record<string, string> {
  return {
    npm: buildNpmCommand('npm install', targetPath),
    yarn: 'yarn install',
    pnpm: 'pnpm install',
    bun: 'bun install',
  }
}

/**
 * Get install commands with --save flag for all package managers, with WSL2 compatibility for npm.
 *
 * @param targetPath - The path where the command will be executed
 * @returns Record of package manager to install command
 */
export function getInstallSaveCommands(targetPath: string): Record<string, string> {
  return {
    npm: buildNpmCommand('npm install --save', targetPath),
    yarn: 'yarn add',
    pnpm: 'pnpm add',
    bun: 'bun add',
  }
}
