import React from 'react'
import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json.js'

type Props = { status: string; body: Record<string, any> }

export const ResponseBody: React.FC<Props> = ({ status, body }) => {
  const { body: responseBody } = useJsonSchemaToJson(body)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold">{status}</span>
      <span className="text-xs font-mono dark:bg-black/50 bg-white/50 p-2 rounded-lg whitespace-pre-wrap">
        {responseBody}
      </span>
    </div>
  )
}
