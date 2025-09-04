import { Button } from '@motiadev/ui'
import { BaseNode, type NoopNodeProps } from '@motiadev/workbench'
import type React from 'react'

/**
 * For more information on how to override UI nodes, check documentation https://www.motia.dev/docs/workbench/ui-steps
 */
export const Node: React.FC<NoopNodeProps> = (data) => {
  const start = () => {
    fetch('/default', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return (
    <BaseNode title="Start" variant="noop" {...data} disableTargetHandle>
      <Button data-testid="start-flow-button" onClick={start}>
        Start Flow
      </Button>
    </BaseNode>
  )
}
