import { exec } from 'child_process'

interface ExecuteCommandOptions {
  silent?: boolean
}

export const executeCommand = async (command: string, rootDir: string, options?: ExecuteCommandOptions): Promise<string> => {
  const { silent = false } = options || {}
  
  return new Promise((resolve, reject) => {
    exec(command, { cwd: rootDir }, (error, stdout, stderr) => {
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
