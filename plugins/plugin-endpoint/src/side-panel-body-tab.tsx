import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@motiadev/ui'
import { FC, memo, useCallback, useEffect, useState } from 'react'
import { getBodySelector, useEndpointConfiguration } from './hooks/use-endpoint-configuration'
import { convertJsonSchemaToJson } from './hooks/utils'
import { JsonEditor } from './components/json-editor'

type SidePanelBodyTabProps = {
  schema: Record<string, any> | undefined
}

enum BodyType {
  json = 'json',
  no_body = 'no-body',
}

export const SidePanelBodyTab: FC<SidePanelBodyTabProps> = memo(({ schema }) => {
  const [bodyType, setBodyType] = useState<BodyType>(BodyType.json)

  const { setBody, setBodyIsValid } = useEndpointConfiguration()
  const body = useEndpointConfiguration(getBodySelector)

  useEffect(() => {
    if (schema) {
      setBody(JSON.stringify(convertJsonSchemaToJson(schema), null, 2))
      setBodyIsValid(true)
    }
  }, [schema])

  const handleBodyChange = useCallback(
    (value: string) => {
      setBody(value)
    },
    [setBody, setBodyIsValid],
  )

  const onBodyTypeChange = useCallback(
    (value: string) => {
      if (value === BodyType.no_body) {
        setBody('')
        setBodyIsValid(true)
      } else {
        setBody(JSON.stringify(convertJsonSchemaToJson(schema), null, 2))
        setBodyIsValid(true)
      }
      setBodyType(value as BodyType)
    },
    [setBodyType, schema, setBody, setBodyIsValid],
  )

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] px-4 border-b h-10 items-center">
        <Select onValueChange={onBodyTypeChange}>
          <SelectTrigger className="w-32 max-h-6 border-border border">
            <SelectValue placeholder="JSON" />
          </SelectTrigger>
          <SelectContent className="bg-background text-foreground w-26">
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="no-body">no body</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {bodyType === BodyType.json ? (
        <JsonEditor value={body} schema={schema} onChange={handleBodyChange} onValidate={setBodyIsValid} />
      ) : (
        <div className="h-full flex items-center justify-center">no body</div>
      )}
    </>
  )
})
