import { useThemeStore } from '@/stores/use-theme-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { FC, useMemo } from 'react'
import ReactJson from 'react18-json-view'
import { convertJsonSchemaToJson } from '@/components/endpoints/hooks/utils'

export type EndpointResponseItem = {
  responseCode: string
  bodySchema: Record<string, Record<string, any>>
}

type EndpointResponseProps = {
  items: EndpointResponseItem[]
}

const EndpointResponseSchemaItem: FC<EndpointResponseItem> = ({ responseCode, bodySchema }) => {
  const theme = useThemeStore((store) => store.theme)

  const schema = useMemo(() => convertJsonSchemaToJson(bodySchema), [bodySchema])

  return (
    <TabsContent value={responseCode} key={responseCode} className="border-t">
      <div className="text-xs font-mono rounded-lg whitespace-pre-wrap">
        <ReactJson
          src={schema}
          dark={theme === 'dark'}
          enableClipboard={false}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </TabsContent>
  )
}

export const EndpointResponseSchema: FC<EndpointResponseProps> = ({ items }) => {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col rounded-lg border" data-testid="endpoint-response-container">
      <Tabs defaultValue={items[0].responseCode}>
        <div className="flex items-center justify-between bg-card">
          <TabsList className="bg-transparent p-0">
            {items.map((item) => (
              <TabsTrigger
                value={item.responseCode}
                key={item.responseCode}
                className="text-xs font-bold cursor-pointer"
              >
                {item.responseCode}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {items.map((props) => (
          <EndpointResponseSchemaItem key={props.responseCode} {...props} />
        ))}
      </Tabs>
    </div>
  )
}
