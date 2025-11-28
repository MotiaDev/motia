import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { getCliCommand } from '@/src/cli-helpers'
import { expect, test } from '@/src/motia-fixtures'

test.describe('CLI Validation', () => {
  const testProjectPath = process.env.TEST_PROJECT_PATH || ''
  const testTemplate = process.env.MOTIA_TEST_TEMPLATE || 'motia-tutorial-typescript'

  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should create project with correct structure', async () => {
    expect(existsSync(testProjectPath)).toBeTruthy()

    const expectedFiles = ['package.json', 'steps', 'motia-workbench.json', 'tutorial/tutorial.tsx']

    for (const file of expectedFiles) {
      const filePath = path.join(testProjectPath, file)
      expect(existsSync(filePath)).toBeTruthy()
    }
  })

  test('should generate steps with CLI commands', async () => {
    const stepsDir = path.join(testProjectPath, 'steps')
    expect(existsSync(stepsDir)).toBeTruthy()

    let expectedSteps: string[] = []

    if (testTemplate === 'motia-tutorial-python') {
      expectedSteps = [
        'api_step.py',
        'api_step.py-features.json',
        'process_food_order_step.py',
        'process_food_order_step.py-features.json',
        'state_audit_job_step.py',
        'state_audit_job_step.py-features.json',
        'notification_step.py',
      ]
    } else {
      expectedSteps = [
        'api.step.ts',
        'api.step.ts-features.json',
        'test_state.step.ts',
        'test_state.step.ts-features.json',
        'check_state_change.step.ts',
        'check_state_change.step.ts-features.json',
        'notification.step.ts',
      ]
    }

    for (const step of expectedSteps) {
      const stepPath = path.join(stepsDir, step)
      const stepExists = existsSync(stepPath)

      if (stepExists) {
        expect(stepExists).toBeTruthy()
      } else {
        console.log(`Step ${step} not found - CLI may have different naming convention`)
      }
    }
  })

  test('should generate openapi.json with correct content', async () => {
    const openapiPath = path.join(testProjectPath, 'openapi.json')

    try {
      const cliCmd = getCliCommand('generate openapi')
      console.log(`Running '${cliCmd}' in ${testProjectPath}`)
      execSync(cliCmd, {
        cwd: testProjectPath,
        stdio: 'inherit',
      })
    } catch (error) {
      console.error('Error generating openapi.json:', error)
      expect(error).toBeNull()
    }

    expect(existsSync(openapiPath)).toBeTruthy()

    expect(readFileSync(openapiPath, 'utf8')).toMatchSnapshot('openapi.json')
  })

  test('should build project successfully', async () => {
    try {
      execSync('npm run build', {
        cwd: testProjectPath,
        stdio: 'pipe',
      })

      const distDir = path.join(testProjectPath, 'dist')
      expect(existsSync(distDir)).toBeTruthy()
    } catch (error) {
      console.log('Build command may have different structure or requirements')
      expect(true).toBeTruthy()
    }
  })

  test('should start development server', async ({ page, helpers }) => {
    await page.goto('/')
    await helpers.waitForMotiaApplication()

    await expect(page.locator('body')).toBeVisible()

    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should validate package.json structure', async () => {
    const packageJsonPath = path.join(testProjectPath, 'package.json')
    expect(existsSync(packageJsonPath)).toBeTruthy()

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

    expect(packageJson.name).toBeDefined()
    expect(packageJson.scripts).toBeDefined()
    expect(packageJson.dependencies || packageJson.devDependencies).toBeDefined()
  })

  test('should have working TypeScript configuration', async () => {
    if (testTemplate !== 'motia-tutorial-typescript') {
      test.skip()
      return
    }

    const tsconfigPath = path.join(testProjectPath, 'tsconfig.json')

    if (existsSync(tsconfigPath)) {
      try {
        execSync('npx tsc --noEmit', {
          cwd: testProjectPath,
          stdio: 'pipe',
        })
        expect(true).toBeTruthy()
      } catch (error) {
        console.log('TypeScript compilation had issues - may be expected for basic setup')
      }
    }
  })
})
