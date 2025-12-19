import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface TabErrorBoundaryProps {
  tabId: string
  children: ReactNode
}

interface TabErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isDetailsExpanded: boolean
}

export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsExpanded: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<TabErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    console.error(`Error in tab "${this.props.tabId}":`, error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsExpanded: false,
    })
  }

  toggleDetails = (): void => {
    this.setState((prev) => ({ isDetailsExpanded: !prev.isDetailsExpanded }))
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, isDetailsExpanded } = this.state
      const { tabId } = this.props

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-foreground">
          <div className="flex flex-col items-center gap-4 max-w-lg w-full">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              An error occurred in the <span className="font-mono text-foreground">{tabId}</span> tab.
            </p>

            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>

            <div className="w-full mt-4 border border-border rounded-lg overflow-hidden">
              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-2 w-full px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                {isDetailsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="text-sm font-medium">Error Details</span>
              </button>

              {isDetailsExpanded && (
                <div className="p-4 bg-card text-sm space-y-4 overflow-auto max-h-80">
                  <div>
                    <h4 className="font-semibold text-destructive mb-1">Error Message</h4>
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-muted p-2 rounded">
                      {error?.message || 'Unknown error'}
                    </pre>
                  </div>

                  {error?.stack && (
                    <div>
                      <h4 className="font-semibold text-muted-foreground mb-1">Stack Trace</h4>
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-muted p-2 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-semibold text-muted-foreground mb-1">Component Stack</h4>
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-muted p-2 rounded overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
