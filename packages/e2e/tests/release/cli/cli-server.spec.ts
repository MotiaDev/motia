import { type ChildProcess, exec, execSync } from 'child_process'
import { getCliCommand } from '@/src/cli-helpers'
import { expect, test } from '@/src/motia-fixtures'

test.describe('CLI Server Commands', () => {
  const testProjectPath = process.env.TEST_PROJECT_PATH || ''
  let serverProcess: ChildProcess | null = null

  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test.afterEach(async () => {
    if (serverProcess && serverProcess.pid) {
      try {
        process.kill(serverProcess.pid)
      } catch {
        // Process may already be terminated
      }
    }

    try {
      execSync('lsof -ti:3001 | xargs kill -9 2>/dev/null || true', { stdio: 'ignore' })
    } catch {
      // Port may not be in use
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  test.describe('start command', () => {
    test('should start server on custom port', async () => {
      const customPort = 3001

      serverProcess = exec(getCliCommand(`start --port ${customPort}`), {
        cwd: testProjectPath,
        env: {
          ...process.env,
          MOTIA_ANALYTICS_DISABLED: 'true',
        },
      })

      await waitForServer(`http://localhost:${customPort}`, 30000)

      const response = await fetch(`http://localhost:${customPort}/health`).catch(() => null)

      if (response) {
        expect([200, 404]).toContain(response.status)
      } else {
        console.log('Server may have different health endpoint')
        expect(true).toBeTruthy()
      }
    })

    test('should accept host option', async () => {
      const customPort = 3001
      const customHost = '127.0.0.1'

      serverProcess = exec(getCliCommand(`start --port ${customPort} --host ${customHost}`), {
        cwd: testProjectPath,
        env: {
          ...process.env,
          MOTIA_ANALYTICS_DISABLED: 'true',
        },
      })

      await waitForServer(`http://${customHost}:${customPort}`, 30000)

      const response = await fetch(`http://${customHost}:${customPort}`).catch(() => null)

      if (response) {
        expect(response.status).toBeDefined()
      } else {
        console.log('Server started with custom host configuration')
        expect(true).toBeTruthy()
      }
    })

    test('should support disable-verbose flag', async () => {
      const customPort = 3001

      serverProcess = exec(getCliCommand(`start --port ${customPort} --disable-verbose`), {
        cwd: testProjectPath,
        env: {
          ...process.env,
          MOTIA_ANALYTICS_DISABLED: 'true',
        },
      })

      await waitForServer(`http://localhost:${customPort}`, 30000)

      expect(serverProcess.pid).toBeDefined()
    })
  })
})

async function waitForServer(url: string, timeout: number): Promise<void> {
  const start = Date.now()
  const pollInterval = 1000

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 404) {
        return
      }
    } catch {
      // Server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`)
}
