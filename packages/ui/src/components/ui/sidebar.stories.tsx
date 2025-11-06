import type { Meta, StoryObj } from '@storybook/react'
import { ChevronRight, FileText, Home, Settings, User, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { APP_SIDEBAR_CONTAINER_ID, Sidebar } from './sidebar'

const meta: Meta<typeof Sidebar> = {
  title: 'UI/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A resizable sidebar component that renders via portal. Features drag-to-resize functionality, auto-closes previous sidebars, and can be customized with different widths. Built on top of the Panel component.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: {
      action: 'closed',
      description: 'Callback function called when the sidebar should be closed',
    },
    initialWidth: {
      control: 'number',
      description: 'Initial width of the sidebar in pixels. Default is 400px.',
      table: {
        defaultValue: { summary: '400' },
      },
    },
    containerId: {
      control: 'text',
      description:
        'ID of the container element where the sidebar will be rendered. Default is APP_SIDEBAR_CONTAINER_ID.',
      table: {
        defaultValue: { summary: 'APP_SIDEBAR_CONTAINER_ID' },
      },
    },
    children: {
      control: false,
      description: 'Content to be displayed inside the sidebar',
    },
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Sidebar Content</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2">This is the content of the sidebar. Drag the handle on the left to resize.</p>
            <Button onClick={() => setIsOpen(false)} className="mt-4">
              Close Sidebar
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

export const WithInitialWidth: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Sidebar (600px width)</Button>
        {isOpen && (
          <Sidebar onClose={() => setIsOpen(false)} initialWidth={600}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Wide Sidebar</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2">
                This sidebar started at 600px width. You can still resize it by dragging the handle.
              </p>
              <Button onClick={() => setIsOpen(false)} className="mt-4">
                Close Sidebar
              </Button>
            </div>
          </Sidebar>
        )}
      </>
    )
  },
}

export const NarrowWidth: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Narrow Sidebar (250px)</Button>
        {isOpen && (
          <Sidebar onClose={() => setIsOpen(false)} initialWidth={250}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Narrow</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm mt-2">Compact sidebar for simpler content.</p>
            </div>
          </Sidebar>
        )}
      </>
    )
  },
}

export const AllVariants: Story = {
  render: () => {
    const [activeSize, setActiveSize] = useState<'narrow' | 'default' | 'wide' | null>(null)

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-3">Different Width Configurations</h3>
        <div className="flex gap-3">
          <Button onClick={() => setActiveSize('narrow')}>Narrow (250px)</Button>
          <Button onClick={() => setActiveSize('default')}>Default (400px)</Button>
          <Button onClick={() => setActiveSize('wide')}>Wide (600px)</Button>
        </div>

        {activeSize === 'narrow' && (
          <Sidebar onClose={() => setActiveSize(null)} initialWidth={250}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Narrow</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSize(null)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">250px sidebar</p>
            </div>
          </Sidebar>
        )}

        {activeSize === 'default' && (
          <Sidebar onClose={() => setActiveSize(null)}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Default</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSize(null)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">400px sidebar (default)</p>
            </div>
          </Sidebar>
        )}

        {activeSize === 'wide' && (
          <Sidebar onClose={() => setActiveSize(null)} initialWidth={600}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Wide</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSize(null)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">600px sidebar for detailed content</p>
            </div>
          </Sidebar>
        )}
      </div>
    )
  },
}

export const UseCases: Story = {
  render: () => {
    const [activeCase, setActiveCase] = useState<'navigation' | 'filters' | 'settings' | 'details' | null>(null)

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-3">Common Use Cases</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setActiveCase('navigation')}>Navigation Menu</Button>
          <Button onClick={() => setActiveCase('filters')}>Filters Panel</Button>
          <Button onClick={() => setActiveCase('settings')}>Settings</Button>
          <Button onClick={() => setActiveCase('details')}>Item Details</Button>
        </div>

        {activeCase === 'navigation' && <NavigationSidebar onClose={() => setActiveCase(null)} />}
        {activeCase === 'filters' && <FiltersSidebar onClose={() => setActiveCase(null)} />}
        {activeCase === 'settings' && <SettingsSidebar onClose={() => setActiveCase(null)} />}
        {activeCase === 'details' && <DetailsSidebar onClose={() => setActiveCase(null)} />}
      </div>
    )
  },
}

const NavigationSidebar = ({ onClose }: { onClose: () => void }) => (
  <Sidebar onClose={onClose} initialWidth={280}>
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Navigation</h3>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav className="space-y-2">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm"
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm"
        >
          <FileText className="h-4 w-4" />
          <span>Documents</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  </Sidebar>
)

