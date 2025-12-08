import type { NoopNodeProps } from '../../../publicComponents/node-props'
import { NoopNode } from '../../../publicComponents/noop-node'

export const NoopFlowNode = ({ data }: NoopNodeProps) => {
  return <NoopNode data={data} />
}
