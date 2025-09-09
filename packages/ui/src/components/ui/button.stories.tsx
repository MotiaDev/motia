import type { Meta, StoryObj } from '@storybook/react'
import { Play, Plus, Settings, X } from 'lucide-react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A button component that triggers an action or event.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'accent', 'light', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
      description: 'The visual style of the button.',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'md', 'lg', 'icon'],
      description: 'The size of the button.',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Renders the button as a child of the component.',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled.',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the button.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default',
    asChild: false,
  },
}

export const Accent: Story = {
  args: {
    variant: 'accent',
    children: 'Accent',
  },
}

export const Light: Story = {
  args: {
    variant: 'light',
    children: 'Light',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
}

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Play className="w-4 h-4" />,
    'aria-label': 'Play',
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Settings className="w-4 h-4" />
        Settings
      </>
    ),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

// Showcase all variants with different sizes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Default</h3>
        <div className="flex gap-2 items-center">
          <Button variant="default" size="lg">
            Large
          </Button>
          <Button variant="default" size="md">
            Medium
          </Button>
          <Button variant="default" size="sm">
            Small
          </Button>
          <Button variant="default" size="icon" aria-label="Default icon">
            <Play />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Accent</h3>
        <div className="flex gap-2 items-center">
          <Button variant="accent" size="lg">
            Large
          </Button>
          <Button variant="accent" size="md">
            Medium
          </Button>
          <Button variant="accent" size="sm">
            Small
          </Button>
          <Button variant="accent" size="icon" aria-label="Accent icon">
            <Plus />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Light</h3>
        <div className="flex gap-2 items-center">
          <Button variant="light" size="lg">
            Large
          </Button>
          <Button variant="light" size="md">
            Medium
          </Button>
          <Button variant="light" size="sm">
            Small
          </Button>
          <Button variant="light" size="icon" aria-label="Light icon">
            <Settings />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Secondary</h3>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" size="lg">
            Large
          </Button>
          <Button variant="secondary" size="md">
            Medium
          </Button>
          <Button variant="secondary" size="sm">
            Small
          </Button>
          <Button variant="secondary" size="icon" aria-label="Secondary icon">
            <Settings />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Destructive</h3>
        <div className="flex gap-2 items-center">
          <Button variant="destructive" size="lg">
            Large
          </Button>
          <Button variant="destructive" size="md">
            Medium
          </Button>
          <Button variant="destructive" size="sm">
            Small
          </Button>
          <Button variant="destructive" size="icon" aria-label="Delete">
            <X />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Outline</h3>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="lg">
            Large
          </Button>
          <Button variant="outline" size="md">
            Medium
          </Button>
          <Button variant="outline" size="sm">
            Small
          </Button>
          <Button variant="outline" size="icon" aria-label="Outline icon">
            <Plus />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Ghost</h3>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="lg">
            Large
          </Button>
          <Button variant="ghost" size="md">
            Medium
          </Button>
          <Button variant="ghost" size="sm">
            Small
          </Button>
          <Button variant="ghost" size="icon" aria-label="Ghost icon">
            <Settings />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Link</h3>
        <div className="flex gap-2 items-center">
          <Button variant="link" size="lg">
            Large Link
          </Button>
          <Button variant="link" size="md">
            Medium Link
          </Button>
          <Button variant="link" size="sm">
            Small Link
          </Button>
        </div>
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold mb-3">Default Variant States</h3>
      <div className="flex gap-2 items-center">
        <Button variant="default">Normal</Button>
        <Button variant="default" className="hover">
          Hover
        </Button>
        <Button variant="default" className="active">
          Active
        </Button>
        <Button variant="default" disabled>
          Disabled
        </Button>
      </div>

      <h3 className="text-sm font-semibold mb-3">Accent Variant States</h3>
      <div className="flex gap-2 items-center">
        <Button variant="accent">Normal</Button>
        <Button variant="accent" className="hover">
          Hover
        </Button>
        <Button variant="accent" className="active">
          Active
        </Button>
        <Button variant="accent" disabled>
          Disabled
        </Button>
      </div>

      <h3 className="text-sm font-semibold mb-3">Light Variant States</h3>
      <div className="flex gap-2 items-center">
        <Button variant="light">Normal</Button>
        <Button variant="light" className="hover">
          Hover
        </Button>
        <Button variant="light" className="active">
          Active
        </Button>
        <Button variant="light" disabled>
          Disabled
        </Button>
      </div>
    </div>
  ),
}
