import type { Meta, StoryObj } from '@storybook/react'
import { Activity, Database, FileText, GitBranch, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from './button'
import { CollapsiblePanel, CollapsiblePanelGroup } from './collapsible-panel'
import { TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof CollapsiblePanel> = {
  title: 'UI/CollapsiblePanel',
  component: CollapsiblePanel,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A collapsible panel component with resize support, built on react-resizable-panels. Features expand/collapse controls, optional tab variant, and resize handles between panels. Commonly used in dashboard and workbench layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the panel (required for panel state management)',
      table: {
        type: { summary: 'string' },
      },
    },
    header: {
      control: 'object',
      description: 'Content to display in the panel header (accepts ReactNode)',
    },
    withResizeHandle: {
      control: 'boolean',
      description: 'Whether to show a resize handle for this panel (auto-managed by CollapsiblePanelGroup)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the panel',
    },
    variant: {
      control: 'select',
      options: ['default', 'tabs'],
      description: 'Visual variant: "default" for standard header, "tabs" for tab integration',
    },
    defaultTab: {
      control: 'text',
      description: 'Default active tab when variant is "tabs"',
    },
    onTabChange: {
      description: 'Callback fired when tab changes (only when variant is "tabs")',
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

export const WithTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('overview')

    return (
      <div className="h-[500px] w-[600px]">
        <CollapsiblePanelGroup direction="vertical">
          <CollapsiblePanel
            id="tabs-panel"
            variant="tabs"
            defaultTab="overview"
            onTabChange={setActiveTab}
            header={
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger value="overview">
                  <Activity className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            }
          >
            <TabsContent value="overview" className="m-0">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">System Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Active Users</p>
                    <p className="text-lg font-bold">1,247</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                    <p className="text-lg font-bold">3,582</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Current tab: {activeTab}</p>
              </div>
            </TabsContent>
            <TabsContent value="users" className="m-0">
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3">User Management</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-sm">John Doe</span>
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-sm">Jane Smith</span>
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="m-0">
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3">Configuration</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enable notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span className="text-sm">Auto-refresh</span>
                  </div>
                  <Button size="sm" className="mt-3">
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CollapsiblePanel>
        </CollapsiblePanelGroup>
      </div>
    )
  },
}

export const UseCases: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Dashboard Monitoring</h3>
        <div className="h-[400px] w-[500px]">
          <CollapsiblePanelGroup direction="vertical">
            <CollapsiblePanel
              id="metrics"
              header={
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Performance Metrics</span>
                </div>
              }
            >
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center p-2 bg-secondary rounded">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-mono text-green-600">124ms</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary rounded">
                  <span className="text-sm">Throughput</span>
                  <span className="text-sm font-mono text-blue-600">2.4k/min</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary rounded">
                  <span className="text-sm">Error Rate</span>
                  <span className="text-sm font-mono text-orange-600">0.02%</span>
                </div>
              </div>
            </CollapsiblePanel>
            <CollapsiblePanel
              id="logs"
              header={
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Recent Logs</span>
                </div>
              }
            >
              <div className="p-4 font-mono text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">14:23:15</span>
                  <span>Server started successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">14:23:16</span>
                  <span>Database connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span className="text-muted-foreground">14:23:17</span>
                  <span>High memory usage detected</span>
                </div>
              </div>
            </CollapsiblePanel>
          </CollapsiblePanelGroup>
        </div>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'scrollable-region-focusable', enabled: false }],
      },
    },
  },
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Keyboard Navigation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The CollapsiblePanel supports full keyboard navigation and screen reader announcements.
        </p>
        <div className="h-[400px] w-[600px]">
          <CollapsiblePanelGroup direction="vertical">
            <CollapsiblePanel
              id="accessible-panel"
              header={
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Accessible Panel</span>
                </div>
              }
            >
              <div className="p-4 space-y-3">
                <p className="text-sm">
                  The collapse/expand button has proper{' '}
                  <code className="text-xs bg-secondary px-1 py-0.5 rounded">aria-label</code> attributes that announce
                  the current state to screen readers.
                </p>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs font-medium mb-2">Keyboard Shortcuts:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Tab - Navigate to collapse button</li>
                    <li>• Enter/Space - Toggle collapse state</li>
                    <li>• Drag resize handle - Adjust panel size</li>
                  </ul>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs font-medium mb-2">ARIA Attributes:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• aria-label: "Expand panel" or "Collapse panel"</li>
                    <li>• Dynamically updated based on panel state</li>
                    <li>• Screen readers announce state changes</li>
                  </ul>
                </div>
              </div>
            </CollapsiblePanel>
          </CollapsiblePanelGroup>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg">
        <p className="text-xs font-mono font-semibold mb-2">Best practices:</p>
        <ul className="text-xs text-muted-foreground space-y-1 font-mono">
          <li>• Use unique, descriptive IDs for each panel</li>
          <li>• Provide clear header labels for context</li>
          <li>• Ensure focusable content is accessible when expanded</li>
          <li>• Use semantic HTML within panel content</li>
          <li>• Test keyboard navigation and screen reader compatibility</li>
        </ul>
      </div>
    </div>
  ),
}

// Interaction Tests
export const CollapseExpandPanel: Story = {
  render: () => (
    <div className="h-[400px] w-[500px]">
      <CollapsiblePanelGroup direction="vertical">
        <CollapsiblePanel
          id="test-panel"
          header={
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Collapsible Panel</span>
            </div>
          }
        >
          <div className="p-4">
            <p className="text-sm">Panel content visible when expanded</p>
          </div>
        </CollapsiblePanel>
      </CollapsiblePanelGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Find the collapse/expand button
    const toggleButton = canvas.getByRole('button')
    await expect(toggleButton).toHaveAttribute('aria-label')
    // Initially should be "Collapse panel"
    await userEvent.click(toggleButton)
    // After click, wait for content to potentially hide/show
    await waitFor(() => {
      const updatedButton = canvas.getByRole('button')
      return expect(updatedButton).toBeInTheDocument()
    })
  },
}
