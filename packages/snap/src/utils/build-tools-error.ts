export interface BuildToolsErrorInfo {
  isBuildToolsError: boolean
  errorMessage: string
}

export function detectBuildToolsError(error: unknown): BuildToolsErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = error instanceof Error ? error.stack || error.message : String(error)
  const combinedError = `${errorMessage} ${errorString}`.toLowerCase()

  const isBuildToolsError =
    combinedError.includes('make: not found') ||
    combinedError.includes('gcc: not found') ||
    combinedError.includes('command failed: make') ||
    combinedError.includes('redis-memory-server') ||
    combinedError.includes('failed to download/install redis binaries') ||
    combinedError.includes('failed to compile redis')

  return {
    isBuildToolsError,
    errorMessage: errorMessage,
  }
}

export function getBuildToolsErrorMessage(context: 'install' | 'runtime' = 'runtime'): string {
  const prefix = context === 'install' ? 'Failed to install dependencies: ' : ''

  return `${prefix}Missing build tools required for redis-memory-server.

This is common in minimal Docker images (e.g., node:24-slim).

To fix, install the required dependencies:
  apt-get update && apt-get install -y ca-certificates git build-essential

Note: build-essential includes make, gcc, and other compilation tools needed to build Redis.

Or install Redis system package:
  apt-get update && apt-get install -y redis-server
  export REDISMS_SYSTEM_BINARY=/usr/bin/redis-server

Or use the full node image:
  docker run --rm node:24 npx motia@latest create my-app --template starter-typescript`
}

export function handleBuildToolsError(error: unknown, context: 'install' | 'runtime' = 'runtime'): boolean {
  const { isBuildToolsError } = detectBuildToolsError(error)

  if (isBuildToolsError) {
    if (context === 'runtime') {
      console.error('\n❌ [Redis Memory Server] Failed to start:', getBuildToolsErrorMessage(context))
    } else {
      console.error('\n❌', getBuildToolsErrorMessage(context))
    }
    return true
  }

  return false
}
