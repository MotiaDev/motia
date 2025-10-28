import type { Meta, StoryObj } from '@storybook/react'
import { Activity, Bell, Settings, User } from 'lucide-react'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Button } from './button'
import { Input } from './input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A set of layered sections of content—known as tab panels—that are displayed one at a time. Built on Radix UI Tabs with full keyboard navigation and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The value of the tab that should be active when initially rendered (uncontrolled)',
    },
    value: {
      control: { type: 'text' },
      description: 'The controlled value of the tab to activate',
    },
    onValueChange: {
      action: 'value changed',
      description: 'Event handler called when the value changes',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the tabs',
    },
    dir: {
      control: { type: 'select' },
      options: ['ltr', 'rtl'],
      description: 'The reading direction of the tabs',
    },
    activationMode: {
      control: { type: 'select' },
      options: ['automatic', 'manual'],
      description:
        'When automatic, tabs are activated when receiving focus. When manual, tabs are activated when clicked.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="space-y-4 p-4 border rounded-lg mt-2">
          <h4 className="text-sm font-medium">Account Settings</h4>
          <p className="text-sm text-muted-foreground">
            Make changes to your account here. Click save when you're done.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="space-y-4 p-4 border rounded-lg mt-2">
          <h4 className="text-sm font-medium">Password Settings</h4>
          <p className="text-sm text-muted-foreground">
            Change your password here. After saving, you'll be logged out.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="profile">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div className="p-4 border rounded-lg mt-2">
          <h4 className="text-sm font-medium mb-2">Profile Information</h4>
          <p className="text-sm text-muted-foreground">View and edit your profile details here.</p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="p-4 border rounded-lg mt-2">
          <h4 className="text-sm font-medium mb-2">Notification Preferences</h4>
          <p className="text-sm text-muted-foreground">Manage how you receive notifications.</p>
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-4 border rounded-lg mt-2">
          <h4 className="text-sm font-medium mb-2">Account Settings</h4>
          <p className="text-sm text-muted-foreground">Configure your account preferences.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Active Tab</TabsTrigger>
        <TabsTrigger value="tab2" disabled>
          Disabled Tab
        </TabsTrigger>
        <TabsTrigger value="tab3">Another Tab</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4 border rounded-lg mt-2">
          <p className="text-sm">Content for the first tab.</p>
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4 border rounded-lg mt-2">
          <p className="text-sm">This content is not accessible because the tab is disabled.</p>
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4 border rounded-lg mt-2">
          <p className="text-sm">Content for the third tab.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('overview')

    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[500px]">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="p-4 border rounded-lg mt-2">
              <h4 className="text-sm font-medium mb-2">Overview</h4>
              <p className="text-sm text-muted-foreground">General overview of your account.</p>
            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="p-4 border rounded-lg mt-2">
              <h4 className="text-sm font-medium mb-2">Analytics</h4>
              <p className="text-sm text-muted-foreground">View your analytics data here.</p>
            </div>
          </TabsContent>
          <TabsContent value="reports">
            <div className="p-4 border rounded-lg mt-2">
              <h4 className="text-sm font-medium mb-2">Reports</h4>
              <p className="text-sm text-muted-foreground">Access your reports and exports.</p>
            </div>
          </TabsContent>
        </Tabs>
        <div className="p-4 border rounded-lg bg-secondary">
          <p className="text-sm font-medium mb-2">External Controls</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveTab('overview')}>
              Go to Overview
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('analytics')}>
              Go to Analytics
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('reports')}>
              Go to Reports
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Current tab: {activeTab}</p>
        </div>
      </div>
    )
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Basic Tabs (2 tabs)</h3>
        <Tabs defaultValue="tab1" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div className="p-4 border rounded-lg mt-2">Content for Tab 1</div>
          </TabsContent>
          <TabsContent value="tab2">
            <div className="p-4 border rounded-lg mt-2">Content for Tab 2</div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Multiple Tabs (4 tabs)</h3>
        <Tabs defaultValue="home" className="w-[500px]">
          <TabsList>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          <TabsContent value="home">
            <div className="p-4 border rounded-lg mt-2">Home content</div>
          </TabsContent>
          <TabsContent value="profile">
            <div className="p-4 border rounded-lg mt-2">Profile content</div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="p-4 border rounded-lg mt-2">Settings content</div>
          </TabsContent>
          <TabsContent value="help">
            <div className="p-4 border rounded-lg mt-2">Help content</div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Icons</h3>
        <Tabs defaultValue="activity" className="w-[500px]">
          <TabsList>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="user">
              <User className="h-4 w-4" />
              User
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <div className="p-4 border rounded-lg mt-2">Activity content</div>
          </TabsContent>
          <TabsContent value="user">
            <div className="p-4 border rounded-lg mt-2">User content</div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="p-4 border rounded-lg mt-2">Settings content</div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Disabled Tab</h3>
        <Tabs defaultValue="available1" className="w-[500px]">
          <TabsList>
            <TabsTrigger value="available1">Available 1</TabsTrigger>
            <TabsTrigger value="disabled" disabled>
              Disabled
            </TabsTrigger>
            <TabsTrigger value="available2">Available 2</TabsTrigger>
          </TabsList>
          <TabsContent value="available1">
            <div className="p-4 border rounded-lg mt-2">Available content 1</div>
          </TabsContent>
          <TabsContent value="disabled">
            <div className="p-4 border rounded-lg mt-2">Disabled content</div>
          </TabsContent>
          <TabsContent value="available2">
            <div className="p-4 border rounded-lg mt-2">Available content 2</div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Full Width Tabs</h3>
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div className="p-4 border rounded-lg mt-2">Full width content 1</div>
          </TabsContent>
          <TabsContent value="tab2">
            <div className="p-4 border rounded-lg mt-2">Full width content 2</div>
          </TabsContent>
          <TabsContent value="tab3">
            <div className="p-4 border rounded-lg mt-2">Full width content 3</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
}

