import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@motiadev/ui'
import { ChevronsUpDown, Workflow } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFetchFlows } from '../../hooks/use-fetch-flows'
import { motiaAnalytics } from '../../lib/motia-analytics'
import { useFlowStore } from '../../stores/use-flow-store'

export const FlowTabMenuItem = () => {
  useFetchFlows()

  const selectFlowId = useFlowStore((state) => state.selectFlowId)
  const flows = useFlowStore(useShallow((state) => Object.values(state.flows)))
  const selectedFlowId = useFlowStore((state) => state.selectedFlowId)

  const handleFlowSelect = (flowId: string) => {
    selectFlowId(flowId)
    motiaAnalytics.track('flow_selected', { flow: flowId })
  }

  return (
    <div className="flex flex-row justify-center items-center gap-2 cursor-pointer">
      <Workflow />
      {flows.length > 0 && selectedFlowId ? selectedFlowId : 'Flows'}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="flex flex-row justify-center items-center gap-2 cursor-pointer"
            data-testid="flows-dropdown-trigger"
          >
            <ChevronsUpDown className="size-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-background text-foreground flows-dropdown">
          {flows.length === 0 ? (
            <DropdownMenuItem disabled>Loading flows...</DropdownMenuItem>
          ) : (
            flows.map((item) => (
              <DropdownMenuItem
                data-testid={`dropdown-${item}`}
                key={`dropdown-${item}`}
                className="cursor-pointer gap-2 flow-link"
                onSelect={() => handleFlowSelect(item)}
              >
                {item}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
