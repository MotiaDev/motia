import type { Meta, StoryObj } from '@storybook/react'
import { Activity, Copy, FileText, PictureInPicture2, Settings, Users, X } from 'lucide-react'
import { Button } from './button'
import { Panel } from './panel'

const meta: Meta<typeof Panel> = {
  title: 'UI/Panel',
  component: Panel,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A glassmorphic panel component for displaying structured information with a header and key-value pairs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title displayed in the panel header',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle displayed below the title',
    },
    details: {
      control: 'object',
      description: 'Array of detail items to display in the panel body',
    },
    actions: {
      control: 'object',
      description: 'Optional array of action buttons displayed in the header',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the panel',
    },
    children: {
      control: 'object',
      description: 'Custom content to render inside the panel body, overriding `details`.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size variant of the panel',
    },
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'filled', 'ghost'],
      description: 'Visual variant of the panel',
    },
    tabs: {
      control: 'object',
      description: 'Tabs configuration with array of tab objects { label, content, labelComponent?, data-testid? }',
    },
    contentClassName: {
      control: 'text',
      description: 'Additional CSS classes to apply to the panel content area',
    },
    'data-testid': {
      control: 'text',
      description: 'Optional test id for the root panel element',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const VariantDefault: Story = {
  args: {
    title: 'Default Panel',
    subtitle: 'Standard panel with card background and border',
    variant: 'default',
    details: [
      { label: 'Type', value: 'Default' },
      { label: 'Background', value: 'Card background' },
      { label: 'Border', value: 'Standard border' },
      { label: 'Use Case', value: 'General purpose panels' },
    ],
  },
}

export const VariantOutlined: Story = {
  args: {
    title: 'Outlined Panel',
    subtitle: 'Emphasized panel with transparent background and thick border',
    variant: 'outlined',
    details: [
      { label: 'Type', value: 'Outlined' },
      { label: 'Background', value: 'Transparent' },
      { label: 'Border', value: 'Thick border' },
      { label: 'Use Case', value: 'Emphasis and attention' },
    ],
  },
}

export const VariantFilled: Story = {
  args: {
    title: 'Filled Panel',
    subtitle: 'Subtle panel with muted background',
    variant: 'filled',
    details: [
      { label: 'Type', value: 'Filled' },
      { label: 'Background', value: 'Muted background' },
      { label: 'Border', value: 'No border' },
      { label: 'Use Case', value: 'Subtle grouping' },
    ],
  },
}

export const VariantGhost: Story = {
  args: {
    title: 'Ghost Panel',
    subtitle: 'Minimal panel with transparent styling',
    variant: 'ghost',
    details: [
      { label: 'Type', value: 'Ghost' },
      { label: 'Background', value: 'Transparent' },
      { label: 'Border', value: 'No border' },
      { label: 'Use Case', value: 'Minimal styling' },
    ],
  },
}

export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <Panel
        title="Small Panel"
        subtitle="Compact size for limited space"
        size="sm"
        details={[
          { label: 'Size', value: 'Small' },
          { label: 'Padding', value: 'Reduced' },
        ]}
      />
      <Panel
        title="Medium Panel"
        subtitle="Standard size for most use cases"
        size="md"
        details={[
          { label: 'Size', value: 'Medium' },
          { label: 'Padding', value: 'Standard' },
        ]}
      />
    </div>
  ),
}

export const VariantGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-4xl">
      <Panel title="Default" variant="default" size="sm" details={[{ label: 'Variant', value: 'default' }]} />
      <Panel title="Outlined" variant="outlined" size="sm" details={[{ label: 'Variant', value: 'outlined' }]} />
      <Panel title="Filled" variant="filled" size="sm" details={[{ label: 'Variant', value: 'filled' }]} />
      <Panel title="Ghost" variant="ghost" size="sm" details={[{ label: 'Variant', value: 'ghost' }]} />
    </div>
  ),
}

