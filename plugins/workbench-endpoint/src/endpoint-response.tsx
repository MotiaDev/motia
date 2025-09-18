import { useStateStream } from './hooks/use-state-stream.js'
import { useThemeStore } from './stores/use-theme-store.js'
import { Panel } from '@motiadev/ui'
import { XCircle } from 'lucide-react'
import { FC, useMemo } from 'react'
import ReactJson from 'react18-json-view'

type EndpointResponseProps = {
  responseCode: number | string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBody: Record<string, any> | undefined
  executionTime?: number
}

const getStatusMessage = (status: number) => {
  switch (status) {
    case 200:
      return 'OK'
    case 201:
      return 'Created'
    case 204:
      return 'No Content'
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not Found'
    case 500:
      return 'Internal Server Error'
    default:
      return 'Unknown Status'
  }
}

export const EndpointResponse: FC<EndpointResponseProps> = ({ responseCode, executionTime, responseBody }) => {
  const theme = useThemeStore((state: { theme: string }) => state.theme)
  const { data, isStreamed, originalData } = useStateStream(responseBody)

  const statusMessage = useMemo(() => getStatusMessage(Number(responseCode)), [responseCode])
  const isError = Number(responseCode) >= 400

  if (!responseBody || !responseCode) {
    return null
  }

  return (
    <Panel
      data-testid={'endpoint-response-container'}
      tabs={
        isStreamed
          ? [
              {
                label: 'Streamed Response',
                content: (
                  <ReactJson src={data as object} dark={theme === 'dark'} style={{ backgroundColor: 'transparent' }} />
                ),
              },
              {
                label: 'Original',
                content: (
                  <ReactJson
                    src={originalData as object}
                    dark={theme === 'dark'}
                    style={{ backgroundColor: 'transparent' }}
                  />
                ),
              },
            ]
          : undefined
      }
      title={
        <div className="flex flex-row justify-between items-center flex-1">
          <div className="flex items-center gap-2">
            {isError && <XCircle className="text-red-500 w-4 h-4" />}
            <span className="font-bold text-xs">
              {responseCode} - {statusMessage}
            </span>
          </div>
          {!!executionTime && (
            <span className="text-xs text-muted-foreground justify-self-end">
              Execution time: <span className="font-bold">{executionTime}ms</span>
            </span>
          )}
        </div>
      }
      subtitle={
        isStreamed && (
          <span className="col-span-2 flex flex-row items-center font-medium text-card-foreground text-xs mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 relative">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-[ping_1.5s_ease-in-out_infinite]" />
              <span className="absolute inset-0 rounded-full bg-green-500" />
            </span>
            Object is being streamed, this is not the actual response from the API Endpoint
          </span>
        )
      }
    >
      {!isStreamed && (
        <ReactJson src={data as object} dark={theme === 'dark'} style={{ backgroundColor: 'transparent' }} />
      )}
    </Panel>
  )
}
