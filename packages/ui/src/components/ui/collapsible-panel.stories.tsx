import type { Meta, StoryObj } from '@storybook/react'
import { CollapsiblePanel, CollapsiblePanelGroup } from './collapsible-panel'
import { Activity, Database, FileText, GitBranch } from 'lucide-react'

const meta: Meta<typeof CollapsiblePanel> = {
  title: 'UI/CollapsiblePanel',
  component: CollapsiblePanel,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A collapsible panel component that can be collapsed and expanded. Works within a PanelGroup for resizable layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the panel',
    },
    header: {
      control: 'object',
      description: 'Content to display in the panel header',
    },
    withResizeHandle: {
      control: 'boolean',
      description: 'Whether to show a resize handle for this panel',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the panel',
    },
    children: {
      control: 'object',
      description: 'Content to display in the panel body',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="h-[600px] w-[500px]">
      <CollapsiblePanelGroup direction="vertical">
        <CollapsiblePanel
          {...args}
          id="default-panel"
          header={
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Panel Header</span>
            </div>
          }
        >
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              This is the default panel content. You can collapse and expand this panel using the chevron button in the
              header.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-secondary rounded-lg">
                <div className="font-medium text-sm">Content Block 1</div>
                <div className="text-xs text-muted-foreground">Some information here</div>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <div className="font-medium text-sm">Content Block 2</div>
                <div className="text-xs text-muted-foreground">More information here</div>
              </div>
            </div>
          </div>
        </CollapsiblePanel>
      </CollapsiblePanelGroup>
    </div>
  ),
}

export const MultiplePanels: Story = {
  render: () => (
    <div className="h-[600px] w-[500px]">
      <CollapsiblePanelGroup direction="vertical">
        <CollapsiblePanel
          id="panel-1"
          header={
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <span>Flows</span>
            </div>
          }
        >
          <div className="p-4" tabIndex={0}>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">User Registration Flow</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment Processing Flow</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          id="panel-2"
          header={
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Monitoring</span>
            </div>
          }
        >
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">CPU Usage</div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">65%</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Memory</div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">42%</div>
              </div>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          id="panel-3"
          header={
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>States</span>
            </div>
          }
        >
          <div className="p-4">
            <div className="font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">user.status</span>
                <span className="text-green-600">active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">flow.state</span>
                <span className="text-blue-500">processing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">queue.length</span>
                <span className="text-orange-600">12</span>
              </div>
            </div>
          </div>
        </CollapsiblePanel>
      </CollapsiblePanelGroup>
    </div>
  ),
}
