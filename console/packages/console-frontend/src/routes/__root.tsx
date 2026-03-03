import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AlertTriangle } from 'lucide-react'
import { statusQuery } from '@/api/queries'
import { CORS_ERROR_MESSAGE, isCorsLikeFetchError } from '@/api/utils'
import { Sidebar } from '@/components/layout/Sidebar'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const { isError: hasConnectionIssue, error: connectionError } = useQuery(statusQuery)
  const connectionMessage = isCorsLikeFetchError(connectionError)
    ? CORS_ERROR_MESSAGE
    : "Unable to connect to the iii engine. Check that it's running on the expected host and port."

  return (
    <div className="font-mono antialiased flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 lg:ml-56">
        {hasConnectionIssue && (
          <div className="mx-3 md:mx-5 mt-3 bg-yellow/10 border border-yellow/30 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow">Connection Issue</p>
              <p className="text-xs text-muted">{connectionMessage}</p>
            </div>
          </div>
        )}
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}
