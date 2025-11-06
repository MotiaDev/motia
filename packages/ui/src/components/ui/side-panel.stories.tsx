import type { Meta, StoryObj } from '@storybook/react'
import { Copy, Download, Edit, FileText, Settings, Share, Star, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { fn, userEvent, within } from 'storybook/test'
import { Button } from './button'
import { SidePanel } from './side-panel'

const meta: Meta<typeof SidePanel> = {
  title: 'UI/SidePanel',
  component: SidePanel,
  parameters: {
    layout: 'fullscreen',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A side panel component for displaying detailed information with header, actions, and scrollable content. Typically positioned on the right side of the screen at 1/3 width with close functionality and custom action buttons.',
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
    actions: {
      control: 'object',
      description: 'Array of action buttons displayed in the header (icon, onClick, label)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the panel',
    },
    children: {
      control: 'object',
      description: 'Content to render inside the scrollable panel body',
    },
    onClose: {
      description: 'Callback fired when the close button is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    if (!open) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Button onClick={() => setOpen(true)}>Open Panel</Button>
        </div>
      )
    }

    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8 bg-background">
          <h2 className="text-2xl font-bold mb-4">Main Content</h2>
          <p className="text-muted-foreground">The side panel appears on the right side of the screen.</p>
        </div>
        <SidePanel title="Panel Title" subtitle="Panel subtitle" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm">This is the default side panel with a title, subtitle, and close button.</p>
            <p className="text-sm text-muted-foreground">
              The panel takes 1/3 of the screen width and has a scrollable content area.
            </p>
          </div>
        </SidePanel>
      </div>
    )
  },
}

export const WithActions: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    if (!open) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Button onClick={() => setOpen(true)}>Open Panel with Actions</Button>
        </div>
      )
    }

    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8 bg-background">
          <h2 className="text-2xl font-bold mb-4">Main Content</h2>
          <p className="text-muted-foreground">Side panel with custom action buttons.</p>
        </div>
        <SidePanel
          title="Document Details"
          subtitle="Project Report.pdf"
          onClose={() => setOpen(false)}
          actions={[
            {
              icon: <Star className="w-4 h-4" />,
              onClick: () => console.log('Starred'),
              label: 'Star',
            },
            {
              icon: <Share className="w-4 h-4" />,
              onClick: () => console.log('Shared'),
              label: 'Share',
            },
            {
              icon: <Download className="w-4 h-4" />,
              onClick: () => console.log('Downloaded'),
              label: 'Download',
            },
          ]}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">File Information</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span>2.4 MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span>PDF Document</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modified</span>
                  <span>2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </SidePanel>
      </div>
    )
  },
}

export const WithRichContent: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    if (!open) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Button onClick={() => setOpen(true)}>Open Rich Panel</Button>
        </div>
      )
    }

    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8 bg-background">
          <h2 className="text-2xl font-bold mb-4">Main Content</h2>
          <p className="text-muted-foreground">Side panel with rich content and multiple sections.</p>
        </div>
        <SidePanel title="User Profile" subtitle="john.doe@example.com" onClose={() => setOpen(false)}>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-sm text-muted-foreground">Administrator</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">About</p>
              <p className="text-sm">
                Software engineer with a passion for building great user experiences. Based in San Francisco, CA.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Details</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span>Administrator</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span>Engineering</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span>Jan 2024</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Activity</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <p>Updated project documentation</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div>
                    <p>Reviewed pull request #234</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                  <div>
                    <p>Created new task in project board</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidePanel>
      </div>
    )
  },
}

