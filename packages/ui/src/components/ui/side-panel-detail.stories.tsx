import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from 'storybook/test'
import { SidePanel } from './side-panel'
import { SidePanelDetail, SidePanelDetailItem } from './side-panel-detail'

const meta: Meta<typeof SidePanelDetail> = {
  title: 'UI/SidePanelDetail',
  component: SidePanelDetail,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A table-based detail view component for displaying labeled information in side panels. Uses semantic table structure with SidePanelDetailItem rows for consistent key-value pair display.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'object',
      description: 'SidePanelDetailItem components to render as rows',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-96 border rounded-lg p-4">
      <SidePanelDetail>
        <SidePanelDetailItem title="Name">John Doe</SidePanelDetailItem>
        <SidePanelDetailItem title="Email">john.doe@example.com</SidePanelDetailItem>
        <SidePanelDetailItem title="Role">Administrator</SidePanelDetailItem>
        <SidePanelDetailItem title="Status">Active</SidePanelDetailItem>
      </SidePanelDetail>
    </div>
  ),
}

export const WithRichContent: Story = {
  render: () => (
    <div className="w-96 border rounded-lg p-4">
      <SidePanelDetail>
        <SidePanelDetailItem title="File Name">Project Report.pdf</SidePanelDetailItem>
        <SidePanelDetailItem title="Size">2.4 MB</SidePanelDetailItem>
        <SidePanelDetailItem title="Type">PDF Document</SidePanelDetailItem>
        <SidePanelDetailItem title="Created">Jan 15, 2025</SidePanelDetailItem>
        <SidePanelDetailItem title="Modified">2 hours ago</SidePanelDetailItem>
        <SidePanelDetailItem title="Owner">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">JD</div>
            <span>John Doe</span>
          </div>
        </SidePanelDetailItem>
        <SidePanelDetailItem title="Tags">
          <div className="flex gap-1 flex-wrap">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Finance</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Q4</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">Report</span>
          </div>
        </SidePanelDetailItem>
      </SidePanelDetail>
    </div>
  ),
}

export const InSidePanel: Story = {
  render: () => (
    <div className="flex h-screen">
      <div className="flex-1 p-8 bg-background">
        <h2 className="text-2xl font-bold mb-4">Main Content</h2>
        <p className="text-muted-foreground">SidePanelDetail used within a SidePanel component.</p>
      </div>
      <SidePanel title="Document Details" subtitle="Report.pdf">
        <SidePanelDetail>
          <SidePanelDetailItem title="Size">2.4 MB</SidePanelDetailItem>
          <SidePanelDetailItem title="Type">PDF Document</SidePanelDetailItem>
          <SidePanelDetailItem title="Created">Jan 15, 2025</SidePanelDetailItem>
          <SidePanelDetailItem title="Modified">2 hours ago</SidePanelDetailItem>
          <SidePanelDetailItem title="Pages">24</SidePanelDetailItem>
          <SidePanelDetailItem title="Author">Marketing Team</SidePanelDetailItem>
        </SidePanelDetail>
      </SidePanel>
    </div>
  ),
}

export const UseCases: Story = {
  render: () => (
    <div className="space-y-8 p-8 max-w-4xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">User Profile Details</h3>
        <div className="border rounded-lg p-4 max-w-md">
          <SidePanelDetail>
            <SidePanelDetailItem title="Full Name">John Doe</SidePanelDetailItem>
            <SidePanelDetailItem title="Username">@johndoe</SidePanelDetailItem>
            <SidePanelDetailItem title="Email">john.doe@company.com</SidePanelDetailItem>
            <SidePanelDetailItem title="Department">Engineering</SidePanelDetailItem>
            <SidePanelDetailItem title="Location">San Francisco, CA</SidePanelDetailItem>
            <SidePanelDetailItem title="Joined">January 2024</SidePanelDetailItem>
          </SidePanelDetail>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">System Information</h3>
        <div className="border rounded-lg p-4 max-w-md">
          <SidePanelDetail>
            <SidePanelDetailItem title="Status">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online
              </span>
            </SidePanelDetailItem>
            <SidePanelDetailItem title="Version">v2.1.4</SidePanelDetailItem>
            <SidePanelDetailItem title="Uptime">5 days, 3 hours</SidePanelDetailItem>
            <SidePanelDetailItem title="CPU">42%</SidePanelDetailItem>
            <SidePanelDetailItem title="Memory">1.2 GB / 4 GB</SidePanelDetailItem>
            <SidePanelDetailItem title="Region">us-east-1</SidePanelDetailItem>
          </SidePanelDetail>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Order Details</h3>
        <div className="border rounded-lg p-4 max-w-md">
          <SidePanelDetail>
            <SidePanelDetailItem title="Order ID">#ORD-2024-00123</SidePanelDetailItem>
            <SidePanelDetailItem title="Customer">Jane Smith</SidePanelDetailItem>
            <SidePanelDetailItem title="Date">Jan 20, 2025</SidePanelDetailItem>
            <SidePanelDetailItem title="Status">
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Delivered</span>
            </SidePanelDetailItem>
            <SidePanelDetailItem title="Total">$299.99</SidePanelDetailItem>
            <SidePanelDetailItem title="Payment">Visa •••• 4242</SidePanelDetailItem>
          </SidePanelDetail>
        </div>
      </div>
    </div>
  ),
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 p-8 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Semantic Table Structure</h3>
        <p className="text-sm text-muted-foreground mb-4">
          SidePanelDetail uses a semantic table structure for proper screen reader interpretation.
        </p>
        <div className="border rounded-lg p-4">
          <SidePanelDetail>
            <SidePanelDetailItem title="Property 1">Value 1</SidePanelDetailItem>
            <SidePanelDetailItem title="Property 2">Value 2</SidePanelDetailItem>
            <SidePanelDetailItem title="Property 3">Value 3</SidePanelDetailItem>
          </SidePanelDetail>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg space-y-3">
        <div>
          <p className="text-xs font-semibold mb-2">Screen Reader Support:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              • Uses semantic <code className="px-1 bg-background rounded">table</code> element for proper structure
            </li>
            <li>
              • Each row uses <code className="px-1 bg-background rounded">tr</code> and{' '}
              <code className="px-1 bg-background rounded">td</code> elements
            </li>
            <li>• Screen readers announce table structure and navigate by rows</li>
            <li>• Title column provides context for each value</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Best Practices:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use descriptive, concise titles for each row</li>
            <li>• Keep titles consistent in length when possible</li>
            <li>• Values can contain rich content (badges, avatars, icons)</li>
            <li>• Maintain consistent spacing for visual hierarchy</li>
            <li>• Group related information in the same table</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Usage Guidelines:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ideal for displaying object properties and metadata</li>
            <li>• Works well in side panels and detail views</li>
            <li>• Combine with SidePanel for complete detail interface</li>
            <li>• Use custom JSX in children for complex value rendering</li>
          </ul>
        </div>
      </div>
    </div>
  ),
}

// Interaction Tests (Semantic Verification)
export const SemanticTableStructure: Story = {
  render: () => (
    <SidePanelDetail>
      <SidePanelDetailItem title="Name">Test User</SidePanelDetailItem>
      <SidePanelDetailItem title="Email">test@example.com</SidePanelDetailItem>
    </SidePanelDetail>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table')
    await expect(table).toBeInTheDocument()
    const rows = canvasElement.querySelectorAll('tr')
    await expect(rows.length).toBe(2)
  },
}
