import { ApiEndpoint } from './types/endpoint.js'
import { Panel } from '@motiadev/ui'
import { FC } from 'react'
import { JsonEditor } from './json-editor.js'
import ReactJson from 'react18-json-view'
import 'react18-json-view/src/dark.css'
import 'react18-json-view/src/style.css'

type Props = {
  endpoint: ApiEndpoint
  value: string
  onChange?: (body: string) => void
  onValidate?: (isValid: boolean) => void
  panelName: string
}

export const EndpointBodyPanel: FC<Props> = ({ endpoint, onChange, onValidate, panelName, value }) => {
  const shouldHaveBody = ['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())

  const handleBodyChange = (body: string) => {
    onChange?.(body)
  }

  if (!shouldHaveBody) {
    return null
  }

  return (
    <Panel title="Body" size="sm" contentClassName="p-0" data-testid={`endpoint-body-panel__${panelName}`}>
      {onChange ? (
        <JsonEditor value={value} schema={endpoint.bodySchema} onChange={handleBodyChange} onValidate={onValidate} />
      ) : (
        <ReactJson
          src={value ? JSON.parse(value) : {}}
          theme="default"
          enableClipboard={false}
          style={{ backgroundColor: 'transparent' }}
        />
      )}
    </Panel>
  )
}
