import React, { useMemo, useState } from 'react'
import { Loader2, Play, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { EndpointBadge } from './endpoint-badge'
import { ApiEndpoint } from './hooks/use-get-endpoints'
import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json'
import { usePathParams } from './hooks/use-path-params'
import { useStateStream } from './hooks/use-state-stream'

type Props = { endpoint: ApiEndpoint; onClose: () => void }

export const EndpointCall: React.FC<Props> = ({ endpoint, onClose }) => {
  const shouldHaveBody = ['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [responseCode, setResponseCode] = useState<number>()
  const [responseBody, setResponseBody] = useState<Record<string, unknown>>()
  const [executionTime, setExecutionTime] = useState<number>()
  const { body, setBody } = useJsonSchemaToJson(endpoint.bodySchema)
  const pathParams = usePathParams(endpoint.path)
  const [pathParamsValues, setPathParamsValues] = useState<Record<string, string>>(
    pathParams?.reduce((acc, param) => ({ ...acc, [param]: '' }), {} as Record<string, string>),
  )
  const [queryParamsValues, setQueryParamsValues] = useState<Record<string, string>>(
    endpoint.queryParams?.reduce((acc, param) => ({ ...acc, [param.name]: '' }), {} as Record<string, string>) ?? {},
  )
  const { data: responseBodyData } = useStateStream(responseBody)

  const isPlayEnabled = useMemo(() => {
    if (!pathParams) return true

    return pathParams?.every((param) => pathParamsValues[param])
  }, [pathParams, pathParamsValues])

  const onPathParamChange = (param: string, value: string) => {
    setPathParamsValues((prev) => ({ ...prev, [param]: value }))
  }

  const onQueryParamChange = (param: string, value: string) => {
    setQueryParamsValues((prev) => ({ ...prev, [param]: value }))
  }

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
    <div className="flex flex-col gap-2 overflow-y-auto">
      <div className="text-xs flex flex-row gap-2 items-center justify-between w-full">
        <span className="font-bold">Request</span>
        <div className="flex flex-row gap-2 items-center hover:bg-white/10 rounded-md p-1">
          <X className="cursor-pointer w-4 h-4" onClick={onClose} />
        </div>
      </div>
      <div className="flex flex-row gap-2 items-center">
        <EndpointBadge variant={endpoint.method as never}>{endpoint.method.toUpperCase()}</EndpointBadge>
        <span className="text-md font-bold">{endpoint.path}</span>
      </div>
      <span className="text-xs text-muted-foreground">{endpoint.description}</span>

      {!!pathParams.length && (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted">
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
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted">
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
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted">
          <span className="text-xs font-bold">Body</span>
          <Textarea
            className="w-full font-mono font-medium min-h-[200px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      )}

      <Button className="w-fit" onClick={handleRequest} disabled={isRequestLoading || !isPlayEnabled}>
        {isRequestLoading ? <Loader2 className="animate-spin" /> : <Play />} Play
      </Button>

      {responseCode !== undefined && (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted">
          <span className="text-xs font-bold">
            <EndpointBadge variant={responseCode >= 400 ? 'DELETE' : 'GET'}>{responseCode}</EndpointBadge> Execution
            time: <span className="text-muted-foreground">{executionTime}ms</span>
          </span>
          <span className="text-xs font-mono font-bold bg-black/50 p-2 rounded-lg whitespace-pre-wrap">
            {JSON.stringify(responseBodyData, null, 2)}
          </span>
        </div>
      )}
    </div>
  )
}
