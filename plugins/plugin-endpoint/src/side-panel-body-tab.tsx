import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import { JsonEditor } from './components/json-editor'
import { getBodySelector, useEndpointConfiguration } from './hooks/use-endpoint-configuration'
import { convertJsonSchemaToJson } from './hooks/utils'

type SidePanelBodyTabProps = {
  schema: Record<string, any> | undefined
}

export const SidePanelBodyTab: FC<SidePanelBodyTabProps> = memo(({ schema }) => {
  const { setBody, setBodyIsValid } = useEndpointConfiguration()
  const body = useEndpointConfiguration(getBodySelector)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (schema) {
      setBody(body || JSON.stringify(convertJsonSchemaToJson(schema), null, 2))
      setBodyIsValid(true)
    }
  }, [schema])

  const handleBodyChange = useCallback(
    (value: string) => {
      setBody(value)
    },
    [setBody, setBodyIsValid],
  )

  return (
    <div className="h-full" ref={containerRef}>
      <JsonEditor value={body} schema={schema} onChange={handleBodyChange} onValidate={setBodyIsValid} />
    </div>
  )
})
