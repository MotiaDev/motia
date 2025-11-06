import type { Meta, StoryObj } from '@storybook/react'
import { Building2, FileText, Folder, Home } from 'lucide-react'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Breadcrumb } from './breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A breadcrumb component for displaying navigation paths.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: { type: 'object' },
      description: 'Array of breadcrumb items with support for different types (link, button, dropdown)',
    },
  },
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      { label: 'Projects', onClick: () => console.log('Projects') },
      { label: 'Current Project', onClick: () => console.log('Current Project') },
    ],
  },
}

export const WithLinks: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      { label: 'Projects', onClick: () => console.log('Projects') },
      { label: 'Current Project', onClick: () => console.log('Current Project') },
    ],
  },
}

export const WithIcons: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home'), icon: <Home className="size-4" /> },
      { label: 'Documents', onClick: () => console.log('Documents'), icon: <Folder className="size-4" /> },
      { label: 'Report.pdf', onClick: () => console.log('Report.pdf'), icon: <FileText className="size-4" /> },
    ],
  },
}

export const WithDropdown: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      {
        label: 'Organizations',
        onClick: () => console.log('Organizations'),
        dropdownItems: [
          { label: 'Acme Corp', onClick: () => console.log('Acme Corp') },
          { label: 'Tech Solutions', onClick: () => console.log('Tech Solutions') },
          { label: 'Design Studio', onClick: () => console.log('Design Studio') },
          { label: 'All Organizations', onClick: () => console.log('All Organizations') },
        ],
      },
      { label: 'Current Project', onClick: () => console.log('Current Project') },
    ],
  },
}

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Dashboard', onClick: () => console.log('Dashboard') }],
  },
}

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      { label: 'Organizations', onClick: () => console.log('Organizations') },
      { label: 'Development Team', onClick: () => console.log('Development Team') },
      { label: 'Projects', onClick: () => console.log('Projects') },
      { label: 'Web Application', onClick: () => console.log('Web Application') },
    ],
  },
}

export const WithClickHandlers: Story = {
  args: {
    items: [
      {
        label: 'Dashboard',
        onClick: () => console.log('Navigated to Dashboard'),
      },
      {
        label: 'Users',
        onClick: () => console.log('Navigated to Users'),
      },
      {
        label: 'User Profile',
        onClick: () => console.log('Navigated to User Profile'),
      },
    ],
  },
}

export const TruncatedLabels: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      {
        label: 'Very Long Organization Name That Should Truncate',
        onClick: () => console.log('Very Long Organization Name That Should Truncate'),
      },
      {
        label: 'Another Very Long Project Name That Might Overflow',
        onClick: () => console.log('Another Very Long Project Name That Might Overflow'),
      },
      { label: 'Settings', onClick: () => console.log('Settings') },
    ],
  },
}

export const MixedTypes: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      {
        label: 'Organizations',
        onClick: () => console.log('Organizations'),
        dropdownItems: [
          {
            label: 'My Organization',
            icon: <Building2 className="size-4" />,
            onClick: () => console.log('My Organization'),
          },
          { label: 'Partner Org', icon: <Building2 className="size-4" />, onClick: () => console.log('Partner Org') },
          {
            label: 'All Organizations',
            icon: <Building2 className="size-4" />,
            onClick: () => console.log('All Organizations'),
          },
        ],
      },
      { label: 'Projects', onClick: () => console.log('Projects') },
      { label: 'Current Project', onClick: () => console.log('Current Project') },
    ],
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Basic Breadcrumb</h3>
        <Breadcrumb
          items={[
            { label: 'Home', onClick: () => console.log('Home') },
            { label: 'Products', onClick: () => console.log('Products') },
            { label: 'Details', onClick: () => console.log('Details') },
          ]}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Icons</h3>
        <Breadcrumb
          items={[
            { label: 'Home', icon: <Home className="size-4" />, onClick: () => console.log('Home') },
            { label: 'Folder', icon: <Folder className="size-4" />, onClick: () => console.log('Folder') },
            { label: 'File', icon: <FileText className="size-4" />, onClick: () => console.log('File') },
          ]}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Dropdown</h3>
        <Breadcrumb
          items={[
            { label: 'Home', onClick: () => console.log('Home') },
            {
              label: 'Categories',
              onClick: () => console.log('Categories'),
              dropdownItems: [
                { label: 'Electronics', onClick: () => console.log('Electronics') },
                { label: 'Clothing', onClick: () => console.log('Clothing') },
                { label: 'Books', onClick: () => console.log('Books') },
              ],
            },
            { label: 'Product', onClick: () => console.log('Product') },
          ]}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Mixed: Icons + Dropdown</h3>
        <Breadcrumb
          items={[
            { label: 'Root', icon: <Home className="size-4" />, onClick: () => console.log('Root') },
            {
              label: 'Documents',
              icon: <Folder className="size-4" />,
              dropdownItems: [
                { label: 'Personal', icon: <Building2 className="size-4" />, onClick: () => console.log('Personal') },
                { label: 'Work', icon: <Building2 className="size-4" />, onClick: () => console.log('Work') },
              ],
            },
            { label: 'File.pdf', icon: <FileText className="size-4" />, onClick: () => console.log('File.pdf') },
          ]}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Single Item</h3>
        <Breadcrumb items={[{ label: 'Dashboard', onClick: () => console.log('Dashboard') }]} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Long Path</h3>
        <Breadcrumb
          items={[
            { label: 'Home', onClick: () => console.log('Home') },
            { label: 'Organization', onClick: () => console.log('Organization') },
            { label: 'Department', onClick: () => console.log('Department') },
            { label: 'Team', onClick: () => console.log('Team') },
            { label: 'Project', onClick: () => console.log('Project') },
            { label: 'Current Page', onClick: () => console.log('Current Page') },
          ]}
        />
      </div>
    </div>
  ),
}

