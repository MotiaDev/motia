import { FlowView } from '@/views/flow/flow-view'
import { useParams } from 'react-router'
import { useFetchFlows } from '@/hooks/use-fetch-flows'

export const Flow = () => {
  const { id } = useParams()

  const { flow, flowConfig } = useFetchFlows(id!)

  if (!flow || flow.error)
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center">
        <p>{flow?.error}</p>
      </div>
    )

  return (
    <div className="w-full h-full bg-background">
      <FlowView flow={flow} flowConfig={flowConfig!} />
    </div>
  )
}
