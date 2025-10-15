import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A table component for displaying tabular data with headers, body, footer, and caption support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the table.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>John Doe</TableCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>Developer</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Jane Smith</TableCell>
          <TableCell>jane@example.com</TableCell>
          <TableCell>Designer</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bob Johnson</TableCell>
          <TableCell>bob@example.com</TableCell>
          <TableCell>Manager</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Widget A</TableCell>
          <TableCell>5</TableCell>
          <TableCell className="text-right">$25.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Widget B</TableCell>
          <TableCell>3</TableCell>
          <TableCell className="text-right">$45.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Widget C</TableCell>
          <TableCell>2</TableCell>
          <TableCell className="text-right">$30.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">$100.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>#INV-001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>#INV-002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>#INV-003</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>$350.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const SelectableRows: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Fix navigation bug</TableCell>
          <TableCell>In Progress</TableCell>
          <TableCell>High</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell>Update documentation</TableCell>
          <TableCell>Todo</TableCell>
          <TableCell>Medium</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Implement dark mode</TableCell>
          <TableCell>Review</TableCell>
          <TableCell>Low</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const AllFeatures: Story = {
  render: () => (
    <Table>
      <TableCaption>Quarterly sales report for 2025</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          <TableHead>Region</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Q1</TableCell>
          <TableCell>North America</TableCell>
          <TableCell className="text-right">$125,000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q1</TableCell>
          <TableCell>Europe</TableCell>
          <TableCell className="text-right">$95,000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q2</TableCell>
          <TableCell>North America</TableCell>
          <TableCell className="text-right">$135,000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q2</TableCell>
          <TableCell>Europe</TableCell>
          <TableCell className="text-right">$105,000</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total Revenue</TableCell>
          <TableCell className="text-right">$460,000</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

export const DataTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-xs">#001</TableCell>
          <TableCell>Alice Williams</TableCell>
          <TableCell>alice@company.com</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>
            <Badge variant="success">Active</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">#002</TableCell>
          <TableCell>Bob Chen</TableCell>
          <TableCell>bob@company.com</TableCell>
          <TableCell>Design</TableCell>
          <TableCell>
            <Badge variant="success">Active</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">#003</TableCell>
          <TableCell>Carol Martinez</TableCell>
          <TableCell>carol@company.com</TableCell>
          <TableCell>Marketing</TableCell>
          <TableCell>
            <Badge variant="warning">Away</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">#004</TableCell>
          <TableCell>David Kim</TableCell>
          <TableCell>david@company.com</TableCell>
          <TableCell>Sales</TableCell>
          <TableCell>
            <Badge variant="error">Inactive</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">#005</TableCell>
          <TableCell>Emma Wilson</TableCell>
          <TableCell>emma@company.com</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>
            <Badge variant="success">Active</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const PricingTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Users</TableHead>
          <TableHead>Storage</TableHead>
          <TableHead>Support</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-semibold">Free</TableCell>
          <TableCell>Up to 5</TableCell>
          <TableCell>1 GB</TableCell>
          <TableCell>Community</TableCell>
          <TableCell className="text-right font-semibold">$0/mo</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell className="font-semibold">Pro</TableCell>
          <TableCell>Up to 20</TableCell>
          <TableCell>10 GB</TableCell>
          <TableCell>Email</TableCell>
          <TableCell className="text-right font-semibold">$29/mo</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-semibold">Enterprise</TableCell>
          <TableCell>Unlimited</TableCell>
          <TableCell>Unlimited</TableCell>
          <TableCell>Priority 24/7</TableCell>
          <TableCell className="text-right font-semibold">Custom</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const StatusTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Uptime</TableHead>
          <TableHead>Last Check</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>API Server</TableCell>
          <TableCell>
            <Badge variant="success">Operational</Badge>
          </TableCell>
          <TableCell>99.99%</TableCell>
          <TableCell className="text-muted-foreground">2 min ago</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Database</TableCell>
          <TableCell>
            <Badge variant="success">Operational</Badge>
          </TableCell>
          <TableCell>99.95%</TableCell>
          <TableCell className="text-muted-foreground">2 min ago</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cache Server</TableCell>
          <TableCell>
            <Badge variant="warning">Degraded</Badge>
          </TableCell>
          <TableCell>98.50%</TableCell>
          <TableCell className="text-muted-foreground">1 min ago</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>CDN</TableCell>
          <TableCell>
            <Badge variant="error">Down</Badge>
          </TableCell>
          <TableCell>95.20%</TableCell>
          <TableCell className="text-muted-foreground">Just now</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Email Service</TableCell>
          <TableCell>
            <Badge variant="info">Maintenance</Badge>
          </TableCell>
          <TableCell>99.80%</TableCell>
          <TableCell className="text-muted-foreground">5 min ago</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const CompactTable: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-xs">2025-10-08</TableCell>
            <TableCell className="text-sm">User login</TableCell>
            <TableCell className="text-sm">alice@example.com</TableCell>
            <TableCell className="text-right">
              <Badge variant="success">✓</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">2025-10-08</TableCell>
            <TableCell className="text-sm">File uploaded</TableCell>
            <TableCell className="text-sm">bob@example.com</TableCell>
            <TableCell className="text-right">
              <Badge variant="success">✓</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">2025-10-08</TableCell>
            <TableCell className="text-sm">Payment processed</TableCell>
            <TableCell className="text-sm">carol@example.com</TableCell>
            <TableCell className="text-right">
              <Badge variant="success">✓</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">2025-10-07</TableCell>
            <TableCell className="text-sm">Failed login attempt</TableCell>
            <TableCell className="text-sm">unknown@example.com</TableCell>
            <TableCell className="text-right">
              <Badge variant="error">✗</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">2025-10-07</TableCell>
            <TableCell className="text-sm">API key generated</TableCell>
            <TableCell className="text-sm">david@example.com</TableCell>
            <TableCell className="text-right">
              <Badge variant="success">✓</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}

export const ResponsiveTable: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <p className="text-sm text-muted-foreground mb-3">
        This table demonstrates horizontal scrolling for overflow content
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Shipping</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-xs">#ORD-1234</TableCell>
            <TableCell>John Doe</TableCell>
            <TableCell>Laptop Pro 15"</TableCell>
            <TableCell>1</TableCell>
            <TableCell>$1,299.00</TableCell>
            <TableCell>$1,299.00</TableCell>
            <TableCell>$103.92</TableCell>
            <TableCell>$15.00</TableCell>
            <TableCell className="text-right font-semibold">$1,417.92</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">#ORD-1235</TableCell>
            <TableCell>Jane Smith</TableCell>
            <TableCell>Wireless Mouse</TableCell>
            <TableCell>2</TableCell>
            <TableCell>$49.99</TableCell>
            <TableCell>$99.98</TableCell>
            <TableCell>$8.00</TableCell>
            <TableCell>$5.00</TableCell>
            <TableCell className="text-right font-semibold">$112.98</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">#ORD-1236</TableCell>
            <TableCell>Bob Johnson</TableCell>
            <TableCell>USB-C Hub</TableCell>
            <TableCell>3</TableCell>
            <TableCell>$79.99</TableCell>
            <TableCell>$239.97</TableCell>
            <TableCell>$19.20</TableCell>
            <TableCell>$10.00</TableCell>
            <TableCell className="text-right font-semibold">$269.17</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={8}>Grand Total</TableCell>
            <TableCell className="text-right font-bold">$1,800.07</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
}

export const AllExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Table</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column 1</TableHead>
              <TableHead>Column 2</TableHead>
              <TableHead>Column 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data 1</TableCell>
              <TableCell>Data 2</TableCell>
              <TableCell>Data 3</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Data 4</TableCell>
              <TableCell>Data 5</TableCell>
              <TableCell>Data 6</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">With Status Badges</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Implement feature X</TableCell>
              <TableCell>Alice</TableCell>
              <TableCell>
                <Badge variant="success">Done</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Fix bug Y</TableCell>
              <TableCell>Bob</TableCell>
              <TableCell>
                <Badge variant="info">In Progress</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Review PR Z</TableCell>
              <TableCell>Carol</TableCell>
              <TableCell>
                <Badge variant="warning">Pending</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">With Footer Summary</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Development</TableCell>
              <TableCell className="text-right">$5,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Design</TableCell>
              <TableCell className="text-right">$3,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Marketing</TableCell>
              <TableCell className="text-right">$2,000</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">$10,000</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  ),
}
