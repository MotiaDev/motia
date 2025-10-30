import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A checkbox component for boolean selections and form inputs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: { type: 'select' },
      options: [true, false, 'indeterminate'],
      description: 'The checked state of the checkbox.',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is disabled.',
    },
    'aria-invalid': {
      control: { type: 'boolean' },
      description: 'Whether the checkbox has an error state.',
    },
    onCheckedChange: {
      action: 'checked changed',
      description: 'Event handler for when the checked state changes.',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the checkbox.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    checked: false,
    'aria-label': 'Default checkbox',
  },
}

export const Checked: Story = {
  args: {
    checked: true,
    'aria-label': 'Checked checkbox',
  },
}

export const Unchecked: Story = {
  args: {
    checked: false,
    'aria-label': 'Unchecked checkbox',
  },
}

export const Indeterminate: Story = {
  args: {
    checked: 'indeterminate',
    'aria-label': 'Indeterminate checkbox',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    checked: false,
    'aria-label': 'Disabled checkbox',
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    'aria-label': 'Disabled checked checkbox',
  },
}

export const DisabledIndeterminate: Story = {
  args: {
    disabled: true,
    checked: 'indeterminate',
    'aria-label': 'Disabled indeterminate checkbox',
  },
}

export const Error: Story = {
  args: {
    'aria-invalid': true,
    checked: false,
    'aria-label': 'Checkbox with error',
  },
}

export const ErrorChecked: Story = {
  args: {
    'aria-invalid': true,
    checked: true,
    'aria-label': 'Checked checkbox with error',
  },
}

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox checked={checked} onCheckedChange={() => setChecked(!checked)} aria-label="Accept terms" />
          <label className="text-sm font-medium">Accept terms and conditions</label>
        </div>
        <p className="text-sm text-muted-foreground">Current state: {checked ? 'checked' : 'unchecked'}</p>
      </div>
    )
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </label>
    </div>
  ),
}

export const WithLabelAndDescription: Story = {
  render: () => (
    <div className="flex items-start space-x-2">
      <Checkbox id="marketing" className="mt-1" />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="marketing"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Marketing emails
        </label>
        <p className="text-xs text-muted-foreground">Receive emails about new products, features, and more.</p>
      </div>
    </div>
  ),
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Basic States</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox checked={false} aria-label="Unchecked state" />
            <label className="text-sm">Unchecked</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox checked={true} aria-label="Checked state" />
            <label className="text-sm">Checked</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox checked="indeterminate" aria-label="Indeterminate state" />
            <label className="text-sm">Indeterminate</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled States</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox disabled checked={false} aria-label="Disabled unchecked state" />
            <label className="text-sm opacity-50">Disabled unchecked</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox disabled checked={true} aria-label="Disabled checked state" />
            <label className="text-sm opacity-50">Disabled checked</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox disabled checked="indeterminate" aria-label="Disabled indeterminate state" />
            <label className="text-sm opacity-50">Disabled indeterminate</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Error States</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox aria-invalid checked={false} aria-label="Error unchecked state" />
            <label className="text-sm text-destructive">Error unchecked</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox aria-invalid checked={true} aria-label="Error checked state" />
            <label className="text-sm text-destructive">Error checked</label>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
}

export const FormExample: Story = {
  render: () => {
    const [preferences, setPreferences] = useState({
      marketing: false,
      analytics: true,
      social: false,
    })

    const updatePreference = (key: keyof typeof preferences) => (checked: boolean) => {
      setPreferences((prev) => ({ ...prev, [key]: checked }))
    }

    return (
      <div className="space-y-6 w-full max-w-md">
        <div>
          <h3 className="text-lg font-semibold mb-4">Privacy Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={updatePreference('marketing')}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="marketing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Marketing Communications
                </label>
                <p className="text-xs text-muted-foreground">
                  Receive emails about new products, features, and promotions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={updatePreference('analytics')}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="analytics"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Analytics Cookies
                </label>
                <p className="text-xs text-muted-foreground">
                  Help us improve our service by allowing analytics tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="social"
                checked={preferences.social}
                onCheckedChange={updatePreference('social')}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="social"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Social Media Integration
                </label>
                <p className="text-xs text-muted-foreground">
                  Connect with social media platforms for enhanced features.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium mb-2">Current Selection:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>Marketing: {preferences.marketing ? '✓ Enabled' : '✗ Disabled'}</li>
            <li>Analytics: {preferences.analytics ? '✓ Enabled' : '✗ Disabled'}</li>
            <li>Social: {preferences.social ? '✓ Enabled' : '✗ Disabled'}</li>
          </ul>
        </div>
      </div>
    )
  },
}

