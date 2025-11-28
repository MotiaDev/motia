import { execSync } from 'child_process'
import { existsSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { getCliCommand } from '@/src/cli-helpers'
import { expect, test } from '@/src/motia-fixtures'

test.describe('CLI Rules Pull Command', () => {
  const testProjectPath = process.env.TEST_PROJECT_PATH || ''

  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test.afterEach(() => {
    const agentsPath = path.join(testProjectPath, 'AGENTS.md')
    const claudePath = path.join(testProjectPath, 'CLAUDE.md')

    if (existsSync(agentsPath)) {
      rmSync(agentsPath, { force: true })
    }
    if (existsSync(claudePath)) {
      rmSync(claudePath, { force: true })
    }
  })

  test('should create AI development guide files', async () => {
    execSync(getCliCommand('rules pull'), {
      cwd: testProjectPath,
      stdio: 'pipe',
    })

    const agentsPath = path.join(testProjectPath, 'AGENTS.md')
    const claudePath = path.join(testProjectPath, 'CLAUDE.md')

    expect(existsSync(agentsPath)).toBeTruthy()
    expect(existsSync(claudePath)).toBeTruthy()
  })

  test('should skip existing files without force flag', async () => {
    const agentsPath = path.join(testProjectPath, 'AGENTS.md')
    const testContent = 'test content'

    writeFileSync(agentsPath, testContent)

    const output = execSync(getCliCommand('rules pull'), {
      cwd: testProjectPath,
      encoding: 'utf-8',
    })

    expect(output).toContain('already exists')
  })

  test('should overwrite files with force flag', async () => {
    const agentsPath = path.join(testProjectPath, 'AGENTS.md')
    const testContent = 'test content to be overwritten'

    writeFileSync(agentsPath, testContent)

    execSync(getCliCommand('rules pull --force'), {
      cwd: testProjectPath,
      stdio: 'pipe',
    })

    expect(existsSync(agentsPath)).toBeTruthy()
  })
})