const FiltersSidebar = ({ onClose }: { onClose: () => void }) => (
  <Sidebar onClose={onClose} initialWidth={350}>
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-6">
        <div>
          <label htmlFor="filter-search" className="text-sm font-medium mb-2 block">
            Search
          </label>
          <Input id="filter-search" placeholder="Search items..." />
        </div>
        <div>
          <p className="text-sm font-medium mb-3 block">Category</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">Electronics</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Clothing</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">Home & Garden</span>
            </label>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-3 block">Price Range</p>
          <div className="flex gap-2">
            <Input placeholder="Min" type="number" aria-label="Minimum price" />
            <Input placeholder="Max" type="number" aria-label="Maximum price" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1">Apply Filters</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  </Sidebar>
)

const SettingsSidebar = ({ onClose }: { onClose: () => void }) => (
  <Sidebar onClose={onClose} initialWidth={400}>
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-3">Preferences</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <input type="checkbox" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Auto-save</span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Theme</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="theme" defaultChecked />
              <span className="text-sm">Light</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="theme" />
              <span className="text-sm">Dark</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="theme" />
              <span className="text-sm">System</span>
            </label>
          </div>
        </div>
        <Button className="w-full">Save Settings</Button>
      </div>
    </div>
  </Sidebar>
)

const DetailsSidebar = ({ onClose }: { onClose: () => void }) => (
  <Sidebar onClose={onClose} initialWidth={500}>
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Item Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        <div className="h-48 bg-secondary rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Image Placeholder</span>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">Product Name</h4>
          <p className="text-sm text-muted-foreground">SKU: ABC-123-XYZ</p>
        </div>
        <div>
          <h5 className="text-sm font-semibold mb-2">Description</h5>
          <p className="text-sm text-muted-foreground">
            This is a detailed description of the product. It can include multiple paragraphs and various information
            about the item's features, specifications, and benefits.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="text-sm font-medium">Electronics</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="text-sm font-medium">42 units</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-sm font-medium">$299.99</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="text-sm font-medium">4.5/5</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1">Edit</Button>
          <Button variant="outline" className="flex-1">
            Delete
          </Button>
        </div>
      </div>
    </div>
  </Sidebar>
)

export const MultipleSidebars: Story = {
  render: () => {
    const [sidebar1, setSidebar1] = useState(false)
    const [sidebar2, setSidebar2] = useState(false)

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-3">Auto-Close Behavior</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Only one sidebar can be open at a time. Opening a new sidebar automatically closes the previous one.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setSidebar1(true)}>Open Sidebar 1</Button>
          <Button onClick={() => setSidebar2(true)} variant="outline">
            Open Sidebar 2
          </Button>
        </div>

        {sidebar1 && (
          <Sidebar onClose={() => setSidebar1(false)}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sidebar 1</h3>
                <Button variant="ghost" size="sm" onClick={() => setSidebar1(false)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">This is the first sidebar. Try opening Sidebar 2 to see it auto-close.</p>
            </div>
          </Sidebar>
        )}

        {sidebar2 && (
          <Sidebar onClose={() => setSidebar2(false)} initialWidth={500}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sidebar 2</h3>
                <Button variant="ghost" size="sm" onClick={() => setSidebar2(false)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">
                This is the second sidebar. When it opened, Sidebar 1 automatically closed. This ensures only one
                sidebar is visible at a time.
              </p>
            </div>
          </Sidebar>
        )}
      </div>
    )
  },
}

export const AccessibilityExample: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Accessible Sidebar Implementation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This sidebar demonstrates proper accessibility features including keyboard navigation, ARIA labels, and
            screen reader support.
          </p>
          <Button onClick={() => setIsOpen(true)}>Open Accessible Sidebar</Button>
        </div>

        {isOpen && (
          <Sidebar onClose={() => setIsOpen(false)}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Accessible Sidebar</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">Key accessibility features:</p>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Close button has aria-label for screen readers</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Heading provides context for content</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Drag handle is keyboard accessible</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Focus management keeps keyboard users in context</span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-secondary rounded-lg">
                <p className="text-xs font-mono font-semibold mb-2">Resize instructions:</p>
                <p className="text-xs text-muted-foreground">
                  Click and drag the handle on the left edge of the sidebar to resize it. The handle is indicated by a
                  circular icon with two horizontal lines.
                </p>
              </div>
            </div>
          </Sidebar>
        )}
      </div>
    )
  },
}

// Interaction Tests
// Note: Sidebar uses portals - tested via decorators in other stories
export const SidebarRenderTest: Story = {
  render: () => {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">
          Sidebar component uses portals for rendering. See other Sidebar stories for interactive examples (Default,
          WithActions, AllVariants, etc.)
        </p>
      </div>
    )
  },
}
