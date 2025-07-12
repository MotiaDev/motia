import { Badge } from '@/components/ui/badge'
import { Panel } from '@motiadev/ui'
import { Copy, Database, Hash } from 'lucide-react'
import React, { useMemo } from 'react'
import JsonView from 'react18-json-view'
import { StateItem } from './hooks/states-hooks'

type Props = {
  state: StateItem
}

export const StateDetails: React.FC<Props> = ({ state }) => {
  const stateMetadata = useMemo(() => {
    const valueSize = JSON.stringify(state.value).length
    const sizeLabel = valueSize < 1024 ? `${valueSize} bytes` : `${(valueSize / 1024).toFixed(1)} KB`

    return {
      size: sizeLabel,
      isComplex: typeof state.value === 'object' && state.value !== null,
      hasNesting:
        typeof state.value === 'object' &&
        state.value !== null &&
        Object.values(state.value).some((v) => typeof v === 'object'),
    }
  }, [state.value])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state.value, null, 2))
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <Panel
      title={
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <h3 className="text-sm font-semibold text-foreground">State Overview</h3>
        </div>
      }
      actions={[
        {
          icon: <Copy />,
          onClick: copyToClipboard,
          label: 'Copy',
        },
      ]}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Type</span>
            <div>
              <Badge variant="secondary" className="text-xs">
                {state.type}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Size</span>
            <div className="text-foreground font-mono">{stateMetadata.size}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Group ID</span>
            <div className="text-foreground font-mono text-xs bg-background px-2 py-1 rounded border">
              {state.groupId}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Key</span>
            <div className="text-foreground font-mono text-xs bg-background px-2 py-1 rounded border flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {state.key}
            </div>
          </div>
        </div>

        {stateMetadata.isComplex && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {stateMetadata.hasNesting ? 'Nested Object' : 'Simple Object'}
              </Badge>
              {Array.isArray(state.value) && (
                <Badge variant="outline" className="text-xs">
                  {(state.value as unknown[]).length} items
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Value Structure</h3>
        <div className="bg-background border border-border rounded-lg p-3 overflow-auto max-h-[400px]">
          <JsonView src={state.value} theme="default" enableClipboard={false} collapsed={2} />
        </div>
      </div>
    </Panel>
  )
}
