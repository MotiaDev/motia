import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The value of the tab that should be active by default.',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the tabs container.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="flows" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="flows">Flows</TabsTrigger>
        <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
      </TabsList>
      <TabsContent value="flows">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-medium">Motia Hub receives update</h4>
            <p className="text-sm text-muted-foreground mt-1">Motia Hub receives update</p>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="endpoints">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-medium">API Endpoints</h4>
            <p className="text-sm text-muted-foreground mt-1">Manage your API endpoints here</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}
