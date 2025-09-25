import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { X } from 'lucide-react'
import { memo, useState } from 'react'
import ReactJson from 'react18-json-view'
import { getResponseSelector, useEndpointConfiguration } from './hooks/use-endpoint-configuration'
import { useStateStream } from './hooks/use-state-stream'

type ActiveTab = 'preview' | 'headers'

export const SidePanelResponse = memo(() => {
  const { setResponse } = useEndpointConfiguration()
  const response = useEndpointConfiguration(getResponseSelector)

  const { data } = useStateStream(response?.body)
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview')

  const onClose = () => {
    setResponse(undefined)
  }

  if (!response) {
    return null
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) => setActiveTab(value as ActiveTab)}
      className="border-l border-border"
      data-testid="endpoint-response-container"
    >
      <div className="grid grid-cols-[1fr_auto] items-center h-10 border-b px-5 bg-card">
        <TabsList>
          <TabsTrigger value="preview" className="cursor-pointer">
            Preview
          </TabsTrigger>
          <TabsTrigger value="headers" className="grid grid-cols-[auto_auto] gap-2 items-center cursor-pointer">
            Headers
          </TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <TabsContent value="preview">
        <ReactJson src={data as object} />
      </TabsContent>

      <TabsContent value="headers">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 p-4 overflow-auto auto-rows-max h-full">
          {response.headers &&
            Object.entries(response.headers).map(([key, value]) => (
              <>
                <span className="font-bold text-sm h-8 items-center grid whitespace-nowrap">{key}</span>
                <span className="text-sm text-muted-foreground h-8 items-center grid whitespace-nowrap">{value}</span>
              </>
            ))}
        </div>
      </TabsContent>
    </Tabs>
  )
})
