import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A select component for choosing a value from a list of options. Built on Radix UI Select with full keyboard navigation and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The value of the item that should be selected when initially rendered (uncontrolled)',
    },
    value: {
      control: { type: 'text' },
      description: 'The controlled value of the select',
    },
    onValueChange: {
      action: 'value changed',
      description: 'Event handler called when the value changes',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'When true, prevents the user from interacting with select',
    },
    required: {
      control: { type: 'boolean' },
      description: 'When true, indicates that the user must select a value before submitting',
    },
    name: {
      control: { type: 'text' },
      description: 'The name of the select (useful for form submission)',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
        <SelectItem value="pineapple">Pineapple</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]" aria-label="Select food item">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="broccoli">Broccoli</SelectItem>
          <SelectItem value="spinach">Spinach</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const WithDisabledItems: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]" aria-label="Select an option">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2" disabled>
          Option 2 (Disabled)
        </SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
        <SelectItem value="option4" disabled>
          Option 4 (Disabled)
        </SelectItem>
        <SelectItem value="option5">Option 5</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]" aria-label="Disabled select">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('')

    return (
      <div className="space-y-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[200px]" aria-label="Select a framework">
            <SelectValue placeholder="Select a framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="react">React</SelectItem>
            <SelectItem value="vue">Vue</SelectItem>
            <SelectItem value="angular">Angular</SelectItem>
            <SelectItem value="svelte">Svelte</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Selected value: {value || '(none)'}</p>
        <button
          type="button"
          onClick={() => setValue('')}
          className="text-xs px-2 py-1 border rounded hover:bg-secondary"
          disabled={!value}
        >
          Clear Selection
        </button>
      </div>
    )
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Basic Select</h3>
        <Select>
          <SelectTrigger className="w-[200px]" aria-label="Choose an option">
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Grouped Options</h3>
        <Select>
          <SelectTrigger className="w-[220px]" aria-label="Select category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Frontend</SelectLabel>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="angular">Angular</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Backend</SelectLabel>
              <SelectItem value="node">Node.js</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="go">Go</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Disabled Items</h3>
        <Select>
          <SelectTrigger className="w-[200px]" aria-label="Select status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending" disabled>
              Pending (unavailable)
            </SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled Select</h3>
        <Select disabled>
          <SelectTrigger className="w-[200px]" aria-label="Disabled select">
            <SelectValue placeholder="Disabled select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Different Widths</h3>
        <div className="flex flex-col gap-2">
          <Select>
            <SelectTrigger className="w-[150px]" aria-label="Small select">
              <SelectValue placeholder="Small" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Short</SelectItem>
              <SelectItem value="2">Small</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[250px]" aria-label="Medium width select">
              <SelectValue placeholder="Medium width" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Medium option</SelectItem>
              <SelectItem value="2">Another medium</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[400px]" aria-label="Large width select">
              <SelectValue placeholder="Large width select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">This is a longer option text</SelectItem>
              <SelectItem value="2">Another long text option here</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ),
}

