import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import type { JSONSchema7 } from 'json-schema'
import { Code2, FileText, Play } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { JsonEditor } from '../../components/ui/json-editor'
import { SchemaForm } from './schema-form'

type StepConfig = {
  type: string
  bodySchema?: JSONSchema7
  path?: string
  method?: string
  subscribes?: string[]
  cron?: string
}

type StepTriggerPanelProps = {
  stepId: string
  stepName: string
  config: StepConfig
}

type TriggerResponse = {
  success: boolean
  data?: unknown
  error?: string
  traceId?: string
}

export const StepTriggerPanel: React.FC<StepTriggerPanelProps> = ({ stepId, stepName, config }) => {
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form')
  const [formValue, setFormValue] = useState<Record<string, unknown>>({})
  const [jsonValue, setJsonValue] = useState('{}')
  const [isExecuting, setIsExecuting] = useState(false)
  const [response, setResponse] = useState<TriggerResponse | null>(null)

  const hasSchema = config.bodySchema && config.bodySchema.type === 'object'

  const handleFormChange = useCallback((value: Record<string, unknown>) => {
    setFormValue(value)
    try {
      setJsonValue(JSON.stringify(value, null, 2))
    } catch {
      // Ignore JSON errors
    }
  }, [])

  const handleJsonChange = useCallback((value: string) => {
    setJsonValue(value)
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        setFormValue(parsed)
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, [])

  const getRequestBody = useCallback((): Record<string, unknown> => {
    if (inputMode === 'json') {
      try {
        const parsed = JSON.parse(jsonValue)
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}
      } catch {
        return {}
      }
    }
    return formValue
  }, [inputMode, jsonValue, formValue])

  const triggerStep = useCallback(async () => {
    setIsExecuting(true)
    setResponse(null)

    try {
      const body = getRequestBody()

      if (config.type === 'api' && config.path && config.method) {
        const method = config.method.toUpperCase()
        const isGetOrHead = method === 'GET' || method === 'HEAD'

        let url = config.path
        if (isGetOrHead && Object.keys(body).length > 0) {
          const params = new URLSearchParams()
          for (const [key, value] of Object.entries(body)) {
            if (value !== undefined && value !== null) {
              params.append(key, String(value))
            }
          }
          const queryString = params.toString()
          url = queryString ? `${config.path}?${queryString}` : config.path
        }

        const fetchOptions: RequestInit = {
          method: config.method,
          headers: {},
        }

        if (!isGetOrHead) {
          fetchOptions.headers = {
            'Content-Type': 'application/json',
          }
          fetchOptions.body = JSON.stringify(body)
        }

        const response = await fetch(url, fetchOptions)

        const data = await response.json().catch(() => ({ error: 'Failed to parse response' }))

        setResponse({
          success: response.ok,
          data,
          traceId: data.traceId,
          error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
        })
      } else if (config.type === 'event' && config.subscribes && config.subscribes.length > 0) {
        const topic = config.subscribes[0]
        const response = await fetch('/emit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            data: body,
          }),
        })

        const data = await response.json().catch(() => ({ error: 'Failed to parse response' }))

        setResponse({
          success: response.ok,
          data,
          traceId: data.traceId || data.emitted?.traceId,
          error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
        })
      } else if (config.type === 'cron') {
        const response = await fetch(`/__motia/cron/${stepId}/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json().catch(() => ({ error: 'Failed to parse response' }))

        setResponse({
          success: response.ok,
          data,
          traceId: data.traceId,
          error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
        })
      } else {
        setResponse({
          success: false,
          error: `Cannot trigger step type: ${config.type}`,
        })
      }
    } catch (error: unknown) {
      const err = error as Error
      setResponse({
        success: false,
        error: err.message || 'Failed to trigger step',
      })
    } finally {
      setIsExecuting(false)
    }
  }, [stepId, config, getRequestBody])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Trigger Step</h3>
          <p className="text-sm text-muted-foreground">{stepName}</p>
        </div>
        <Button onClick={triggerStep} disabled={isExecuting} data-testid="trigger-step-button">
          <Play className="w-4 h-4 mr-2" />
          {isExecuting ? 'Executing...' : 'Execute'}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {hasSchema ? (
          <Tabs
            value={inputMode}
            onValueChange={(v) => setInputMode(v as 'form' | 'json')}
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="form">
                  <FileText className="w-4 h-4 mr-2" />
                  Form
                </TabsTrigger>
                <TabsTrigger value="json">
                  <Code2 className="w-4 h-4 mr-2" />
                  JSON
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="form" className="flex-1 overflow-auto mt-0">
              <SchemaForm schema={config.bodySchema} value={formValue} onChange={handleFormChange} />
            </TabsContent>
            <TabsContent value="json" className="flex-1 overflow-hidden mt-0">
              <div className="h-full">
                <JsonEditor
                  value={jsonValue}
                  onChange={handleJsonChange}
                  schema={config.bodySchema as Record<string, unknown>}
                  height="100%"
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full">
              <JsonEditor
                value={jsonValue}
                onChange={handleJsonChange}
                schema={config.bodySchema as Record<string, unknown>}
                height="100%"
              />
            </div>
          </div>
        )}

        {response && (
          <div className="border-t p-4 max-h-[300px] overflow-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Response</h4>
                <span
                  className={`text-sm ${response.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {response.success ? 'Success' : 'Error'}
                </span>
              </div>
              {response.traceId ? (
                <div className="text-xs text-muted-foreground">
                  Trace ID: <code className="bg-muted px-1 py-0.5 rounded">{response.traceId}</code>
                </div>
              ) : null}
              {response.error ? (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{response.error}</div>
              ) : null}
              {response.data ? (
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px]">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
