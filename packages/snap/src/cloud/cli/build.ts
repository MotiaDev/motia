import { program } from 'commander'
import { CliContext, handler } from '../config-utils'
import { CliListener } from '../new-deployment/listeners/cli-listener'
import { build } from '../new-deployment/build'
import { buildValidation } from '../build/build-validation'

program
  .command('build')
  .description('Build the project')
  .action(
    handler(async (_: unknown, context: CliContext) => {
      const listener = new CliListener(context)
      const builder = await build(listener)
      const isValid = buildValidation(builder, listener)

      if (!isValid) {
        process.exit(1)
      }

      context.log('build-completed', (message) => message.tag('success').append('Build completed'))
    }),
  )
