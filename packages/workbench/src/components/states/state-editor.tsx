import { Button, Panel } from '@motiadev/ui'
import { AlertCircle, Check, Database, Loader2, Save } from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'
import { JsonEditor } from '../endpoints/json-editor'
import { StateItem } from './hooks/states-hooks'

type Props = {
  state: StateItem
}

export const StateEditor: React.FC<Props> = ({ state }) => {
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [jsonValue, setJsonValue] = useState(JSON.stringify(state.value, null, 2))
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    setJsonValue(JSON.stringify(state.value, null, 2))
  }, [state.value])

  const handleJsonChange = useCallback(
    (value: string) => {
      setJsonValue(value)
      setHasChanges(value !== JSON.stringify(state.value, null, 2))
      setSaveStatus('idle')
    },
    [state.value],
  )

  const handleSave = async () => {
    if (!isValid || !hasChanges) return

    try {
      setIsRequestLoading(true)
      setSaveStatus('idle')

      const response = await fetch('/motia/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: state.key,
          groupId: state.groupId,
          value: JSON.parse(jsonValue),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setSaveStatus('success')
      setHasChanges(false)

      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Failed to save state:', error)
      setSaveStatus('error')
    } finally {
      setIsRequestLoading(false)
    }
  }

  const resetChanges = useCallback(() => {
    setJsonValue(JSON.stringify(state.value, null, 2))
    setHasChanges(false)
    setSaveStatus('idle')
  }, [state.value])

  return (
    <Panel
      title={
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <h3 className="text-sm font-semibold text-foreground">Edit State Value</h3>
        </div>
      }
    >
      <p className="text-xs text-muted-foreground mb-3">
        Modify the state value using the JSON editor below. Changes will be saved to the system when you click Save.
      </p>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          <strong>Group:</strong> <code className="bg-background px-1 py-0.5 rounded">{state.groupId}</code>
        </div>
        <div>
          <strong>Key:</strong> <code className="bg-background px-1 py-0.5 rounded">{state.key}</code>
        </div>
      </div>
      <div className="space-y-3 pt-2">
        <div className="relative">
          <JsonEditor value={jsonValue} onChange={handleJsonChange} onValidate={setIsValid} />

          {!isValid && (
            <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Invalid JSON
            </div>
          )}
        </div>

        {saveStatus === 'success' && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
              <Check className="w-4 h-4" />
              State saved successfully!
            </div>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Failed to save state. Please try again.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {hasChanges ? (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Up to date
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="secondary" onClick={resetChanges} disabled={isRequestLoading}>
              Reset
            </Button>
          )}

          <Button
            onClick={handleSave}
            variant="accent"
            disabled={isRequestLoading || !isValid || !hasChanges}
            data-testid="state-save-button"
          >
            {isRequestLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