export const CheckboxList: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<string[]>(['item2'])

    const items = [
      { id: 'item1', label: 'First item', description: 'This is the first item' },
      { id: 'item2', label: 'Second item', description: 'This is the second item' },
      { id: 'item3', label: 'Third item', description: 'This is the third item' },
      { id: 'item4', label: 'Fourth item', description: 'This is the fourth item' },
    ]

    const toggleItem = (itemId: string) => {
      setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
    }

    const selectAll = () => {
      setSelectedItems(items.map((item) => item.id))
    }

    const selectNone = () => {
      setSelectedItems([])
    }

    const allSelected = selectedItems.length === items.length
    const someSelected = selectedItems.length > 0 && selectedItems.length < items.length

    return (
      <div className="space-y-4 w-full max-w-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => {
                if (checked === true) selectAll()
                else selectNone()
              }}
              aria-label="Select all items"
            />
            <label className="text-sm font-medium">
              Select all ({selectedItems.length}/{items.length})
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground" type="button">
              All
            </button>
            <button onClick={selectNone} className="text-xs text-muted-foreground hover:text-foreground" type="button">
              None
            </button>
          </div>
        </div>

        <div className="border rounded-lg divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-3">
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-1"
                aria-label={item.label}
              />
              <div className="grid gap-1.5 leading-none">
                <label className="text-sm font-medium">{item.label}</label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedItems.length > 0 && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Selected items:</p>
            <p className="text-xs text-muted-foreground">
              {selectedItems.map((id) => items.find((item) => item.id === id)?.label).join(', ')}
            </p>
          </div>
        )}
      </div>
    )
  },
}

export const AccessibilityExample: Story = {
  render: () => (
    <fieldset className="space-y-4 w-full max-w-md">
      <legend className="text-sm font-semibold">Accessibility Features</legend>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="a11y-1" />
          <label htmlFor="a11y-1" className="text-sm">
            Proper label association with htmlFor
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="a11y-2" aria-describedby="a11y-2-desc" />
          <div>
            <label htmlFor="a11y-2" className="text-sm font-medium">
              Checkbox with description
            </label>
            <p id="a11y-2-desc" className="text-xs text-muted-foreground">
              This checkbox has an accessible description
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="a11y-3" aria-invalid aria-describedby="a11y-3-error" />
          <div>
            <label htmlFor="a11y-3" className="text-sm font-medium text-destructive">
              Checkbox with error state
            </label>
            <p id="a11y-3-error" className="text-xs text-destructive">
              This field is required
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="a11y-4" disabled checked={true} />
          <label htmlFor="a11y-4" className="text-sm opacity-50">
            Disabled checkbox (properly indicates state)
          </label>
        </div>
      </div>
    </fieldset>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
}

// Interaction Tests
export const CheckInteraction: Story = {
  args: {
    onCheckedChange: fn(),
    'aria-label': 'Test checkbox',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')
    await userEvent.click(checkbox)
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true)
    await userEvent.click(checkbox)
    await expect(args.onCheckedChange).toHaveBeenCalledWith(false)
  },
}

export const KeyboardCheck: Story = {
  args: {
    onCheckedChange: fn(),
    'aria-label': 'Keyboard test checkbox',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')
    checkbox.focus()
    await userEvent.keyboard(' ')
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true)
  },
}

export const IndeterminateInteraction: Story = {
  args: {
    checked: 'indeterminate' as const,
    onCheckedChange: fn(),
    'aria-label': 'Indeterminate test checkbox',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')
    await expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
    await userEvent.click(checkbox)
    await expect(args.onCheckedChange).toHaveBeenCalled()
  },
}
