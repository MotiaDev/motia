import { MotiaTutorial, TutorialConfig } from '@motiadev/tutorial'
import { Button } from '@motiadev/ui'
import { Book } from 'lucide-react'
import { useStreamItem } from '@motiadev/stream-client-react'
import { FlowConfigResponse } from '@/types/flow'
import { FC, useCallback, useEffect } from 'react'
import { useFlowStore } from '@/stores/use-flow-store'

export const TutorialButton: FC = () => {
  const selectFlowId = useFlowStore((state) => state.selectFlowId)
  const { data: flowConfig } = useStreamItem<FlowConfigResponse>({
    streamName: '__motia.flowsConfig',
    groupId: 'default',
    id: 'basic-tutorial',
  })

  const kickStartTutorial = useCallback(
    (resetState = false) => {
      const tutorialStepIndex = new URLSearchParams(window.location.search).get('tutorialStepIndex')
      const config: TutorialConfig = {
        resetSkipState: resetState,
      }
      if (tutorialStepIndex && !resetState) {
        config.initialStepIndex = Number(tutorialStepIndex)
      }
      selectFlowId('basic-tutorial')
      MotiaTutorial.start(config)

      if (resetState) {
        const url = new URL(window.location.href)
        url.searchParams.delete('tutorialStepIndex')
        window.history.replaceState(null, '', url)
      }
    },
    [selectFlowId],
  )

  useEffect(() => {
    if (import.meta.env.VITE_MOTIA_TUTORIAL_DISABLED || !flowConfig) {
      console.log('Tutorial disabled or flow not found')
      return
    }

    kickStartTutorial()

    return () => MotiaTutorial.close()
  }, [flowConfig, kickStartTutorial])

  if (import.meta.env.VITE_MOTIA_TUTORIAL_DISABLED) {
    return null
  }

  return (
    <Button variant="accent" size="sm" onClick={() => kickStartTutorial(true)}>
      <Book className="h-4 w-4" />
      <span>Tutorial</span>
    </Button>
  )
}