export const UseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">E-commerce Navigation</h3>
        <div className="p-4 border rounded-lg bg-secondary/50">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: () => console.log('Navigate to Home') },
              { label: 'Electronics', onClick: () => console.log('Navigate to Electronics') },
              { label: 'Computers', onClick: () => console.log('Navigate to Computers') },
              { label: 'Laptops', onClick: () => console.log('Navigate to Laptops') },
              { label: 'MacBook Pro 16"', onClick: () => console.log('Current Product') },
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Admin Dashboard Navigation</h3>
        <div className="p-4 border rounded-lg bg-secondary/50">
          <Breadcrumb
            items={[
              { label: 'Dashboard', icon: <Home className="size-4" />, onClick: () => console.log('Dashboard') },
              { label: 'Users', onClick: () => console.log('Users') },
              { label: 'John Doe', onClick: () => console.log('John Doe Profile') },
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">File System Browser</h3>
        <div className="p-4 border rounded-lg bg-secondary/50">
          <Breadcrumb
            items={[
              { label: 'Root', icon: <Home className="size-4" />, onClick: () => console.log('Root') },
              {
                label: 'Documents',
                icon: <Folder className="size-4" />,
                onClick: () => console.log('Documents'),
                dropdownItems: [
                  { label: 'Personal', onClick: () => console.log('Personal') },
                  { label: 'Work', onClick: () => console.log('Work') },
                  { label: 'Shared', onClick: () => console.log('Shared') },
                  { label: 'All Folders', onClick: () => console.log('All Folders') },
                ],
              },
              { label: 'Projects', icon: <Folder className="size-4" />, onClick: () => console.log('Projects') },
              { label: 'report.pdf', icon: <FileText className="size-4" />, onClick: () => console.log('File') },
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Multi-Organization Selector</h3>
        <div className="p-4 border rounded-lg bg-secondary/50">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: () => console.log('Home') },
              {
                label: 'Acme Corp',
                icon: <Building2 className="size-4" />,
                dropdownItems: [
                  {
                    label: 'Acme Corp',
                    icon: <Building2 className="size-4" />,
                    onClick: () => console.log('Switch to Acme Corp'),
                  },
                  {
                    label: 'Tech Solutions',
                    icon: <Building2 className="size-4" />,
                    onClick: () => console.log('Switch to Tech Solutions'),
                  },
                  {
                    label: 'Design Studio',
                    icon: <Building2 className="size-4" />,
                    onClick: () => console.log('Switch to Design Studio'),
                  },
                ],
              },
              { label: 'Projects', onClick: () => console.log('Projects') },
              { label: 'Website Redesign', onClick: () => console.log('Website Redesign') },
            ]}
          />
        </div>
      </div>
    </div>
  ),
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Accessible Breadcrumb Navigation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Breadcrumbs use button elements for clickable items, making them keyboard accessible. The last item is
          non-interactive to indicate the current page.
        </p>
        <nav aria-label="Breadcrumb navigation">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: () => console.log('Navigate to Home') },
              { label: 'Products', onClick: () => console.log('Navigate to Products') },
              { label: 'Electronics', onClick: () => console.log('Navigate to Electronics') },
              { label: 'Current Product', onClick: () => console.log('Current page') },
            ]}
          />
        </nav>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Screen Reader Support</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Icons should have aria-labels or be hidden from screen readers when paired with text.
        </p>
        <nav aria-label="File system navigation">
          <Breadcrumb
            items={[
              {
                label: (
                  <>
                    <Home className="size-4" aria-hidden="true" />
                    <span className="sr-only">Home</span>
                  </>
                ),
                onClick: () => console.log('Home'),
              },
              {
                label: (
                  <>
                    <Folder className="size-4" aria-hidden="true" />
                    <span>Documents</span>
                  </>
                ),
                onClick: () => console.log('Documents'),
              },
              {
                label: (
                  <>
                    <FileText className="size-4" aria-hidden="true" />
                    <span>report.pdf</span>
                    <span className="sr-only">(current page)</span>
                  </>
                ),
                onClick: () => console.log('Current'),
              },
            ]}
          />
        </nav>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Keyboard Navigation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Users can navigate using Tab key to move between breadcrumb items and Enter/Space to activate. Dropdown items
          are accessible via Arrow keys when dropdown is open.
        </p>
        <nav aria-label="Breadcrumb with dropdown">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: () => console.log('Home') },
              {
                label: 'Organizations',
                dropdownItems: [
                  { label: 'Organization A', onClick: () => console.log('Org A') },
                  { label: 'Organization B', onClick: () => console.log('Org B') },
                  { label: 'Organization C', onClick: () => console.log('Org C') },
                ],
              },
              { label: 'Current Page', onClick: () => console.log('Current') },
            ]}
          />
        </nav>
        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <p className="text-xs font-mono">
            <strong>Keyboard shortcuts:</strong>
            <br />
            <span className="text-muted-foreground">
              • Tab: Navigate between breadcrumb items
              <br />• Enter/Space: Activate breadcrumb item or open dropdown
              <br />• Arrow keys: Navigate dropdown options (when open)
              <br />• Escape: Close dropdown
            </span>
          </p>
        </div>
      </div>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => {
    const handleItemClick = (label: string) => {
      alert(`Clicked on: ${label}`)
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Button Navigation</h3>
          <Breadcrumb
            items={[
              { label: 'Home', onClick: () => handleItemClick('Home') },
              { label: 'Products', onClick: () => handleItemClick('Products') },
              {
                label: 'Electronics',
                onClick: () => handleItemClick('Electronics'),
              },
            ]}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Link Navigation</h3>
          <Breadcrumb
            items={[
              { label: 'Home', onClick: () => handleItemClick('Home') },
              { label: 'Products', onClick: () => handleItemClick('Products') },
              {
                label: 'Electronics',
                onClick: () => handleItemClick('Electronics'),
              },
            ]}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">File System with Mixed Types</h3>
          <Breadcrumb
            items={[
              {
                label: 'Root',
                icon: <Home className="size-4" />,
                onClick: () => handleItemClick('Root'),
              },
              {
                label: 'Documents',
                icon: <Folder className="size-4" />,
                dropdownItems: [
                  {
                    label: 'Personal',
                    icon: <Building2 className="size-4" />,
                    onClick: () => handleItemClick('Personal'),
                  },
                  { label: 'Work', icon: <Building2 className="size-4" />, onClick: () => handleItemClick('Work') },
                  { label: 'Shared', icon: <Folder className="size-4" />, onClick: () => handleItemClick('Shared') },
                  {
                    label: 'All Documents',
                    icon: <FileText className="size-4" />,
                    onClick: () => handleItemClick('All Documents'),
                  },
                ],
              },
              {
                label: 'Projects',
                icon: <Folder className="size-4" />,
                onClick: () => handleItemClick('Projects'),
              },
              {
                label: 'readme.txt',
                icon: <FileText className="size-4" />,
                onClick: () => handleItemClick('readme.txt'),
              },
            ]}
          />
        </div>
      </div>
    )
  },
}

// Interaction Tests
export const ClickBreadcrumb: Story = {
  render: () => {
    const handleClick = fn()
    return (
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => handleClick('Home') },
          { label: 'Products', onClick: () => handleClick('Products') },
          { label: 'Current Page', onClick: () => handleClick('Current') },
        ]}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const homeButton = canvas.getByRole('button', { name: 'Home' })
    await userEvent.click(homeButton)
  },
}

export const DropdownSelection: Story = {
  render: () => {
    const handleClick = fn()
    return (
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => handleClick('Home') },
          {
            label: 'Categories',
            onClick: () => handleClick('Categories'),
            dropdownItems: [
              { label: 'Electronics', onClick: () => handleClick('Electronics') },
              { label: 'Clothing', onClick: () => handleClick('Clothing') },
            ],
          },
          { label: 'Product', onClick: () => handleClick('Product') },
        ]}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const categoriesButton = canvas.getByRole('button', { name: /categories/i })
    await userEvent.click(categoriesButton)
    // Dropdown content is portaled, use screen to query from document
    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
    const electronicsItem = screen.getByRole('menuitem', { name: 'Electronics' })
    await userEvent.click(electronicsItem)
  },
}
