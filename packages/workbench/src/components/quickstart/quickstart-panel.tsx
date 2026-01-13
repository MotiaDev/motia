import { Equal, X } from 'lucide-react'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import { QuickstartCodeDisplay } from './quickstart-code-display'
import { MotiaQuickstart } from './quickstart-engine'
import { QuickstartNav } from './quickstart-nav'
import { type TutorialStepConfig, useQuickstartStore } from './quickstart-store'

const MIN_WIDTH = 300
const MIN_HEIGHT = 200
const DEFAULT_WIDTH_PERCENT = 66
const DEFAULT_HEIGHT_PERCENT = 66

export const QuickstartPanel: FC = () => {
  const { isOpen, code, steps, activeStepId, visitedStepIds, close, open, setActiveStep, visitStep, run } =
    useQuickstartStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: DEFAULT_WIDTH_PERCENT, height: DEFAULT_HEIGHT_PERCENT })
  const [isResizingWidth, setIsResizingWidth] = useState(false)
  const [isResizingHeight, setIsResizingHeight] = useState(false)

  // Handle horizontal resize (left edge)
  const handleWidthMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingWidth(true)
  }, [])

  // Handle vertical resize (bottom edge)
  const handleHeightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingHeight(true)
  }, [])

  useEffect(() => {
    if (!isResizingWidth && !isResizingHeight) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidth) {
        const windowWidth = window.innerWidth
        const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100
        setDimensions((prev) => ({
          ...prev,
          width: Math.max((MIN_WIDTH / windowWidth) * 100, Math.min(90, newWidth)),
        }))
      }
      if (isResizingHeight) {
        const windowHeight = window.innerHeight
        const newHeight = (e.clientY / windowHeight) * 100
        setDimensions((prev) => ({
          ...prev,
          height: Math.max((MIN_HEIGHT / windowHeight) * 100, Math.min(90, newHeight)),
        }))
      }
    }

    const handleMouseUp = () => {
      setIsResizingWidth(false)
      setIsResizingHeight(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingWidth, isResizingHeight])

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
    <div
      ref={panelRef}
      className="fixed top-0 right-0 bg-background border-l border-b border-border z-50 flex flex-col shadow-xl"
      style={{
        width: `${dimensions.width}%`,
        height: `${dimensions.height}%`,
      }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize group hover:bg-primary/20 transition-colors"
        onMouseDown={handleWidthMouseDown}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border opacity-60 group-hover:opacity-100 transition-opacity">
          <Equal className="h-4 w-4 text-muted-foreground rotate-90" />
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize group hover:bg-primary/20 transition-colors"
        onMouseDown={handleHeightMouseDown}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border opacity-60 group-hover:opacity-100 transition-opacity">
          <Equal className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold">Quickstart</h2>
        <button onClick={close} className="p-1 rounded-md hover:bg-muted transition-colors" aria-label="Close panel">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content area with navigation */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <QuickstartNav
          steps={steps}
          activeStepId={activeStepId}
          visitedStepIds={visitedStepIds}
          onStepClick={(stepId) => {
            visitStep(stepId)
            setActiveStep(stepId)
          }}
          onRun={run}
        />
        <QuickstartCodeDisplay code={code} steps={steps} activeStepId={activeStepId} />
      </div>
    </div>
  )
}
