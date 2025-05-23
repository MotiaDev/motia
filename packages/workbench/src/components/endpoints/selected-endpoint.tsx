import React from 'react'
import { ApiEndpoint } from './hooks/use-get-endpoints'
import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json'
import { ResponseBody } from './response-body'

type Props = { endpoint: ApiEndpoint }

export const SelectedEndpoint: React.FC<Props> = ({ endpoint }) => {
  const { body: requestBody } = useJsonSchemaToJson(endpoint.bodySchema)

  return (
    <>
      {endpoint.queryParams && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold">Query Params</span>
          <div className="flex flex-col gap-2 flex-1 p-2 rounded-lg bg-muted table">
            {endpoint.queryParams.map((param) => (
              <span className="text-xs table-row" key={param.name}>
                <span className="font-bold table-cell">{param.name}</span>
                <span className="text-xs table-cell">{param.description}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {requestBody && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold">Request Body</span>
          <span className="text-xs font-mono dark:bg-black/50 bg-white/50 p-2 rounded-lg whitespace-pre-wrap">
            {requestBody}
          </span>
        </div>
      )}
      {endpoint.responseSchema && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold">Response</span>
          {Object.entries(endpoint.responseSchema).map(([status, schema]) => (
            <ResponseBody key={status} status={status} body={schema} />
          ))}
        </div>
      )}
    </>
  )
}
