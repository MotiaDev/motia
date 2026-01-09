import { BookOpen, Code, Play, X } from 'lucide-react'
import { type FC, useEffect } from 'react'
import { QuickstartCodeDisplay } from './quickstart-code-display'
import { MotiaQuickstart } from './quickstart-engine'
import { QuickstartNav, type QuickstartNavItem } from './quickstart-nav'
import { useQuickstartStore } from './quickstart-store'

export const QuickstartPanel: FC = () => {
  const { isOpen, code, close, open } = useQuickstartStore()

  useEffect(() => {
    const unsubscribe = MotiaQuickstart.onStart(async () => {
      try {
        // Fetch the raw code from typescript.step.ts
        const processCwd = (window as { processCwd?: string }).processCwd
        const response = await fetch(`/@fs${processCwd}/src/typescript.step.ts`)
        if (response.ok) {
          const code = await response.text()
          open(code)
        } else {
          console.error('Failed to load typescript.step.ts:', response.status)
        }
      } catch (error) {
        console.error('Error loading quickstart code:', error)
      }
    })

    return unsubscribe
  }, [open])

  if (!isOpen || !code) {
    return null
  }

  // Scaffold navigation items for future use
  const navItems: QuickstartNavItem[] = [
    {
      id: 'code',
      icon: <Code className="w-5 h-5" />,
      label: 'Code',
      onClick: () => {},
      isActive: true,
    },
    {
      id: 'tutorial',
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Tutorial',
      onClick: () => {},
    },
    {
      id: 'run',
      icon: <Play className="w-5 h-5" />,
      label: 'Run',
      onClick: () => {},
    },
  ]

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
        <QuickstartNav items={navItems} />
        <QuickstartCodeDisplay code={code} />
      </div>
    </div>
  )
}
