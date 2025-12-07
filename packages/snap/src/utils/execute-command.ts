import { exec } from 'child_process'

interface ExecuteCommandOptions {
  silent?: boolean
  env?: Record<string, string>
}

export const executeCommand = async (
  command: string,
  rootDir: string,
  options?: ExecuteCommandOptions,
): Promise<string> => {
  const { silent = false, env = {} } = options || {}

  return new Promise((resolve, reject) => {
    exec(command, { cwd: rootDir, env: { ...env } }, (error, stdout, stderr) => {
      if (error) {
        if (!silent) {
          console.error(`exec error: ${error}`)
        }
        reject(error)
        return
      }

      if (!silent) {
        if (stdout) console.log(stdout.toString())
        if (stderr) console.error(stderr.toString())
      }

      resolve(stdout.toString())
    })
  })
}
