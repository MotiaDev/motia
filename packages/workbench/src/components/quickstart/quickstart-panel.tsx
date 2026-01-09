import { X } from 'lucide-react'
import { type FC, useEffect } from 'react'
import { QuickstartCodeDisplay } from './quickstart-code-display'
import { MotiaQuickstart } from './quickstart-engine'
import { QuickstartNav } from './quickstart-nav'
import { type TutorialStepConfig, useQuickstartStore } from './quickstart-store'

export const QuickstartPanel: FC = () => {
  const { isOpen, code, steps, activeStepId, close, open, setActiveStep } = useQuickstartStore()

  useEffect(() => {
    const unsubscribe = MotiaQuickstart.onStart(async () => {
      try {
        const workbenchBase = (window as { workbenchBase?: string }).workbenchBase ?? ''

        // Fetch the code file via the raw file API endpoint
        const codeResponse = await fetch(`${workbenchBase}/__raw-file?path=src/typescript.step.ts`)
        if (!codeResponse.ok) {
          console.error('Failed to load typescript.step.ts:', codeResponse.status)
          return
        }
        const code = await codeResponse.text()

        // Fetch the tutorial config via the raw file API endpoint
        const configResponse = await fetch(`${workbenchBase}/__raw-file?path=src/tutorial.config.ts`)
        let steps: TutorialStepConfig[] = []

        if (configResponse.ok) {
          const configText = await configResponse.text()
          // Parse the config - extract the tutorialConfig array
          const configMatch = configText.match(/export const tutorialConfig[^=]*=\s*(\[[\s\S]*?\n\])/)
          if (configMatch) {
            try {
              // Evaluate the config (it's a simple array of objects)
              steps = new Function(`return ${configMatch[1]}`)()
            } catch (e) {
              console.error('Failed to parse tutorial config:', e)
            }
          }
        }

        open(code, steps)
      } catch (error) {
        console.error('Error loading quickstart:', error)
      }
    })

    return unsubscribe
  }, [open])

  if (!isOpen || !code) {
    return null
  }

  return (
    <div className="fixed top-0 right-0 w-1/2 h-screen bg-background border-l border-border z-50 flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold">Quickstart</h2>
        <button onClick={close} className="p-1 rounded-md hover:bg-muted transition-colors" aria-label="Close panel">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content area with navigation */}
      <div className="flex flex-1 overflow-hidden">
        <QuickstartNav steps={steps} activeStepId={activeStepId} onStepClick={setActiveStep} />
        <QuickstartCodeDisplay code={code} steps={steps} activeStepId={activeStepId} />
      </div>
    </div>
  )
}
