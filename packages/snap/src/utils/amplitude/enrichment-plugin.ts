import type { EnrichmentPlugin, Event } from '@amplitude/analytics-types'
import { environmentDetector } from '@motiadev/core'
import os from 'os'

export class MotiaEnrichmentPlugin implements EnrichmentPlugin {
  name = 'motia-enrichment'
  type = 'enrichment' as const

  async setup(): Promise<undefined> {
    return
  }

  async execute(event: Event): Promise<Event> {
    event.app_version = process.env.npm_package_version || 'unknown'

    if (!event.extra) {
      event.extra = {}
    }

    event.extra.motia_version = process.env.npm_package_dependencies_motia || 'unknown'
    event.extra.source = 'backend'
    event.os_name = os.platform() === 'darwin' ? 'macOS' : os.platform() === 'win32' ? 'Windows' : 'Linux'
    event.os_version = os.release()
    event.platform = os.platform()
    event.device_model = os.type()
    event.device_manufacturer = os.machine()
    event.device_brand = os.platform() === 'darwin' ? 'Apple' : os.platform() === 'win32' ? 'Microsoft' : 'Unknown'

    const envContext = environmentDetector.getEnvironmentContext()
    event.extra.is_docker = envContext.is_docker
    event.extra.is_ci = envContext.is_ci
    event.extra.is_test = envContext.is_test
    event.extra.environment_type = envContext.environment_type
    event.extra.execution_context = envContext.execution_context

    return event
  }
}
