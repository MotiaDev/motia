import { FC } from 'react'
import { EndpointResponseSchema } from './endpoint-response-schema'
import { ApiEndpoint } from './types/endpoint'
import { EndpointPathParamsPanel } from './endpoint-path-params-panel'
import { EndpointQueryParamsPanel } from './endpoint-query-params-panel'
import { EndpointBodyPanel } from './endpoint-body-panel'
import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json'

type Props = { endpoint: ApiEndpoint }

export const EndpointDescription: FC<Props> = ({ endpoint }) => {
  const { body } = useJsonSchemaToJson(endpoint.bodySchema)

  return (
    <div className="space-y-3">
      <EndpointPathParamsPanel endpoint={endpoint} />
      <EndpointQueryParamsPanel endpoint={endpoint} />
      <EndpointBodyPanel endpoint={endpoint} panelName="details" value={body} />
      <EndpointResponseSchema
        items={Object.entries(endpoint?.responseSchema ?? {}).map(([status, schema]) => ({
          responseCode: status,
          bodySchema: schema,
        }))}
      />
    </div>
  )
}
