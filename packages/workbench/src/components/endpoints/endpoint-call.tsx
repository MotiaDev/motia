import { FC, useEffect, useMemo, useState } from 'react'
import { Loader2, Play, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { EndpointBadge } from './endpoint-badge'
import { ApiEndpoint } from './hooks/use-get-endpoints'
import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json'
import { usePathParams } from './hooks/use-path-params'
import { useStateStream } from './hooks/use-state-stream'
import { Sidebar } from '@/components/sidebar/sidebar'
import { JsonEditor } from './json-editor'
import { EndpointResponse } from './endpoint-response'
import { EndpointResponseSchema } from './endpoint-response-schema'

type Props = { endpoint: ApiEndpoint; onClose: () => void }

export const EndpointCall: FC<Props> = ({ endpoint, onClose }) => {
  const shouldHaveBody = ['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [responseCode, setResponseCode] = useState<number | undefined>(undefined)
  const [responseBody, setResponseBody] = useState<Record<string, unknown> | undefined>(undefined)
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined)
  const { body, setBody } = useJsonSchemaToJson(endpoint.bodySchema)
  const [isBodyValid, setIsBodyValid] = useState(true)
  const pathParams = usePathParams(endpoint.path)
  const [pathParamsValues, setPathParamsValues] = useState<Record<string, string>>(
    pathParams?.reduce((acc, param) => ({ ...acc, [param]: '' }), {} as Record<string, string>),
  )
  const [queryParamsValues, setQueryParamsValues] = useState<Record<string, string>>(
    endpoint.queryParams?.reduce((acc, param) => ({ ...acc, [param.name]: '' }), {} as Record<string, string>) ?? {},
  )
  const { data: responseBodyData, isStreamed } = useStateStream(responseBody)

  const isPlayEnabled = useMemo(() => {
    if (!pathParams) return true
    if (shouldHaveBody && !isBodyValid) return false

    return pathParams?.every((param) => pathParamsValues[param])
  }, [pathParams, pathParamsValues, shouldHaveBody, isBodyValid])

  const onPathParamChange = (param: string, value: string) => {
    setPathParamsValues((prev) => ({ ...prev, [param]: value }))
  }

  const onQueryParamChange = (param: string, value: string) => {
    setQueryParamsValues((prev) => ({ ...prev, [param]: value }))
  }

  useEffect(() => {
    if (endpoint.id) {
      setResponseCode(undefined)
      setResponseBody(undefined)
      setExecutionTime(undefined)
      setIsRequestLoading(false)
    }
  }, [endpoint.id])

  const handleRequest = async () => {
    setIsRequestLoading(true)
    const startTime = Date.now()
    const path = new URL(
      window.location.origin +
        pathParams.reduce((acc, param) => {
          return acc.replace(`:${param}`, pathParamsValues[param])
        }, endpoint.path),
    )
    for (const [key, value] of Object.entries(queryParamsValues)) {
      path.searchParams.set(key, value)
    }

    const response = await fetch(path.toString(), {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.method === 'GET' ? null : body,
    })

    const endTime = Date.now()
    const executionTime = endTime - startTime
    const json = await response.json()

    setResponseCode(response.status)
    setResponseBody(json)
    setExecutionTime(executionTime)
    setIsRequestLoading(false)
  }

  return (
    <Sidebar
      initialWidth={600}
      title={
        <div className="flex flex-row gap-2 items-center">
          <EndpointBadge variant={endpoint.method as never}>{endpoint.method.toUpperCase()}</EndpointBadge>
          <span className="text-md font-bold">{endpoint.path}</span>
        </div>
      }
      subtitle={<span className="text-xs text-muted-foreground">{endpoint.description}</span>}
      onClose={onClose}
      actions={[
        {
          icon: <X className="cursor-pointer w-4 h-4" onClick={onClose} />,
          onClick: onClose,
        },
      ]}
    >
      {!!pathParams.length && (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-card">
          <span className="text-xs font-bold">Path Params</span>
          <div className="flex flex-col gap-4">
            {pathParams.map((param) => (
              <div className="text-xs" key={param}>
                <div className="font-bold mb-2">{param}</div>
                <Input
                  className="w-full"
                  value={pathParamsValues[param]}
                  onChange={(e) => onPathParamChange(param, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {!!endpoint.queryParams?.length && (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-card">
          <span className="text-xs font-bold">Query Params</span>
          <div className="flex flex-col gap-4">
            {endpoint.queryParams.map((param) => (
              <div className="text-xs" key={param.name}>
                <div className="font-bold mb-2">{param.name}</div>
                <Input
                  className="w-full"
                  value={queryParamsValues[param.name]}
                  onChange={(e) => onQueryParamChange(param.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {shouldHaveBody && (
        <div className="flex flex-col rounded-lg mt-6 border">
          <div className="grid grid-cols-2 items-center px-4 py-2 border-b gap-y-2 bg-card min-h-[40px]">
            <span className="text-xs font-bold">Body</span>
          </div>
          <JsonEditor value={body} schema={endpoint.bodySchema} onChange={setBody} onValidate={setIsBodyValid} />
        </div>
      )}
      <Button
        className="w-fit"
        onClick={handleRequest}
        data-testid="endpoint-play-button"
        disabled={isRequestLoading || !isPlayEnabled}
      >
        {isRequestLoading ? <Loader2 className="animate-spin" /> : <Play />} Play
      </Button>

      {responseCode !== undefined && responseBody !== undefined && (
        <EndpointResponse
          responseCode={responseCode}
          responseBody={responseBodyData}
          isStreamed={isStreamed}
          executionTime={executionTime}
        />
      )}

      <EndpointResponseSchema
        items={Object.entries(endpoint?.responseSchema ?? {}).map(([status, schema]) => ({
          responseCode: status,
          responseBody: schema?.properties,
        }))}
      />
    </Sidebar>
  )
}
