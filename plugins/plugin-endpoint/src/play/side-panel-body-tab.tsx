import { CircleX } from 'lucide-react'
import { FC, memo, useCallback, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { JsonEditor } from '../components/json-editor'
import { getBodyIsValidSelector, getBodySelector, useEndpointConfiguration } from '../hooks/use-endpoint-configuration'
import { convertJsonSchemaToJson } from '../hooks/utils'

type SidePanelBodyTabProps = {
  schema: Record<string, any> | undefined
}

export const SidePanelBodyTab: FC<SidePanelBodyTabProps> = memo(({ schema }) => {
  const { setBody, setBodyIsValid } = useEndpointConfiguration()
  const bodyIsValid = useEndpointConfiguration(useShallow(getBodyIsValidSelector))
  const body = useEndpointConfiguration(getBodySelector)

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
    <div className="grid grid-rows-[1fr_auto] h-full">
      <JsonEditor value={body} schema={schema} onChange={handleBodyChange} onValidate={setBodyIsValid} />
      {!bodyIsValid && (
        <div
          className="sticky bottom-0 border-t border-border p-3 text-sm dark:text-yellow-500 text-yellow-700 flex items-center gap-1 font-medium"
          data-testid="endpoint-body-tab-invalid"
        >
          <CircleX className="w-4 h-4" />
          The body payload is invalid
        </div>
      )}
    </div>
  )
})
