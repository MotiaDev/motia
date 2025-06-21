import type { Meta, StoryObj } from '@storybook/react'
import { Panel } from './panel'
import { Button } from './button'
import { PictureInPicture2, X, Copy } from "lucide-react"


const meta: Meta<typeof Panel> = {
  title: 'Components/Panel',
  component: Panel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A glassmorphic panel component for displaying structured information with a header and key-value pairs.',
      },
    },
  },
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
  },
}

export default meta
type Story = StoryObj<typeof meta>

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
        )
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
        )
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
          <Button className="w-full">
            View Full Report
          </Button>
        </div>
      </div>
    ),
  },
}

export const LightAndDark: Story = {
  render: () => (
    <div className="flex gap-8 items-start">
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900">Light Theme</h3>
        <div className="w-96 h-[500px]">
          <Panel
            title="System Status"
            subtitle="Current system health metrics"
            details={[
              { label: 'Environment', value: 'Production' },
              { label: 'Status', value: 'Healthy', highlighted: true },
              { label: 'CPU Usage', value: '42%' },
              { label: 'Memory', value: '1.2 GB / 4 GB' },
              { label: 'Uptime', value: '5 days, 3 hours' },
              { label: 'Last Deploy', value: '2 hours ago' },
            ]}
            actions={[
              {
                icon: <Copy />,
                onClick: () => console.log('Copy clicked'),
                label: 'Copy details',
              },
              {
                icon: <X />,
                onClick: () => console.log('Close clicked'),
                label: 'Close panel',
              },
            ]}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-lg dark">
        <h3 className="text-lg font-semibold text-white">Dark Theme</h3>
        <div className="w-96 h-[500px]">
          <Panel
            title="System Status"
            subtitle="Current system health metrics"
            details={[
              { label: 'Environment', value: 'Production' },
              { label: 'Status', value: 'Healthy', highlighted: true },
              { label: 'CPU Usage', value: '42%' },
              { label: 'Memory', value: '1.2 GB / 4 GB' },
              { label: 'Uptime', value: '5 days, 3 hours' },
              { label: 'Last Deploy', value: '2 hours ago' },
            ]}
            actions={[
              {
                icon: <Copy />,
                onClick: () => console.log('Copy clicked'),
                label: 'Copy details',
              },
              {
                icon: <X />,
                onClick: () => console.log('Close clicked'),
                label: 'Close panel',
              },
            ]}
          />
        </div>
      </div>
    </div>
  ),
} 