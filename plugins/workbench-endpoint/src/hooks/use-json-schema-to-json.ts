import { useEffect, useState } from 'react'
import { convertJsonSchemaToJson } from './utils.js'

export const useJsonSchemaToJson = (schema: Record<string, any> | undefined) => {
  const [body, setBody] = useState<string>('')

  useEffect(() => {
    if (schema) {
      setBody(JSON.stringify(convertJsonSchemaToJson(schema), null, 2))
    }
  }, [schema])

  return { body, setBody }
}
