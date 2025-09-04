import { ApiEndpoint } from '@/types/endpoint'
import { Button } from '@motiadev/ui'
import { Loader2, Play } from 'lucide-react'
import { FC, useEffect, useMemo, useState } from 'react'
import { EndpointBodyPanel } from './endpoint-body-panel'
import { EndpointPathParamsPanel } from './endpoint-path-params-panel'
import { EndpointQueryParamsPanel } from './endpoint-query-params-panel'
import { EndpointResponse } from './endpoint-response'
import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json'

type Props = { endpoint: ApiEndpoint }

export const EndpointCall: FC<Props> = ({ endpoint }) => {
  const shouldHaveBody = ['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [responseCode, setResponseCode] = useState<number | undefined>(undefined)
  const [responseBody, setResponseBody] = useState<Record<string, unknown> | undefined>(undefined)
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined)
  const { body, setBody } = useJsonSchemaToJson(endpoint.bodySchema)
  const [isBodyValid, setIsBodyValid] = useState(true)
  const [pathParamsValues, setPathParamsValues] = useState<Record<string, string>>({})
  const [queryParamsValues, setQueryParamsValues] = useState<Record<string, string>>({})

  const isPlayEnabled = useMemo(() => {
    if (shouldHaveBody && !isBodyValid) return false

    return (
      Object.values(pathParamsValues).every((value) => value) &&
      Object.values(queryParamsValues).every((value) => value)
    )
  }, [pathParamsValues, shouldHaveBody, isBodyValid, queryParamsValues])

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
        Object.entries(pathParamsValues).reduce((acc, [param, value]) => {
          return acc.replace(`:${param}`, value)
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
    <div className="space-y-3">
      <EndpointPathParamsPanel endpoint={endpoint} onChange={setPathParamsValues} />
      <EndpointQueryParamsPanel endpoint={endpoint} onChange={setQueryParamsValues} />
      <EndpointBodyPanel
        endpoint={endpoint}
        value={body}
        onChange={setBody}
        onValidate={setIsBodyValid}
        panelName="call"
      />
      <Button
        className="w-fit"
        onClick={handleRequest}
        variant="accent"
        data-testid="endpoint-play-button"
        disabled={isRequestLoading || !isPlayEnabled}
      >
        {isRequestLoading ? <Loader2 className="animate-spin" /> : <Play />} Play
      </Button>

      <EndpointResponse responseCode={responseCode} responseBody={responseBody} executionTime={executionTime} />
    </div>
  )
}