export const UseCases: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-8 w-full max-w-3xl">
        <div>
          <h3 className="text-sm font-semibold mb-3">Dashboard Navigation</h3>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="p-6 border rounded-lg mt-2 space-y-4">
                <h4 className="text-lg font-semibold">Dashboard Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">2,543</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">$12,456</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">847</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="analytics">
              <div className="p-6 border rounded-lg mt-2">
                <h4 className="text-lg font-semibold mb-4">Analytics Data</h4>
                <p className="text-sm text-muted-foreground">Detailed analytics and metrics would appear here.</p>
              </div>
            </TabsContent>
            <TabsContent value="reports">
              <div className="p-6 border rounded-lg mt-2">
                <h4 className="text-lg font-semibold mb-4">Reports</h4>
                <p className="text-sm text-muted-foreground">Generated reports and exports would appear here.</p>
              </div>
            </TabsContent>
            <TabsContent value="notifications">
              <div className="p-6 border rounded-lg mt-2">
                <h4 className="text-lg font-semibold mb-4">Notifications</h4>
                <p className="text-sm text-muted-foreground">Recent notifications would appear here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <SettingsPanelExample />
        <ProductDetailsExample />
      </div>
    )
  },
}

const SettingsPanelExample = () => (
  <div>
    <h3 className="text-sm font-semibold mb-3">Settings Panel</h3>
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="p-6 border rounded-lg mt-2 space-y-4">
          <h4 className="text-sm font-semibold">General Settings</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-display-name" className="text-sm font-medium">
                Display Name
              </label>
              <Input id="settings-display-name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-email" className="text-sm font-medium">
                Email
              </label>
              <Input id="settings-email" type="email" placeholder="your@email.com" />
            </div>
            <Button>Save Changes</Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="security">
        <div className="p-6 border rounded-lg mt-2 space-y-4">
          <h4 className="text-sm font-semibold">Security Settings</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-current-password" className="text-sm font-medium">
                Current Password
              </label>
              <Input id="settings-current-password" type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-new-password" className="text-sm font-medium">
                New Password
              </label>
              <Input id="settings-new-password" type="password" placeholder="Enter new password" />
            </div>
            <Button>Update Password</Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="p-6 border rounded-lg mt-2 space-y-4">
          <h4 className="text-sm font-semibold">Notification Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">SMS notifications</span>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
)

