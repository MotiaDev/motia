import './styles.css'
import { initLogListener } from './utils/init-log-listener'

export { LogsPage } from './components/logs-page'
export type { Log } from './types/log'

initLogListener()

export const config = {
  label: 'Logs',
  position: 'bottom',
  componentName: 'LogsPage',
  labelIcon: 'logs',
}
