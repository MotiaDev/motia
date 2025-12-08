import { useStreamItem } from '@motiadev/stream-client-react'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@motiadev/ui'
import { ReactFlowProvider } from '@xyflow/react'
import { ExternalLink, Workflow } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { motiaAnalytics } from '../../lib/motia-analytics'
import { useFlowStore } from '../../stores/use-flow-store'
import type { FlowConfigResponse, FlowResponse } from '../../types/flow'
import { FlowView } from './flow-view'

export const FlowPage = memo(() => {
  const selectedFlowId = useFlowStore((state) => state.selectedFlowId)
  const flows = useFlowStore(useShallow((state) => Object.values(state.flows)))

  const streamItemArgs = useMemo(
    () => ({ streamName: '__motia.flows', groupId: 'default', id: selectedFlowId ?? '' }),
    [selectedFlowId],
  )
  const { data: flow } = useStreamItem<FlowResponse>(streamItemArgs)

  const streamItemArgsConfig = useMemo(
    () => ({ streamName: '__motia.flowsConfig', groupId: 'default', id: selectedFlowId ?? '' }),
    [selectedFlowId],
  )
  const { data: flowConfig } = useStreamItem<FlowConfigResponse>(streamItemArgsConfig)

  if (flows.length === 0 || flow?.error) {
    return (
      <div className="flex w-full h-full bg-background">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow />
            </EmptyMedia>
            {flow?.error ? (
              <>
                <EmptyTitle>Error loading flow</EmptyTitle>
                <EmptyDescription>{flow.error}</EmptyDescription>
              </>
            ) : (
              <>
                <EmptyTitle>No flows registered</EmptyTitle>
                <EmptyDescription>
                  You haven't registered any flows yet. Get started by registering your first flow.
                </EmptyDescription>
              </>
            )}
          </EmptyHeader>
          <EmptyContent>
            <Button variant="link" asChild size="sm">
              <a
                href="https://www.motia.dev/docs/development-guide/flows"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => motiaAnalytics.track('flows_docs_link_clicked')}
              >
                Learn more <ExternalLink />
              </a>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  if (!flow) return null

  return (
    <ReactFlowProvider>
      <FlowView flow={flow} flowConfig={flowConfig!} />
    </ReactFlowProvider>
  )
})
FlowPage.displayName = 'FlowPage'
