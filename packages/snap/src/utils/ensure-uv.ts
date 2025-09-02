import { spawn } from 'child_process'

export const ensureUvInstalled = async (): Promise<void> => {
  if (!(await checkCommand('uv', ['--version']))) {
    if (await installUv()) {
      console.log('✅ UV installed successfully')
    } else {
      throw new Error(
        'UV could not be installed automatically. Please install manually using one of these methods:\n' +
          '  • curl -LsSf https://astral.sh/uv/install.sh | sh (recommended)\n' +
          '  • pip install uv\n' +
          '  • pip3 install uv\n' +
          '  • brew install uv (macOS)\n' +
          'For more information, visit: https://github.com/astral-sh/uv',
      )
    }
  }
}

const checkCommand = async (command: string, args: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'pipe' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

const installUv = async (): Promise<boolean> => {
  console.log('Installing UV...')

  try {
    // Try official installer script first (works on Unix-like systems)
    if (process.platform !== 'win32') {
      try {
        console.log('Attempting to install UV via official installer...')
        await runCommand('sh', ['-c', 'curl -LsSf https://astral.sh/uv/install.sh | sh'])
        
        // Add UV to PATH for current session if installed in default location
        const uvPath = `${process.env.HOME}/.cargo/bin`
        if (process.env.PATH && !process.env.PATH.includes(uvPath)) {
          process.env.PATH = `${uvPath}:${process.env.PATH}`
        }
        
        if (await verifyUvInstallation()) {
          return true
        }
      } catch {
        console.log('Official installer failed, trying pip...')
      }
    }

    // Fallback to pip installation
    const pipAvailable = await checkCommand('pip', ['--version'])
    if (pipAvailable) {
      await runCommand('pip', ['install', 'uv'])
      return await verifyUvInstallation()
    }

    return false
  } catch (error) {
    console.error('Failed to install UV:', error)
    return false
  }
}

async function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
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
        const errorPrefix = `Command '${command}'`
        reject(new Error(`${errorPrefix} failed: ${stderr || stdout}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn ${command}: ${error.message}`))
    })
  })
}

const verifyUvInstallation = async (): Promise<boolean> => {
  // Give the system a moment to update PATH
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Try to run UV to verify it's installed
  try {
    await runCommand('uv', ['--version'])
    return true
  } catch {
    return false
  }
}
