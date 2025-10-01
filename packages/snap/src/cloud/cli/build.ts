import { program } from 'commander'
import { CliContext, handler } from '../config-utils'
import { CliListener } from '../new-deployment/listeners/cli-listener'
import { build } from '../new-deployment/build'
import { buildValidation } from '../build/build-validation'

program
  .command('build')
  .description('Build the project')
  .option('-s, --step-dirs <dirs>', 'Comma-separated list of directories to scan for steps (e.g., "src,steps")')
  .action(
    handler(async (arg: { stepDirs?: string }, context: CliContext) => {
      const listener = new CliListener(context)
      const builder = await build(listener, arg.stepDirs)
      const isValid = buildValidation(builder, listener)

      if (!isValid) {
        process.exit(1)
      }

      context.log('build-completed', (message) => message.tag('success').append('Build completed'))
    }),
  )