export const WithTabs: Story = {
  args: {
    title: 'Dashboard Overview',
    subtitle: 'Comprehensive system monitoring',
    variant: 'default',
    tabs: [
      {
        label: 'Overview',
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Sessions</span>
                </div>
                <p className="text-2xl font-bold">15,234</p>
                <p className="text-xs text-muted-foreground">+8% from last week</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-secondary rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">New user registration</span>
                  <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-secondary rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">System backup completed</span>
                  <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        label: 'Users',
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">User Management</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium">Jane Smith</p>
                  <p className="text-xs text-muted-foreground">jane.smith@example.com</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium">Mike Johnson</p>
                  <p className="text-xs text-muted-foreground">mike.johnson@example.com</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        label: 'Settings',
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">System Configuration</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Preferences</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Email notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Push notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">SMS notifications</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Retention</label>
                <select className="w-full p-2 border rounded-md bg-background">
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Forever</option>
                </select>
              </div>
              <div className="pt-4">
                <Button className="w-full">Save Settings</Button>
              </div>
            </div>
          </div>
        ),
      },
    ],
    actions: [
      {
        icon: <Copy />,
        onClick: () => console.log('Copy clicked'),
        label: 'Copy data',
        active: true,
      },
      {
        icon: <X />,
        onClick: () => console.log('Close clicked'),
        label: 'Close panel',
      },
    ],
  },
}

