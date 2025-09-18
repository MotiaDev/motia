import { ApiEndpoint } from './types/endpoint'
import { Input } from '@motiadev/ui'
import { Panel } from '@motiadev/ui'
import { FC, Fragment, useState, ChangeEvent } from 'react'

type Props = { endpoint: ApiEndpoint; onChange?: (queryParamsValues: Record<string, string>) => void }

export const EndpointQueryParamsPanel: FC<Props> = ({ endpoint, onChange }) => {
  const [queryParamsValues, setQueryParamsValues] = useState<Record<string, string>>(
    endpoint.queryParams?.reduce(
      (acc: Record<string, string>, param: { name: string }) => ({ ...acc, [param.name]: '' }),
      {} as Record<string, string>,
    ) ?? {},
  )

  const onQueryParamChange = (param: string, value: string) => {
    const newQueryParamsValues = { ...queryParamsValues, [param]: value }
    setQueryParamsValues(newQueryParamsValues)
    onChange?.(newQueryParamsValues)
  }

  if (!endpoint.queryParams?.length) {
    return null
  }

  return (
    <Panel title="Query params" size="sm" variant="outlined">
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 2fr', gridTemplateRows: '1fr 1fr' }}>
        {endpoint.queryParams.map((param: { name: string; description: string }) => (
          <Fragment key={param.name}>
            <div className="font-bold leading-[36px] flex text-xs">{param.name}</div>
            <div className="flex items-center text-xs ">
              {onChange ? (
                <Input
                  className="text-xs"
                  placeholder={param.description}
                  value={queryParamsValues[param.name]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onQueryParamChange(param.name, e.target.value)}
                />
              ) : (
                <span>{param.description}</span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </Panel>
  )
}