export const UseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Country Selector</h3>
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-3">
          <label htmlFor="country" className="text-sm font-medium">
            Select your country
          </label>
          <Select>
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="mx">Mexico</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Europe</SelectLabel>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
                <SelectItem value="es">Spain</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="jp">Japan</SelectItem>
                <SelectItem value="cn">China</SelectItem>
                <SelectItem value="in">India</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Status Filter</h3>
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-3">
          <label htmlFor="status" className="text-sm font-medium">
            Filter by status
          </label>
          <Select defaultValue="all">
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectSeparator />
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Priority Selector</h3>
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-3">
          <label htmlFor="priority" className="text-sm font-medium">
            Task priority
          </label>
          <Select defaultValue="medium">
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">🔴 Critical</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Settings Selection</h3>
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-4">
          <div className="space-y-2">
            <label htmlFor="theme" className="text-sm font-medium">
              Theme
            </label>
            <Select defaultValue="system">
              <SelectTrigger id="theme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              Language
            </label>
            <Select defaultValue="en">
              <SelectTrigger id="language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      category: '',
      priority: '',
      assignee: '',
    })
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <div className="space-y-2">
          <label htmlFor="form-category" className="text-sm font-medium">
            Category
            <span className="text-destructive ml-1">*</span>
          </label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger id="form-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="form-priority" className="text-sm font-medium">
            Priority
            <span className="text-destructive ml-1">*</span>
          </label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger id="form-priority" className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="form-assignee" className="text-sm font-medium">
            Assignee
          </label>
          <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
            <SelectTrigger id="form-assignee" className="w-full">
              <SelectValue placeholder="Assign to someone" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Development Team</SelectLabel>
                <SelectItem value="john">John Doe</SelectItem>
                <SelectItem value="jane">Jane Smith</SelectItem>
                <SelectItem value="bob">Bob Johnson</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Design Team</SelectLabel>
                <SelectItem value="alice">Alice Williams</SelectItem>
                <SelectItem value="carol">Carol Martinez</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {submitted && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            ✓ Form submitted successfully!
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!formData.category || !formData.priority}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setFormData({ category: '', priority: '', assignee: '' })}
            className="px-4 py-2 border rounded-md font-medium hover:bg-secondary"
          >
            Reset
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Form data:</p>
          <pre className="mt-1 p-2 bg-secondary rounded">{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </form>
    )
  },
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Proper Label Association</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use htmlFor on labels to properly associate them with select triggers for screen readers.
        </p>
        <div className="space-y-2 p-4 border rounded-lg">
          <label htmlFor="accessible-select-1" className="text-sm font-medium">
            Choose your preferred language
          </label>
          <Select>
            <SelectTrigger id="accessible-select-1" className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">With Description</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use aria-describedby to provide additional context for screen readers.
        </p>
        <div className="space-y-2 p-4 border rounded-lg">
          <label htmlFor="accessible-select-2" className="text-sm font-medium">
            Account type
            <span className="text-destructive ml-1">*</span>
          </label>
          <Select>
            <SelectTrigger id="accessible-select-2" aria-describedby="account-description" className="w-full">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <p id="account-description" className="text-xs text-muted-foreground">
            Choose the account type that best fits your needs. You can change this later in settings.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Required Field</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use required attribute and visual indicators for required fields.
        </p>
        <div className="space-y-2 p-4 border rounded-lg">
          <label htmlFor="accessible-select-3" className="text-sm font-medium">
            Department
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <Select required>
            <SelectTrigger id="accessible-select-3" className="w-full" aria-required="true">
              <SelectValue placeholder="Select your department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Keyboard Navigation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select supports full keyboard navigation for accessibility.
        </p>
        <div className="space-y-2 p-4 border rounded-lg">
          <Select>
            <SelectTrigger className="w-full" aria-label="Try keyboard navigation">
              <SelectValue placeholder="Try keyboard navigation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Option 1</SelectItem>
              <SelectItem value="2">Option 2</SelectItem>
              <SelectItem value="3">Option 3</SelectItem>
              <SelectItem value="4">Option 4</SelectItem>
              <SelectItem value="5">Option 5</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 bg-secondary rounded-lg text-xs font-mono">
            <p className="font-semibold mb-1">Keyboard shortcuts:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Tab: Focus the select trigger</li>
              <li>• Space/Enter: Open select menu</li>
              <li>• Arrow Up/Down: Navigate options</li>
              <li>• Home/End: Jump to first/last option</li>
              <li>• Type: Jump to option starting with typed letter</li>
              <li>• Enter: Select highlighted option</li>
              <li>• Escape: Close select menu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ),
}

// Interaction Tests
export const SelectOption: Story = {
  args: {
    onValueChange: fn(),
  },
  render: (args) => (
    <Select onValueChange={args.onValueChange}>
      <SelectTrigger className="w-[180px]" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')
    await userEvent.click(trigger)
    // Select content is portaled, use screen to query from document
    const option = await screen.findByRole('option', { name: 'Banana' })
    await userEvent.click(option)
    await expect(args.onValueChange).toHaveBeenCalledWith('banana')
  },
}

export const KeyboardNavigation: Story = {
  args: {
    onValueChange: fn(),
  },
  render: (args) => (
    <Select onValueChange={args.onValueChange}>
      <SelectTrigger className="w-[200px]" aria-label="Use keyboard">
        <SelectValue placeholder="Use keyboard" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="first">First Option</SelectItem>
        <SelectItem value="second">Second Option</SelectItem>
        <SelectItem value="third">Third Option</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    await expect(args.onValueChange).toHaveBeenCalled()
  },
}

