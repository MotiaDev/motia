import { exec } from 'child_process'

interface ExecuteCommandOptions {
  silent?: boolean
}

export const executeCommand = async (
  command: string,
  rootDir: string,
  options?: ExecuteCommandOptions,
): Promise<string> => {
  const { silent = false } = options || {}

  return new Promise((resolve, reject) => {
    exec(command, { cwd: rootDir }, (error, stdout, stderr) => {
      if (error) {
        const stderrOutput = stderr?.toString() || ''
        const stdoutOutput = stdout?.toString() || ''
        const combinedOutput = `${stderrOutput} ${stdoutOutput} ${error.message}`

        const enhancedError = new Error(combinedOutput)
        enhancedError.stack = error.stack

        if (!silent) {
          console.error(`exec error: ${error}`)
          if (stderr) {
            console.error(stderr.toString())
          }
        }
        reject(enhancedError)
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
