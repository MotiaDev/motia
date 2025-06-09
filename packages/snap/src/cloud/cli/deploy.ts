import colors from 'colors'
import path from 'path'
import { build } from '../build'
import { cloudCli } from '../cli'
import { handler } from '../config-utils'
import { VersionManager } from '../deploy/deploy'
import { validateStepsConfig } from '../deploy/utils/validation'

cloudCli
  .command('deploy')
  .description('Deploy a new version to Motia Cloud')
  .requiredOption('-k, --api-key <key>', 'The API key for authentication', process.env.MOTIA_API_KEY)
  .requiredOption('-v, --version-name <version>', 'The version to deploy')
  .option('-p, --project-id <id>', 'Override the selected project')
  .option('-s, --environment-id <id>', 'Override the selected environment')
  .option('-e, --env-file <path>', 'Path to environment file')
  .action(
    handler(async (arg, context) => {
      const versionManager = new VersionManager()
      const builder = await build(context)
      const { errors, warnings } = validateStepsConfig(builder)

      if (warnings.length > 0) {
        warnings.map((warning, index) => {
          context.log(`build-warnings-${index}`, (message) => {
            message.tag('warning').append(warning.message)
          })
        })
      }

      if (errors.length > 0) {
        context.log('build-failed', (message) => {
          message.box(['Unable to deploy to Motia Cloud, please fix the following errors'], 'red')
        })
        console.log('')

        const errorTag = colors.red('✗ [ERROR]')

        errors.map((error) => {
          const relativePath = path.relative(builder.projectDir, error.step.filePath)
          const filePath = colors.gray(`[${relativePath}]`)
          console.log(`${errorTag} ${filePath} ${error.message}`)
        })

        console.log(colors.gray('\n--------------------------------\n'))
        context.log('build-failed-end', (message) => {
          message.tag('failed').append('Deployment canceled', 'red')
        })
        process.exit(1)
      }

      console.log(colors.green('✓ [SUCCESS]'), 'Build completed')

      await versionManager.deploy(context, process.cwd(), arg.versionName, {
        projectId: arg.projectId,
        environmentId: arg.environmentId,
        envFile: arg.envFile,
      })
      context.exit(0)
    }),
  )
