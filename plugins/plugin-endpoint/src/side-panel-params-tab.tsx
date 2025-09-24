import { Button } from '@motiadev/ui'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ConfigurationListItem } from './components/configuration-list-item'
import {
  getPathParamsSelector,
  getQueryParamsSelector,
  useEndpointConfiguration,
} from './hooks/use-endpoint-configuration'
import { EndpointPathPreview } from './components/endpoint-path-preview'
import { ApiRouteMethod } from './types/endpoint'

type SidePanelParamsTabProps = {
  path: string
  method: ApiRouteMethod
}

export const SidePanelParamsTab = ({ path, method }: SidePanelParamsTabProps) => {
  const { setQueryParams, removeQueryParams, setPathParams } = useEndpointConfiguration()
  const queryParams = useEndpointConfiguration(useShallow(getQueryParamsSelector))
  const pathParams = useEndpointConfiguration(useShallow(getPathParamsSelector))
  const pathParamsConfig = useMemo(() => {
    const params = path.match(/:(\w+)/g)
    return (
      params?.map((param) => {
        return { name: param.slice(1), value: pathParams[param.slice(1)]?.value ?? '', active: true }
      }) ?? []
    )
  }, [path])

  const addParam = useCallback(() => {
    const newParam = {
      name: '',
      value: '',
      active: true,
    }
    setQueryParams({ ...queryParams, [new Date().getTime().toString()]: newParam })
  }, [queryParams, setQueryParams])

  const updateParam = useCallback(
    (key: string, field: 'name' | 'value' | 'active', value: string | boolean) => {
      if (!key) return
      setQueryParams({ ...queryParams, [key]: { ...queryParams[key], [field]: value } })
    },
    [queryParams, setQueryParams],
  )

  const updatePathParam = useCallback(
    (key: string, field: 'name' | 'value' | 'active', value: string | boolean) => {
      if (!key) return
      setPathParams({ ...pathParams, [key]: { ...pathParams[key], [field]: value } })
    },
    [pathParams, setPathParams],
  )

  useEffect(() => {
    if (Object.keys(queryParams).length === 0) {
      addParam()
    }
  }, [queryParams, addParam])

  return (
    <div className="h-full flex flex-col">
      <div className="flex px-4 border-b h-10 items-center">
        <Button size="sm" onClick={addParam}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      <EndpointPathPreview path={path} method={method} />

      <div className="flex flex-col flex-1">
        {pathParamsConfig.length > 0 && (
          <div className="mt-4 border-b p-2">
            <div className="text-sm font-medium pl-4">Path</div>
            {pathParamsConfig.map((pathName) => (
              <ConfigurationListItem
                key={pathName.name}
                value={{ name: pathName.name, value: pathName.value, active: pathName.active }}
                id={pathName.name}
                required={true}
                onUpdate={updatePathParam}
              />
            ))}
          </div>
        )}
        <div className="p-2 flex-1">
          <div className="text-sm font-medium pl-4">Query</div>
          {Object.entries(queryParams).map(([key, param]) => (
            <ConfigurationListItem
              key={key}
              value={param}
              id={key}
              onUpdate={updateParam}
              onRemove={removeQueryParams}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