const ProductDetailsExample = () => (
  <div>
    <h3 className="text-sm font-semibold mb-3">Product Details</h3>
    <Tabs defaultValue="description" className="w-full">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        <div className="p-6 border rounded-lg mt-2">
          <p className="text-sm">
            This is a high-quality product designed for modern workflows. It features advanced capabilities and seamless
            integration with existing systems.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="specifications">
        <div className="p-6 border rounded-lg mt-2 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Dimensions</span>
            <span className="text-muted-foreground">10 x 5 x 2 inches</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Weight</span>
            <span className="text-muted-foreground">1.5 lbs</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Material</span>
            <span className="text-muted-foreground">Aluminum</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="reviews">
        <div className="p-6 border rounded-lg mt-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={`product-star-${i}`} className="text-yellow-400">
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.8/5 (127 reviews)</span>
          </div>
          <p className="text-sm">
            "Excellent product! Highly recommended." - <span className="text-muted-foreground">John D.</span>
          </p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
)

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Accessible Tabs with ARIA</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tabs automatically include proper ARIA roles and attributes. Each tab has role="tab", the tab list has
          role="tablist", and content panels have role="tabpanel".
        </p>
        <Tabs defaultValue="account" className="w-[500px]">
          <TabsList aria-label="Account settings">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <div className="p-4 border rounded-lg mt-2">
              <h4 className="text-sm font-medium mb-2">Account Information</h4>
              <p className="text-sm text-muted-foreground">Manage your account details and profile information.</p>
            </div>
          </TabsContent>
          <TabsContent value="password">
            <div className="p-4 border rounded-lg mt-2">
              <h4 className="text-sm font-medium mb-2">Password & Security</h4>
              <p className="text-sm text-muted-foreground">Update your password and security settings.</p>
            </div>
          </TabsContent>
          <TabsContent value="preferences">
            <div className="p-4 border rounded-lg mt-2">
              <h4 className="text-sm font-medium mb-2">User Preferences</h4>
              <p className="text-sm text-muted-foreground">Customize your experience and notification settings.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Keyboard Navigation</h3>
        <p className="text-sm text-muted-foreground mb-4">Tabs support full keyboard navigation for accessibility.</p>
        <Tabs defaultValue="tab1" className="w-[500px]">
          <TabsList>
            <TabsTrigger value="tab1">First Tab</TabsTrigger>
            <TabsTrigger value="tab2">Second Tab</TabsTrigger>
            <TabsTrigger value="tab3">Third Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div className="p-4 border rounded-lg mt-2">First tab content</div>
          </TabsContent>
          <TabsContent value="tab2">
            <div className="p-4 border rounded-lg mt-2">Second tab content</div>
          </TabsContent>
          <TabsContent value="tab3">
            <div className="p-4 border rounded-lg mt-2">Third tab content</div>
          </TabsContent>
        </Tabs>
        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <p className="text-xs font-mono font-semibold mb-2">Keyboard shortcuts:</p>
          <ul className="text-xs text-muted-foreground space-y-1 font-mono">
            <li>• Tab: Focus the tab list or move focus into the active tab panel</li>
            <li>• Arrow Left: Move focus to the previous tab</li>
            <li>• Arrow Right: Move focus to the next tab</li>
            <li>• Home: Move focus to the first tab</li>
            <li>• End: Move focus to the last tab</li>
            <li>• Space/Enter: Activate the focused tab (in manual activation mode)</li>
          </ul>
        </div>
      </div>

      <FocusManagementExample />
    </div>
  ),
}

