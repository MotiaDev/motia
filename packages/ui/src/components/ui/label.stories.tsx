import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A label component for form elements with proper accessibility support. Built on Radix UI Label primitive, ensuring semantic HTML and screen reader compatibility.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the label',
    },
    htmlFor: {
      control: { type: 'text' },
      description: 'The ID of the form element this label is associated with (creates proper label-input relationship)',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the label (text, icons, or other elements)',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default Label',
  },
}

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" placeholder="Enter your email..." />
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="required-field">
        Required Field
        <span className="text-destructive ml-1">*</span>
      </Label>
      <Input id="required-field" placeholder="This field is required..." />
    </div>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="Choose a username..." />
      <p className="text-sm text-muted-foreground">
        Your username must be unique and contain only letters, numbers, and underscores.
      </p>
    </div>
  ),
}

export const ErrorState: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="error-field" className="text-destructive">
        Email Address
      </Label>
      <Input
        id="error-field"
        type="email"
        placeholder="Enter your email..."
        aria-invalid={true}
        className="border-destructive"
      />
      <p className="text-sm text-destructive">Please enter a valid email address.</p>
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

export const DisabledState: Story = {
  render: () => (
    <div className="space-y-2 group" data-disabled="true">
      <Label htmlFor="disabled-field">Disabled Field</Label>
      <Input id="disabled-field" placeholder="This field is disabled..." disabled />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    })

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }

    return (
      <form className="space-y-4 w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange('firstName')} placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange('lastName')} placeholder="Doe" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-form">
            Email Address
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="email-form"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="john.doe@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            value={formData.message}
            onChange={handleChange('message')}
            placeholder="Enter your message..."
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
        >
          Submit
        </button>
      </form>
    )
  },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Default</h3>
        <div className="space-y-2">
          <Label htmlFor="default-state">Default Label</Label>
          <Input id="default-state" placeholder="Enter text..." />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Required</h3>
        <div className="space-y-2">
          <Label htmlFor="required-state">
            Required Label
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input id="required-state" placeholder="Required field..." />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Error State</h3>
        <div className="space-y-2">
          <Label htmlFor="error-state" className="text-destructive">
            Error Label
          </Label>
          <Input id="error-state" placeholder="Invalid input..." aria-invalid={true} className="border-destructive" />
          <p className="text-sm text-destructive">This field has an error.</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled</h3>
        <div className="space-y-2 group" data-disabled="true">
          <Label htmlFor="disabled-state">Disabled Label</Label>
          <Input id="disabled-state" placeholder="Disabled field..." disabled />
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

export const UseCases: Story = {
  render: () => {
    const [newsletter, setNewsletter] = useState(false)
    const [terms, setTerms] = useState(false)
    const [bio, setBio] = useState('')

    return (
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        <div>
          <h3 className="text-sm font-semibold mb-3">Text Input with Hint</h3>
          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" placeholder="Enter your full name" />
            <p className="text-xs text-muted-foreground">This will appear on your profile and certificates.</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Checkbox with Label</h3>
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newsletter-checkbox"
                checked={newsletter}
                onCheckedChange={(checked) => setNewsletter(checked as boolean)}
              />
              <Label htmlFor="newsletter-checkbox" className="cursor-pointer">
                Subscribe to newsletter
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms-checkbox"
                checked={terms}
                onCheckedChange={(checked) => setTerms(checked as boolean)}
              />
              <Label htmlFor="terms-checkbox" className="cursor-pointer">
                I agree to the terms and conditions
                <span className="text-destructive ml-1">*</span>
              </Label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Textarea with Character Count</h3>
          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio-textarea">Bio</Label>
              <span className="text-xs text-muted-foreground">{bio.length}/200</span>
            </div>
            <Textarea
              id="bio-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Tell us about yourself..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Write a short bio that describes your background and interests.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Grid Form Layout</h3>
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="New York" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="NY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" placeholder="10001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="USA" />
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Proper Label Association</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Always use `htmlFor` on Label and `id` on the input to create proper associations for screen readers.
        </p>
        <div className="space-y-2 p-4 border rounded-lg">
          <Label htmlFor="accessible-input">
            Accessible Input
            <span className="sr-only">(required)</span>
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="accessible-input"
            placeholder="This input has proper accessibility..."
            aria-describedby="accessible-input-description"
            required
          />
          <p id="accessible-input-description" className="text-sm text-muted-foreground">
            This field is required and properly described for screen readers.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Screen Reader Only Content</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use `sr-only` class for content that should only be read by screen readers, and `aria-hidden` for decorative
          elements.
        </p>
        <div className="space-y-2 p-4 border rounded-lg">
          <Label htmlFor="password-input">
            Password
            <span className="sr-only">(minimum 8 characters)</span>
          </Label>
          <Input
            id="password-input"
            type="password"
            placeholder="Enter password..."
            aria-describedby="password-requirements"
            minLength={8}
          />
          <p id="password-requirements" className="text-sm text-muted-foreground">
            Password must be at least 8 characters long.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled State Accessibility</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Wrap disabled fields in a group with `data-disabled` to ensure proper styling via peer selectors.
        </p>
        <div className="space-y-2 p-4 border rounded-lg group" data-disabled="true">
          <Label htmlFor="disabled-accessible">Disabled Field</Label>
          <Input id="disabled-accessible" placeholder="This field is disabled" disabled />
          <p className="text-xs text-muted-foreground">
            The label automatically inherits disabled styling through group context.
          </p>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg">
        <p className="text-xs font-mono font-semibold mb-2">Best practices:</p>
        <ul className="text-xs text-muted-foreground space-y-1 font-mono">
          <li>• Always associate labels with inputs using htmlFor/id</li>
          <li>• Use aria-describedby to link additional descriptions</li>
          <li>• Mark required fields with both visual (*) and sr-only text</li>
          <li>• Use aria-hidden="true" for decorative elements</li>
          <li>• Ensure error messages are programmatically associated</li>
        </ul>
      </div>
    </div>
  ),
}

// Interaction Tests
export const LabelClickFocusesInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="test-input">Click this label</Label>
      <Input id="test-input" placeholder="Input gets focused" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const label = canvas.getByText('Click this label')
    const input = canvas.getByPlaceholderText('Input gets focused')
    await userEvent.click(label)
    await expect(input).toHaveFocus()
  },
}