export const LongList: Story = {
  render: () => {
    const countries = [
      'Afghanistan',
      'Albania',
      'Algeria',
      'Andorra',
      'Angola',
      'Argentina',
      'Armenia',
      'Australia',
      'Austria',
      'Azerbaijan',
      'Bahamas',
      'Bahrain',
      'Bangladesh',
      'Barbados',
      'Belarus',
      'Belgium',
      'Belize',
      'Benin',
      'Bhutan',
      'Bolivia',
      'Bosnia and Herzegovina',
      'Botswana',
      'Brazil',
      'Brunei',
      'Bulgaria',
      'Burkina Faso',
      'Burundi',
      'Cambodia',
      'Cameroon',
      'Canada',
      'Cape Verde',
      'Central African Republic',
      'Chad',
      'Chile',
      'China',
      'Colombia',
      'Comoros',
      'Congo',
      'Costa Rica',
      'Croatia',
      'Cuba',
      'Cyprus',
      'Czech Republic',
      'Denmark',
      'Djibouti',
      'Dominica',
      'Dominican Republic',
      'East Timor',
      'Ecuador',
      'Egypt',
      'El Salvador',
      'Equatorial Guinea',
      'Eritrea',
      'Estonia',
      'Ethiopia',
      'Fiji',
      'Finland',
      'France',
      'Gabon',
      'Gambia',
      'Georgia',
      'Germany',
      'Ghana',
      'Greece',
      'Grenada',
      'Guatemala',
      'Guinea',
      'Guinea-Bissau',
      'Guyana',
      'Haiti',
      'Honduras',
      'Hungary',
      'Iceland',
      'India',
      'Indonesia',
      'Iran',
      'Iraq',
      'Ireland',
      'Israel',
      'Italy',
      'Jamaica',
      'Japan',
      'Jordan',
      'Kazakhstan',
      'Kenya',
      'Kiribati',
      'North Korea',
      'South Korea',
      'Kuwait',
      'Kyrgyzstan',
      'Laos',
      'Latvia',
      'Lebanon',
      'Lesotho',
      'Liberia',
      'Libya',
      'Liechtenstein',
      'Lithuania',
      'Luxembourg',
      'Madagascar',
      'Malawi',
      'Malaysia',
      'Maldives',
      'Mali',
      'Malta',
      'Marshall Islands',
      'Mauritania',
      'Mauritius',
      'Mexico',
      'Micronesia',
      'Moldova',
      'Monaco',
      'Mongolia',
      'Montenegro',
      'Morocco',
      'Mozambique',
      'Myanmar',
      'Namibia',
      'Nauru',
      'Nepal',
      'Netherlands',
      'New Zealand',
      'Nicaragua',
      'Niger',
      'Nigeria',
      'Norway',
      'Oman',
      'Pakistan',
      'Palau',
      'Panama',
      'Papua New Guinea',
      'Paraguay',
      'Peru',
      'Philippines',
      'Poland',
      'Portugal',
      'Qatar',
      'Romania',
      'Russia',
      'Rwanda',
      'Saint Kitts and Nevis',
      'Saint Lucia',
      'Saint Vincent and the Grenadines',
      'Samoa',
      'San Marino',
      'Sao Tome and Principe',
      'Saudi Arabia',
      'Senegal',
      'Serbia',
      'Seychelles',
      'Sierra Leone',
      'Singapore',
      'Slovakia',
      'Slovenia',
      'Solomon Islands',
      'Somalia',
      'South Africa',
      'Spain',
      'Sri Lanka',
      'Sudan',
      'Suriname',
      'Swaziland',
      'Sweden',
      'Switzerland',
      'Syria',
      'Taiwan',
      'Tajikistan',
      'Tanzania',
      'Thailand',
      'Togo',
      'Tonga',
      'Trinidad and Tobago',
      'Tunisia',
      'Turkey',
      'Turkmenistan',
      'Tuvalu',
      'Uganda',
      'Ukraine',
      'United Arab Emirates',
      'United Kingdom',
      'United States',
      'Uruguay',
      'Uzbekistan',
      'Vanuatu',
      'Vatican City',
      'Venezuela',
      'Vietnam',
      'Yemen',
      'Zambia',
      'Zimbabwe',
    ]

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Long List Example</h3>
        <p className="text-sm text-muted-foreground">
          Select handles long lists efficiently with scrolling and type-ahead search.
        </p>
        <Select>
          <SelectTrigger className="w-[280px]" aria-label="Select a country">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country.toLowerCase().replace(/\s+/g, '-')}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Tip: Type a letter to quickly jump to countries starting with that letter
        </p>
      </div>
    )
  },
}
