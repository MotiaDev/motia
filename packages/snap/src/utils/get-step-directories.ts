import fs from 'fs'
import path from 'path'
import colors from 'colors'

export interface GetStepDirectoriesOptions {
  projectDir: string
  cliParam?: string
}

export const getStepDirectories = (options: GetStepDirectoriesOptions): string[] => {
  const { projectDir, cliParam } = options

  const cliDirs = cliParam?.split(',').map((dir) => dir.trim()).filter(Boolean)

  const configuredDirs = cliDirs || ['steps', 'src']

  const absoluteDirs = configuredDirs.map((dir) => path.join(projectDir, dir))

  for (let i = 0; i < absoluteDirs.length; i++) {
    const absDir = absoluteDirs[i]
    const relDir = configuredDirs[i]
    
    if (!fs.existsSync(absDir)) {
      console.error(
        colors.red(`\n❌ Error: Configured step directory '${relDir}' does not exist`)
      )
      console.error(
        colors.gray(`   Please create the directory or update your configuration\n`)
      )
      console.error(
        colors.gray(`   Current configuration: --step-dirs=${cliParam} or MOTIA_STEP_DIRS=${process.env.MOTIA_STEP_DIRS}\n`)
      )
      
      throw new Error(`Step directory '${relDir}' does not exist`)
    }
  }

  return absoluteDirs
}
