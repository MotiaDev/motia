import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './label'
import { Input } from './input'
import { useState } from 'react'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A label component for form elements with proper accessibility support.',
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
      description: 'The ID of the form element this label is associated with',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the label',
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
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }))
    }

    return (
      <form className="space-y-4 w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              value={formData.firstName}
              onChange={handleChange('firstName')}
              placeholder="John" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              value={formData.lastName}
              onChange={handleChange('lastName')}
              placeholder="Doe" 
            />
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
          <Input 
            id="error-state" 
            placeholder="Invalid input..." 
            aria-invalid={true}
            className="border-destructive"
          />
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
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="accessible-input">
          Accessible Input
          <span className="sr-only">(required)</span>
          <span className="text-destructive ml-1" aria-hidden="true">*</span>
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

      <div className="space-y-2">
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
  ),
} 