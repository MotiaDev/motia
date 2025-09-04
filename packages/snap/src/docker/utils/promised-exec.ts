import { spawn } from 'child_process'

export const promiseExec = (command: string, inheritStdio = true): Promise<void> => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')
    const child = spawn(cmd, args, {
      stdio: inheritStdio ? 'inherit' : 'pipe',
    })

    child.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with exit code ${code}`)
        if (inheritStdio) {
          console.error(`Error running command: cmd ${command}, error ${error.message}`)
        }
        reject(error)
        return
      }
      resolve()
    })

    child.on('error', (error) => {
      if (inheritStdio) {
        console.error(`Error running command: cmd ${command}, error ${error.message}`)
      }
      reject(error)
    })
  })
}
