import { program } from 'commander'
import { type CliContext, handler } from '../config-utils'
import { build } from '../new-deployment/build'
import { CliListener } from '../new-deployment/listeners/cli-listener'

program
  .command('build')
  .description('Build the project')
  .action(
    handler(async (_: unknown, context: CliContext) => {
      const listener = new CliListener(context)
      await build(listener)
      context.log('build-completed', (message) => message.tag('success').append('Build completed'))
    }),
  )
