import type { CliContext } from '@/cloud/config-utils'
import { templates } from './templates'

export const setupTemplate = async (template: string, rootDir: string, context: CliContext) => {
  if (!template || !(template in templates)) {
    context.log('template-not-found', (message) =>
      message.tag('failed').append(`Template ${template} not found, please use one of the following:`),
    )
    context.log('available-templates', (message) =>
      message.tag('info').append(`Available templates: \n\n ${Object.keys(templates).join('\n')}`),
    )

    return
  }

  await templates[template](rootDir, context)
}