const FocusManagementExample = () => (
  <div>
    <h3 className="text-sm font-semibold mb-3">Focus Management</h3>
    <p className="text-sm text-muted-foreground mb-4">
      When a tab is activated, focus is automatically managed to ensure keyboard users can navigate efficiently.
    </p>
    <Tabs defaultValue="personal" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="personal">Personal Info</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <div className="p-4 border rounded-lg mt-2 space-y-3">
          <h4 className="text-sm font-medium">Personal Information</h4>
          <div className="space-y-2">
            <label htmlFor="a11y-personal-name" className="text-sm">
              Name
            </label>
            <Input id="a11y-personal-name" placeholder="Enter your name" />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="contact">
        <div className="p-4 border rounded-lg mt-2 space-y-3">
          <h4 className="text-sm font-medium">Contact Information</h4>
          <div className="space-y-2">
            <label htmlFor="a11y-contact-email" className="text-sm">
              Email
            </label>
            <Input id="a11y-contact-email" type="email" placeholder="your@email.com" />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="billing">
        <div className="p-4 border rounded-lg mt-2">
          <h4 className="text-sm font-medium">Billing Details</h4>
          <p className="text-sm text-muted-foreground mt-2">Manage your billing information and payment methods.</p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
)

export const DynamicTabs: Story = {
  render: () => {
    const [tabs, setTabs] = useState([
      { id: 'tab1', label: 'Tab 1', content: 'Content for Tab 1' },
      { id: 'tab2', label: 'Tab 2', content: 'Content for Tab 2' },
      { id: 'tab3', label: 'Tab 3', content: 'Content for Tab 3' },
    ])
    const [activeTab, setActiveTab] = useState('tab1')

    const addTab = () => {
      const newId = `tab${tabs.length + 1}`
      setTabs([...tabs, { id: newId, label: `Tab ${tabs.length + 1}`, content: `Content for Tab ${tabs.length + 1}` }])
      setActiveTab(newId)
    }

    const removeTab = (id: string) => {
      const filtered = tabs.filter((tab) => tab.id !== id)
      setTabs(filtered)
      if (activeTab === id && filtered.length > 0) {
        setActiveTab(filtered[0].id)
      }
    }

    return (
      <div className="space-y-4 w-full max-w-3xl">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">Dynamic Tabs Example</h3>
          <Button size="sm" onClick={addTab}>
            Add Tab
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            {tabs.map((tab) => (
              <div key={tab.id} className="relative group">
                <TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTab(tab.id)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label={`Remove ${tab.label}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="p-4 border rounded-lg mt-2">
                <p className="text-sm">{tab.content}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-xs text-muted-foreground">Total tabs: {tabs.length}</p>
      </div>
    )
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
}

// Interaction Tests
export const SwitchTabs: Story = {
  args: {
    onValueChange: fn(),
  },
  render: (args) => (
    <Tabs defaultValue="tab1" onValueChange={args.onValueChange} className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const tab2 = canvas.getByRole('tab', { name: 'Tab 2' })
    await userEvent.click(tab2)
    await expect(args.onValueChange).toHaveBeenCalledWith('tab2')
    await waitFor(() => expect(canvas.getByText('Content 2')).toBeVisible())
  },
}

export const KeyboardTabNavigation: Story = {
  args: {
    onValueChange: fn(),
  },
  render: (args) => (
    <Tabs defaultValue="first" onValueChange={args.onValueChange} className="w-[400px]">
      <TabsList>
        <TabsTrigger value="first">First</TabsTrigger>
        <TabsTrigger value="second">Second</TabsTrigger>
        <TabsTrigger value="third">Third</TabsTrigger>
      </TabsList>
      <TabsContent value="first">First content</TabsContent>
      <TabsContent value="second">Second content</TabsContent>
      <TabsContent value="third">Third content</TabsContent>
    </Tabs>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const firstTab = canvas.getByRole('tab', { name: 'First' })
    firstTab.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onValueChange).toHaveBeenCalledWith('second')
    await waitFor(() => expect(canvas.getByText('Second content')).toBeVisible())
  },
}
