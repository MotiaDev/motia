import type { Meta, StoryObj } from '@storybook/react'
import { Building2, FileText, Folder, Home } from 'lucide-react'
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
      {
        label: 'Current Project',
        onClick: () => console.log('Current Project'),
      },
    ],
  },
}

export const WithLinks: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home') },
      { label: 'Projects', onClick: () => console.log('Projects') },
      {
        label: 'Current Project',
        onClick: () => console.log('Current Project'),
      },
    ],
  },
}

export const WithIcons: Story = {
  args: {
    items: [
      {
        label: 'Home',
        onClick: () => console.log('Home'),
        icon: <Home className="size-4" />,
      },
      {
        label: 'Documents',
        onClick: () => console.log('Documents'),
        icon: <Folder className="size-4" />,
      },
      {
        label: 'Report.pdf',
        onClick: () => console.log('Report.pdf'),
        icon: <FileText className="size-4" />,
      },
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
          {
            label: 'Tech Solutions',
            onClick: () => console.log('Tech Solutions'),
          },
          {
            label: 'Design Studio',
            onClick: () => console.log('Design Studio'),
          },
          {
            label: 'All Organizations',
            onClick: () => console.log('All Organizations'),
          },
        ],
      },
      {
        label: 'Current Project',
        onClick: () => console.log('Current Project'),
      },
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
      {
        label: 'Development Team',
        onClick: () => console.log('Development Team'),
      },
      { label: 'Projects', onClick: () => console.log('Projects') },
      {
        label: 'Web Application',
        onClick: () => console.log('Web Application'),
      },
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
          {
            label: 'Partner Org',
            icon: <Building2 className="size-4" />,
            onClick: () => console.log('Partner Org'),
          },
          {
            label: 'All Organizations',
            icon: <Building2 className="size-4" />,
            onClick: () => console.log('All Organizations'),
          },
        ],
      },
      { label: 'Projects', onClick: () => console.log('Projects') },
      {
        label: 'Current Project',
        onClick: () => console.log('Current Project'),
      },
    ],
  },
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
                  {
                    label: 'Work',
                    icon: <Building2 className="size-4" />,
                    onClick: () => handleItemClick('Work'),
                  },
                  {
                    label: 'Shared',
                    icon: <Folder className="size-4" />,
                    onClick: () => handleItemClick('Shared'),
                  },
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
