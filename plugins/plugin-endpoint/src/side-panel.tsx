import { Badge, Button, cn, Tabs, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { X } from 'lucide-react'
import { FC, memo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { EndpointPath } from './components/endpoint-path'
import {
  getHeadersSelector,
  getQueryParamsSelector,
  getResponseSelector,
  UseEndpointConfiguration,
  useEndpointConfiguration,
} from './hooks/use-endpoint-configuration'
import { SidePanelBodyTab } from './side-panel-body-tab'
import { SidePanelHeadersTab } from './side-panel-headers-tab'
import { SidePanelParamsTab } from './side-panel-params-tab'
import { SidePanelResponse } from './side-panel-response'
import { TriggerButton } from './trigger-button'
import { ApiEndpoint } from './types/endpoint'

type EndpointSidePanelProps = { endpoint: ApiEndpoint; onClose: () => void }

type ActiveTab = 'body' | 'headers'

const headersCountSelector = (state: UseEndpointConfiguration) => Object.keys(getHeadersSelector(state)).length
const hasResponseSelector = (state: UseEndpointConfiguration) => getResponseSelector(state) !== undefined
const paramsCountSelector = (state: UseEndpointConfiguration) => Object.keys(getQueryParamsSelector(state)).length

export const SidePanel: FC<EndpointSidePanelProps> = memo(({ endpoint, onClose }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('body')
  const headersCount = useEndpointConfiguration(useShallow(headersCountSelector))
  const hasResponse = useEndpointConfiguration(useShallow(hasResponseSelector))
  const paramsCount = useEndpointConfiguration(useShallow(paramsCountSelector))

  return (
    <div className="grid grid-cols-1 overflow-y-auto min-w-0 grid-rows-[auto_1fr] border-l border-border">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 px-5 py-4 border-b bg-card w-full">
        <div className="grid grid-rows-2 gap-2">
          <EndpointPath method={endpoint.method} path={endpoint.path} />
          <p className="text-sm text-muted-foreground">{endpoint.description || 'Retrieves a list of all versions'}</p>
        </div>
        <Button variant="icon" size="icon" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className={cn('grid grid-cols-[minmax(350px,1fr)_minmax(auto,1fr)]', !hasResponse && 'grid-cols-1')}>
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as ActiveTab)}>
          <div className="grid grid-cols-[1fr_auto] items-center h-10 border-b px-5 bg-card">
            <TabsList>
              <TabsTrigger value="params" className="grid grid-cols-[auto_auto] gap-2 items-center cursor-pointer">
                Params
                <Badge variant="outline" className="h-4 px-1.5 text-xs">
                  {paramsCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="body" className="cursor-pointer">
                Body
              </TabsTrigger>
              <TabsTrigger value="headers" className="grid grid-cols-[auto_auto] gap-2 items-center cursor-pointer">
                Headers
                <Badge variant="outline" className="h-4 px-1.5 text-xs">
                  {headersCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TriggerButton method={endpoint.method} path={endpoint.path.toString()} />
          </div>

          <TabsContent value="params">
            <SidePanelParamsTab path={endpoint.path} />
          </TabsContent>
          <TabsContent value="body">
            <SidePanelBodyTab schema={endpoint.bodySchema} />
          </TabsContent>

          <TabsContent value="headers">
            <SidePanelHeadersTab />
          </TabsContent>
        </Tabs>
        <SidePanelResponse />
      </div>
    </div>
  )
})
