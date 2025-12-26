import { execSync } from 'child_process'
import { getCliCommand } from '@/src/cli-helpers'
import { expect, test } from '@/src/motia-fixtures'

test.describe('CLI Version Command', () => {
  const testProjectPath = process.env.TEST_PROJECT_PATH || ''

  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should display version information', async () => {
    const output = execSync(getCliCommand('version'), {
      cwd: testProjectPath,
      encoding: 'utf-8',
    })

    expect(output).toContain('Motia CLI v')
  })

  test('should display version with -V flag', async () => {
    const output = execSync(getCliCommand('-V'), {
      cwd: testProjectPath,
      encoding: 'utf-8',
    })

    expect(output).toMatch(/\d+\.\d+\.\d+/)
  })

  test('should display version with --version flag', async () => {
    const output = execSync(getCliCommand('--version'), {
      cwd: testProjectPath,
      encoding: 'utf-8',
    })

    expect(output).toMatch(/\d+\.\d+\.\d+/)
  })
})
