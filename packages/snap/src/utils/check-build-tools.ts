import { spawn } from 'child_process'
import os from 'os'

export interface BuildToolsCheckResult {
  success: boolean
  missingTools: string[]
  installInstructions: string
}

const checkCommand = async (command: string, args: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'pipe', shell: process.platform === 'win32' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

const getPlatform = (): 'linux' | 'darwin' | 'win32' | 'unknown' => {
  const platform = os.platform()
  if (platform === 'linux' || platform === 'darwin' || platform === 'win32') {
    return platform
  }
  return 'unknown'
}

const getInstallInstructions = (missingTools: string[], platform: string): string => {
  const toolsList = missingTools.join(', ')

  switch (platform) {
    case 'linux':
      return (
        `Missing build tools: ${toolsList}\n\n` +
        'To install on Ubuntu/Debian:\n' +
        '  sudo apt-get update && sudo apt-get install build-essential pkg-config\n\n' +
        'To install on Fedora/RHEL:\n' +
        '  sudo dnf install gcc gcc-c++ make pkg-config gawk jemalloc-devel\n\n' +
        'To install on Arch Linux:\n' +
        '  sudo pacman -S base-devel pkg-config'
      )
    case 'darwin':
      return (
        `Missing build tools: ${toolsList}\n\n` +
        'To install on macOS:\n' +
        '  xcode-select --install\n\n' +
        'Or using Homebrew:\n' +
        '  brew install make gcc pkg-config'
      )
    case 'win32':
      return (
        `Missing build tools: ${toolsList}\n\n` +
        'The Redis Memory Server requires build tools to compile Redis.\n' +
        'On Windows, we recommend using an external Redis instance instead.\n\n' +
        'Option 1: Use an external Redis server\n' +
        '  Set MOTIA_DISABLE_MEMORY_SERVER=true and configure MOTIA_REDIS_HOST\n\n' +
        'Option 2: Install Visual Studio Build Tools\n' +
        '  Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/\n' +
        '  Select "Desktop development with C++" workload\n\n' +
        'Option 3: Use WSL (Windows Subsystem for Linux)\n' +
        '  Run your project inside WSL with Linux build tools installed'
      )
    default:
      return (
        `Missing build tools: ${toolsList}\n\n` +
        'Please install make and a C compiler (gcc or clang) for your platform.\n' +
        'Alternatively, use an external Redis server by setting:\n' +
        '  MOTIA_DISABLE_MEMORY_SERVER=true\n' +
        '  MOTIA_REDIS_HOST=<your-redis-host>'
      )
  }
}

/**
 * Check if required build tools are available for compiling Redis.
 * The redis-memory-server package needs to compile Redis from source,
 * which requires make and a C compiler.
 */
export const checkBuildTools = async (): Promise<BuildToolsCheckResult> => {
  const platform = getPlatform()
  const missingTools: string[] = []

  // On Windows, build tools work differently
  if (platform === 'win32') {
    // Check for nmake (Visual Studio) or make (MinGW/MSYS)
    const hasNmake = await checkCommand('where', ['nmake'])
    const hasMake = await checkCommand('where', ['make'])

    if (!hasNmake && !hasMake) {
      missingTools.push('make (or nmake)')
    }

    // Check for cl.exe (Visual Studio) or gcc (MinGW)
    const hasCl = await checkCommand('where', ['cl'])
    const hasGcc = await checkCommand('where', ['gcc'])

    if (!hasCl && !hasGcc) {
      missingTools.push('C compiler (cl.exe or gcc)')
    }
  } else {
    // Unix-like systems (Linux, macOS)
    const hasMake = await checkCommand('make', ['--version'])
    if (!hasMake) {
      missingTools.push('make')
    }

    // Check for gcc or cc (clang on macOS)
    const hasGcc = await checkCommand('gcc', ['--version'])
    const hasCc = await checkCommand('cc', ['--version'])

    if (!hasGcc && !hasCc) {
      missingTools.push('gcc (or cc)')
    }
  }

  if (missingTools.length > 0) {
    return {
      success: false,
      missingTools,
      installInstructions: getInstallInstructions(missingTools, platform),
    }
  }

  return {
    success: true,
    missingTools: [],
    installInstructions: '',
  }
}

/**
 * Throws an error if required build tools are missing.
 * Use this before attempting to start the Redis Memory Server.
 */
export const ensureBuildTools = async (): Promise<void> => {
  const result = await checkBuildTools()

  if (!result.success) {
    throw new Error('Redis Memory Server requires build tools to compile Redis.\n\n' + result.installInstructions)
  }
}
