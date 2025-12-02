import { Button } from '@motiadev/ui'
import { memo } from 'react'
import { useStreamRbacStore } from '../store'

export const ErrorBanner = memo(() => {
  const { error, clearError } = useStreamRbacStore()

  if (!error) {
    return null
  }

  return (
    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-red-300">Stream Error</h3>
          </div>
          <div className="ml-7">
            <p className="text-sm text-red-200 mb-1">
              <span className="font-mono font-medium">{error.code}</span>
            </p>
            <p className="text-sm text-red-100">{error.message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearError}
          className="flex-shrink-0 text-red-300 hover:text-red-100 hover:bg-red-800/30"
          aria-label="Dismiss error"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  )
})

ErrorBanner.displayName = 'ErrorBanner'
