import { Input, Panel } from '@motiadev/ui'
import { type FC, Fragment, useState } from 'react'
import type { ApiEndpoint } from '@/types/endpoint'
import { usePathParams } from './hooks/use-path-params'

type Props = {
  endpoint: ApiEndpoint
  onChange?: (pathParamsValues: Record<string, string>) => void
}

export const EndpointPathParamsPanel: FC<Props> = ({ endpoint, onChange }) => {
  const pathParams = usePathParams(endpoint.path)
  const [pathParamsValues, setPathParamsValues] = useState<Record<string, string>>(
    pathParams?.reduce((acc, param) => ({ ...acc, [param]: '' }), {} as Record<string, string>),
  )

  const onPathParamChange = (param: string, value: string) => {
    const newPathParamsValues = { ...pathParamsValues, [param]: value }
    setPathParamsValues(newPathParamsValues)
    onChange?.(newPathParamsValues)
  }

  if (!pathParams.length) {
    return null
  }

  return (
    <Panel title="Path params" size="sm" variant="default">
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {pathParams.map((param) => (
          <Fragment key={param}>
            <div className="font-bold leading-[36px] flex text-xs">{param}</div>
            <div className="flex items-center text-xs">
              {onChange && (
                <Input
                  className="w-full text-xs"
                  placeholder={param}
                  value={pathParamsValues[param]}
                  onChange={(e) => onPathParamChange(param, e.target.value)}
                />
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </Panel>
  )
}
