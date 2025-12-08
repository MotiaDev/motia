import type { CliContext, Message } from '../cloud/config-utils'
import { templates } from './templates/index'

export const setupTemplate = async (template: string, rootDir: string, context: CliContext) => {
  if (!template || !(template in templates)) {
    context.log('template-not-found', (message: Message) =>
      message
        .tag('failed')
        .append(`Template ${template} not found, please use one of the following:`)
        .append(Object.keys(templates).join(', '), 'gray'),
    )

    process.exit(1)
  }

  await templates[template](rootDir, context)
}
