import { Button } from '@motiadev/ui'
import { Plus, Minus, ArrowUp, ArrowDown, Settings, Trash2, RotateCcw, Loader2, Check, X } from 'lucide-react'
import React, { useState } from 'react'
import { StateItem } from './hooks/states-hooks'

type Props = {
  state: StateItem
  onStateChange: () => void
}

type OperationStatus = 'idle' | 'loading' | 'success' | 'error'

export const AtomicOperations: React.FC<Props> = ({ state, onStateChange }) => {
  const [operationStatus, setOperationStatus] = useState<Record<string, OperationStatus>>({})
  const [deltaValue, setDeltaValue] = useState<number>(1)
  const [fieldName, setFieldName] = useState<string>('')
  const [fieldValue, setFieldValue] = useState<string>('')
  const [expectedValue, setExpectedValue] = useState<string>('')
  const [newValue, setNewValue] = useState<string>('')

  const executeOperation = async (operation: string, payload: any) => {
    const operationKey = `${operation}_${Date.now()}`
    setOperationStatus((prev) => ({ ...prev, [operationKey]: 'loading' }))

    try {
      const response = await fetch('/__motia/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: state.key,
          groupId: state.groupId,
          operation,
          value: payload,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setOperationStatus((prev) => ({ ...prev, [operationKey]: 'success' }))

      // Trigger state refresh
      onStateChange()

      // Clear success status after 2 seconds
      setTimeout(() => {
        setOperationStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[operationKey]
          return newStatus
        })
      }, 2000)

      return result
    } catch (error) {
      console.error(`Failed to execute ${operation}:`, error)
      setOperationStatus((prev) => ({ ...prev, [operationKey]: 'error' }))

      // Clear error status after 3 seconds
      setTimeout(() => {
        setOperationStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[operationKey]
          return newStatus
        })
      }, 3000)
    }
  }

  const getStatusIcon = (operationKey: string) => {
    const status = operationStatus[operationKey]
    if (!status) return null

    switch (status) {
      case 'loading':
        return <Loader2 className="w-3 h-3 animate-spin" />
      case 'success':
        return <Check className="w-3 h-3 text-green-500" />
      case 'error':
        return <X className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const isNumericValue = typeof state.value === 'number'
  const isArrayValue = Array.isArray(state.value)
  const isObjectValue = typeof state.value === 'object' && state.value !== null && !Array.isArray(state.value)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Atomic Operations</h3>

      {/* Numeric Operations */}
      {isNumericValue && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Numeric Operations</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={deltaValue}
              onChange={(e) => setDeltaValue(Number(e.target.value))}
              className="w-16 px-2 py-1 text-xs border rounded"
              placeholder="Delta"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeOperation('increment', { delta: deltaValue })}
              disabled={!!Object.values(operationStatus).find((s) => s === 'loading')}
            >
              <Plus className="w-3 h-3 mr-1" />
              Increment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeOperation('decrement', { delta: deltaValue })}
              disabled={!!Object.values(operationStatus).find((s) => s === 'loading')}
            >
              <Minus className="w-3 h-3 mr-1" />
              Decrement
            </Button>
          </div>
        </div>
      )}

      {/* Array Operations */}
      {isArrayValue && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Array Operations</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeOperation('pop', {})}
              disabled={!!Object.values(operationStatus).find((s) => s === 'loading')}
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              Pop
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeOperation('shift', {})}
              disabled={!!Object.values(operationStatus).find((s) => s === 'loading')}
            >
              <ArrowDown className="w-3 h-3 mr-1" />
              Shift
            </Button>
          </div>
        </div>
      )}

      {/* Object Operations */}
      {isObjectValue && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Object Operations</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border rounded"
                placeholder="Field name"
              />
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border rounded"
                placeholder="Field value (JSON)"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  try {
                    const parsedValue = JSON.parse(fieldValue)
                    executeOperation('setField', { field: fieldName, fieldValue: parsedValue })
                  } catch {
                    alert('Invalid JSON for field value')
                  }
                }}
                disabled={!fieldName || !fieldValue || !!Object.values(operationStatus).find((s) => s === 'loading')}
              >
                <Settings className="w-3 h-3 mr-1" />
                Set Field
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border rounded"
                placeholder="Field name to delete"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeOperation('deleteField', { field: fieldName })}
                disabled={!fieldName || !!Object.values(operationStatus).find((s) => s === 'loading')}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete Field
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compare and Swap */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Compare & Swap</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border rounded"
              placeholder="Expected value (JSON)"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border rounded"
              placeholder="New value (JSON)"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  const parsedExpected = expectedValue ? JSON.parse(expectedValue) : null
                  const parsedNew = JSON.parse(newValue)
                  executeOperation('compareAndSwap', { expected: parsedExpected, newValue: parsedNew })
                } catch {
                  alert('Invalid JSON for expected or new value')
                }
              }}
              disabled={!newValue || !!Object.values(operationStatus).find((s) => s === 'loading')}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Compare & Swap
            </Button>
          </div>
        </div>
      </div>

      {/* Utility Operations */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Utility Operations</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => executeOperation('exists', {})}
            disabled={!!Object.values(operationStatus).find((s) => s === 'loading')}
          >
            Check Exists
          </Button>
        </div>
      </div>

      {/* Status indicators */}
      {Object.keys(operationStatus).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(operationStatus).map(([key, status]) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              {getStatusIcon(key)}
              <span className="text-muted-foreground">
                {key.split('_')[0]} {status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
