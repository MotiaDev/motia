import type { Meta, StoryObj } from '@storybook/react'
import { Sidebar, APP_SIDEBAR_CONTAINER_ID } from './sidebar'
import { Button } from './button'
import { useState } from 'react'

const meta: Meta<typeof Sidebar> = {
  title: 'UI/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A resizable sidebar component that appears from the side of the screen.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'closed' },
    initialWidth: { control: 'number' },
    containerId: { control: 'text' },
    children: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ flexGrow: 1, padding: '20px' }}>
          <p>Main content area</p>
          <Story />
        </div>
        <div id={APP_SIDEBAR_CONTAINER_ID} />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const SidebarTemplate: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Sidebar</Button>
      {isOpen && (
        <Sidebar onClose={() => setIsOpen(false)}>
          <div className="p-4">
            <h2 className="text-lg font-semibold">Sidebar Content</h2>
            <p className="mt-2">This is the content of the sidebar.</p>
            <Button onClick={() => setIsOpen(false)} className="mt-4">
              Close
            </Button>
          </div>
        </Sidebar>
      )}
    </>
  )
}

export const Default: Story = {
  render: () => <SidebarTemplate />,
}

const SidebarWithInitialWidthTemplate: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
  
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Sidebar with 600px initial width</Button>
        {isOpen && (
          <Sidebar onClose={() => setIsOpen(false)} initialWidth={600}>
            <div className="p-4">
              <h2 className="text-lg font-semibold">Sidebar Content</h2>
              <p className="mt-2">This sidebar started at 600px width.</p>
              <Button onClick={() => setIsOpen(false)} className="mt-4">
                Close
              </Button>
            </div>
          </Sidebar>
        )}
      </>
    )
  }

export const WithInitialWidth: Story = {
    render: () => <SidebarWithInitialWidthTemplate />,
}
