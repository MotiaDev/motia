import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@motiadev/ui'
import { ChevronsUpDown, Workflow } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFetchFlows } from '@/hooks/use-fetch-flows'
import { analytics } from '@/lib/analytics'
import { useFlowStore } from '@/stores/use-flow-store'

export const FlowTabMenuItem = () => {
  useFetchFlows()

  const selectFlowId = useFlowStore((state) => state.selectFlowId)
  const flows = useFlowStore(useShallow((state) => Object.values(state.flows)))
  const selectedFlowId = useFlowStore((state) => state.selectedFlowId)

  if (flows.length === 0) {
    return null
  }

  const handleFlowSelect = (flowId: string) => {
    selectFlowId(flowId)
    analytics.track('flow_selected', { flow: flowId })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          data-testid="flows-dropdown-trigger"
          className="flex flex-row justify-center items-center gap-2 cursor-pointer"
        >
          <Workflow />
          {selectedFlowId ?? 'No flow selected'}
          <ChevronsUpDown className="size-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-background text-foreground flows-dropdown">
        {flows.map((item) => (
          <DropdownMenuItem
            data-testid={`dropdown-${item}`}
            key={`dropdown-${item}`}
            className="cursor-pointer gap-2 flow-link"
            onClick={() => handleFlowSelect(item)}
          >
            {item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
