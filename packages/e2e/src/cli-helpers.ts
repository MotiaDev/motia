import path from 'path'

export function getCliCommand(subcommand: string): string {
  const cliPath = process.env.MOTIA_CLI_PATH
  const motiaVersion = process.env.MOTIA_VERSION

  if (cliPath) {
    return `node ${cliPath} ${subcommand}`
  }

  if (motiaVersion) {
    return `npx motia@${motiaVersion} ${subcommand}`
  }

  return `npx motia ${subcommand}`
}

export function getCliPath(): string {
  const cliPath = process.env.MOTIA_CLI_PATH

  if (cliPath) {
    return cliPath
  }

  const rootPath = path.join(process.cwd(), '../..')
  return path.join(rootPath, 'packages/snap/dist/cjs/cli.js')
}