export const UseCases: Story = {
  render: () => {
    const [openFile, setOpenFile] = useState(false)
    const [openSettings, setOpenSettings] = useState(false)

    return (
      <div className="space-y-8 p-8">
        <div>
          <h3 className="text-sm font-semibold mb-3">File Details Panel</h3>
          <Button onClick={() => setOpenFile(true)}>Open File Details</Button>
          {openFile && (
            <div className="fixed inset-0 flex z-50">
              <div className="flex-1 bg-background/80" onClick={() => setOpenFile(false)} />
              <SidePanel
                title="Report.pdf"
                subtitle="Last modified 2 hours ago"
                onClose={() => setOpenFile(false)}
                actions={[
                  {
                    icon: <Download className="w-4 h-4" />,
                    onClick: () => console.log('Download'),
                    label: 'Download',
                  },
                  {
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => console.log('Edit'),
                    label: 'Edit',
                  },
                  {
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => console.log('Delete'),
                    label: 'Delete',
                  },
                ]}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold mb-2">Properties</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size</span>
                        <span>2.4 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span>PDF Document</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span>Jan 15, 2025</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">
                      Annual report containing financial statements and performance metrics for Q4 2024.
                    </p>
                  </div>
                </div>
              </SidePanel>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Settings Panel</h3>
          <Button onClick={() => setOpenSettings(true)}>Open Settings</Button>
          {openSettings && (
            <div className="fixed inset-0 flex z-50">
              <div className="flex-1 bg-background/80" onClick={() => setOpenSettings(false)} />
              <SidePanel
                title="Settings"
                subtitle="Customize your preferences"
                onClose={() => setOpenSettings(false)}
                actions={[
                  {
                    icon: <Settings className="w-4 h-4" />,
                    onClick: () => console.log('Advanced settings'),
                    label: 'Advanced',
                  },
                ]}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold mb-2">Notifications</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Email notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Push notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">SMS notifications</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Appearance</p>
                    <select className="w-full p-2 border rounded-md bg-background text-sm">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                  <Button className="w-full mt-4">Save Changes</Button>
                </div>
              </SidePanel>
            </div>
          )}
        </div>
      </div>
    )
  },
}

export const AccessibilityExample: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    if (!open) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Button onClick={() => setOpen(true)}>Open Accessible Panel</Button>
        </div>
      )
    }

    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8 bg-background">
          <h2 className="text-2xl font-bold mb-4">Accessibility Features</h2>
          <p className="text-muted-foreground mb-4">
            The SidePanel includes proper ARIA labels and keyboard navigation support.
          </p>
          <div className="space-y-2 text-sm">
            <p>
              • <strong>Close button:</strong> Has aria-label="Close" for screen readers
            </p>
            <p>
              • <strong>Action buttons:</strong> Each has descriptive aria-label
            </p>
            <p>
              • <strong>Keyboard navigation:</strong> All interactive elements are focusable
            </p>
            <p>
              • <strong>Escape key:</strong> Should close the panel (implement in parent component)
            </p>
          </div>
        </div>
        <SidePanel
          title="Accessible Panel"
          subtitle="With proper ARIA attributes"
          onClose={() => setOpen(false)}
          actions={[
            {
              icon: <Copy className="w-4 h-4" />,
              onClick: () => console.log('Copy'),
              label: 'Copy content',
            },
            {
              icon: <FileText className="w-4 h-4" />,
              onClick: () => console.log('Export'),
              label: 'Export as document',
            },
          ]}
        >
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-xs font-semibold mb-2">Keyboard Navigation:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Tab - Navigate between focusable elements</li>
                <li>• Enter/Space - Activate buttons</li>
                <li>• Escape - Close panel (implement in parent)</li>
              </ul>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-xs font-semibold mb-2">Screen Reader Support:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Action buttons have descriptive labels</li>
                <li>• Close button clearly identified</li>
                <li>• Content is semantically structured</li>
              </ul>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-xs font-semibold mb-2">Best Practices:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Provide clear, descriptive labels for all actions</li>
                <li>• Implement focus trap within panel</li>
                <li>• Handle Escape key to close panel</li>
                <li>• Return focus to trigger element on close</li>
                <li>• Use overlay to prevent interaction with main content</li>
              </ul>
            </div>
          </div>
        </SidePanel>
      </div>
    )
  },
}

// Interaction Tests
export const CloseButtonClick: Story = {
  render: () => {
    const handleClose = fn()
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8 bg-background">
          <h2>Main Content</h2>
        </div>
        <SidePanel title="Test Panel" onClose={handleClose}>
          <div className="p-4">Content</div>
        </SidePanel>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const closeButton = canvas.getByRole('button', { name: 'Close' })
    await userEvent.click(closeButton)
  },
}

export const ActionButtonsClick: Story = {
  render: () => {
    const handleDownload = fn()
    const handleShare = fn()
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8 bg-background">
          <h2>Main Content</h2>
        </div>
        <SidePanel
          title="Document"
          onClose={fn()}
          actions={[
            { icon: <Download className="w-4 h-4" />, onClick: handleDownload, label: 'Download' },
            { icon: <Share className="w-4 h-4" />, onClick: handleShare, label: 'Share' },
          ]}
        >
          <div className="p-4">Content</div>
        </SidePanel>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const downloadButton = canvas.getByRole('button', { name: 'Download' })
    await userEvent.click(downloadButton)
  },
}