// Simple tabs example
export const SimpleTabs: Story = {
  args: {
    title: 'Product Details',
    variant: 'outlined',
    size: 'sm',
    tabs: [
      {
        label: 'Description',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This is a high-quality product designed for modern workflows. It features advanced capabilities and
              seamless integration with existing systems.
            </p>
            <div className="space-y-1">
              <p className="text-xs font-medium">Key Features:</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Advanced analytics</li>
                <li>• Real-time updates</li>
                <li>• Cloud integration</li>
                <li>• Mobile responsive</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        label: 'Specifications',
        content: (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-muted-foreground">2.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Size</span>
              <span className="text-sm text-muted-foreground">4.2 MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Platform</span>
              <span className="text-sm text-muted-foreground">Web, iOS, Android</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">License</span>
              <span className="text-sm text-muted-foreground">MIT</span>
            </div>
          </div>
        ),
      },
      {
        label: 'Reviews',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.8/5 (127 reviews)</span>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-secondary rounded">
                <p className="text-xs font-medium">Sarah M.</p>
                <p className="text-xs text-muted-foreground">"Excellent product, very intuitive to use!"</p>
              </div>
              <div className="p-2 bg-secondary rounded">
                <p className="text-xs font-medium">David L.</p>
                <p className="text-xs text-muted-foreground">"Great value for money, highly recommended."</p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
}

export const LogDetails: Story = {
  args: {
    title: 'Log Details',
    subtitle: 'Lorem ipsum dolor sit amet consectetur.',
    details: [
      { label: 'Level', value: 'Info' },
      { label: 'Date', value: '05/27/2025' },
      { label: 'Time', value: '11:10:45' },
      { label: 'Trace ID', value: 'COMNP-4456789' },
      { label: 'Message', value: 'Content' },
      { label: 'ID', value: 'e3b94544-2ff4-485f-b38b-bc6f8de26700', highlighted: true },
      { label: 'Content ID', value: 'U7WFZ-1131568' },
      { label: 'Status', value: 'outline-processing' },
      { label: 'Content', value: 'null' },
      { label: 'Outline', value: 'null' },
      {
        label: 'Idea',
        value: (
          <div className="space-y-2">
            <div className="text-foreground font-medium">topic</div>
            <div className="text-muted-foreground text-sm leading-relaxed">
              Discover Hidden Gems: Fun Fact About Lord of the Rings Lore Only True Fans Know
            </div>
          </div>
        ),
      },
    ],
    actions: [
      {
        icon: <PictureInPicture2 />,
        onClick: () => console.log('Picture in picture clicked'),
        label: 'Picture in picture',
      },
      {
        icon: <X />,
        onClick: () => console.log('Close clicked'),
        label: 'Close panel',
      },
    ],
  },
}

export const BasicPanel: Story = {
  args: {
    title: 'User Information',
    variant: 'outlined',
    details: [
      { label: 'Name', value: 'John Doe' },
      { label: 'Email', value: 'john.doe@example.com' },
      { label: 'Role', value: 'Administrator' },
      { label: 'Status', value: 'Active', highlighted: true },
      { label: 'Last Login', value: '2 hours ago' },
    ],
    actions: [
      {
        icon: <Copy />,
        onClick: () => console.log('Copy clicked'),
        label: 'Copy details',
      },
    ],
  },
}

export const SimplePanel: Story = {
  args: {
    title: 'System Status',
    subtitle: 'Current system health metrics',
    variant: 'filled',
    details: [
      { label: 'CPU Usage', value: '42%' },
      { label: 'Memory', value: '1.2 GB / 4 GB' },
      { label: 'Uptime', value: '5 days, 3 hours' },
      { label: 'Status', value: 'Healthy', highlighted: true },
    ],
  },
}

export const WithoutActions: Story = {
  args: {
    title: 'Configuration Settings',
    details: [
      { label: 'Environment', value: 'Production' },
      { label: 'Version', value: '2.1.4' },
      { label: 'Build', value: '#1247' },
      { label: 'Region', value: 'us-east-1' },
    ],
  },
}

export const WithCustomContent: Story = {
  args: {
    title: 'API Response',
    subtitle: 'Detailed response information',
    details: [
      { label: 'Status Code', value: '200' },
      { label: 'Method', value: 'GET' },
      {
        label: 'Headers',
        value: (
          <div className="space-y-1 text-xs font-mono">
            <div>Content-Type: application/json</div>
            <div>Cache-Control: no-cache</div>
            <div>X-Request-ID: abc123</div>
          </div>
        ),
      },
      { label: 'Response Time', value: '124ms', highlighted: true },
    ],
    actions: [
      {
        icon: <Copy />,
        onClick: () => console.log('Copy response'),
        label: 'Copy response',
      },
      {
        icon: <X />,
        onClick: () => console.log('Close'),
        label: 'Close',
      },
    ],
  },
}

export const WithChildren: Story = {
  args: {
    title: 'Custom Content Panel',
    subtitle: 'Using children instead of details',
    variant: 'ghost',
    details: [],
    actions: [
      {
        icon: <X />,
        onClick: () => console.log('Close clicked'),
        label: 'Close panel',
      },
    ],
    children: (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Deployment completed</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Database backup started</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">High CPU usage detected</p>
                <p className="text-xs text-muted-foreground">10 minutes ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground">Response Time</p>
              <p className="text-lg font-semibold text-foreground">124ms</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground">Throughput</p>
              <p className="text-lg font-semibold text-foreground">2.4k/min</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground">Error Rate</p>
              <p className="text-lg font-semibold text-foreground">0.02%</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-lg font-semibold text-foreground">99.9%</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button className="w-full">View Full Report</Button>
        </div>
      </div>
    ),
  },
}

// Tabs with custom label components (icons + text)
export const TabsWithCustomLabels: Story = {
  args: {
    title: 'Analytics',
    variant: 'default',
    tabs: [
      {
        label: 'Overview',
        labelComponent: (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </div>
        ),
        content: <div className="text-sm text-muted-foreground">Overview content</div>,
      },
      {
        label: 'Users',
        labelComponent: (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Users</span>
          </div>
        ),
        content: <div className="text-sm text-muted-foreground">Users content</div>,
      },
      {
        label: 'Settings',
        labelComponent: (
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        ),
        content: <div className="text-sm text-muted-foreground">Settings content</div>,
      },
    ],
    actions: [
      {
        icon: <Copy />,
        onClick: () => console.log('Copy clicked'),
        label: 'Copy',
      },
    ],
  },
}

// Demonstrates custom styling for the content area
export const WithCustomContentClassName: Story = {
  args: {
    title: 'Custom Content Area',
    subtitle: 'Using contentClassName to style the inner area',
    variant: 'outlined',
    contentClassName: 'bg-secondary/30 rounded-md',
    details: [
      { label: 'A', value: 'Alpha' },
      { label: 'B', value: 'Beta', highlighted: true },
      { label: 'C', value: 'Charlie' },
    ],
  },
}
