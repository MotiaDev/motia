import type { Meta, StoryObj } from '@storybook/react'
import { expect } from 'storybook/test'
import { BackgroundEffect } from './background-effect'
import { Button } from './button'

const meta: Meta<typeof BackgroundEffect> = {
  title: 'UI/BackgroundEffect',
  component: BackgroundEffect,
  parameters: {
    layout: 'fullscreen',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A decorative background effect component that adds subtle gradient patterns behind content. Positioned absolutely with negative z-index, aria-hidden, and pointer-events-none for proper accessibility and non-interference with interactive elements.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    patternType: {
      control: 'select',
      options: ['subtle'],
      description: 'The type of pattern to display (currently only "subtle" is available)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'subtle' },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="relative min-h-screen flex items-center justify-center">
      <BackgroundEffect />
      <div className="relative z-10 text-center space-y-4">
        <h1 className="text-4xl font-bold">Default Background Effect</h1>
        <p className="text-muted-foreground max-w-md">
          The subtle gradient pattern appears behind the content without interfering with interactivity.
        </p>
        <Button>Interactive Button</Button>
      </div>
    </div>
  ),
}

export const WithHeroSection: Story = {
  render: () => (
    <div className="relative">
      <BackgroundEffect patternType="subtle" />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">Welcome to Our Platform</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build amazing applications with our comprehensive suite of tools and components.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const WithContentSection: Story = {
  render: () => (
    <div className="relative">
      <BackgroundEffect />
      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 pt-16">
            <h1 className="text-4xl font-bold mb-4">Feature Showcase</h1>
            <p className="text-muted-foreground text-lg">
              Explore the capabilities of our platform with these powerful features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-6 border rounded-lg bg-background/50 backdrop-blur">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Fast Performance</h2>
              <p className="text-muted-foreground">Optimized for speed and efficiency in every interaction.</p>
            </div>

            <div className="p-6 border rounded-lg bg-background/50 backdrop-blur">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Beautiful Design</h2>
              <p className="text-muted-foreground">Thoughtfully crafted interfaces that delight users.</p>
            </div>

            <div className="p-6 border rounded-lg bg-background/50 backdrop-blur">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Secure & Reliable</h2>
              <p className="text-muted-foreground">Enterprise-grade security and 99.9% uptime guaranteed.</p>
            </div>
          </div>

          <div className="text-center p-12 border rounded-lg bg-background/50 backdrop-blur">
            <p className="text-2xl font-bold mb-4">Ready to Get Started?</p>
            <p className="text-muted-foreground mb-6">Join thousands of teams building amazing products</p>
            <Button size="lg">Start Free Trial</Button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'heading-order', enabled: false }],
      },
    },
  },
}

export const UseCases: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="relative h-[400px]">
        <BackgroundEffect />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Landing Page Hero</h3>
            <p className="text-muted-foreground">Creates visual depth for hero sections</p>
          </div>
        </div>
      </div>

      <div className="relative h-[400px]">
        <BackgroundEffect />
        <div className="relative z-10 h-full p-12">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Content Background</h3>
            <p className="text-muted-foreground mb-4">
              Adds subtle visual interest to content-heavy sections without overwhelming the content itself. The
              gradient pattern stays in the background, allowing text and interactive elements to remain prominent.
            </p>
            <Button>Learn More</Button>
          </div>
        </div>
      </div>

      <div className="relative h-[400px]">
        <BackgroundEffect />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 max-w-4xl">
            <div className="p-6 border rounded-lg bg-background/80 backdrop-blur">
              <h4 className="font-semibold mb-2">Card 1</h4>
              <p className="text-sm text-muted-foreground">Content with background effect</p>
            </div>
            <div className="p-6 border rounded-lg bg-background/80 backdrop-blur">
              <h4 className="font-semibold mb-2">Card 2</h4>
              <p className="text-sm text-muted-foreground">Semi-transparent cards work well</p>
            </div>
            <div className="p-6 border rounded-lg bg-background/80 backdrop-blur">
              <h4 className="font-semibold mb-2">Card 3</h4>
              <p className="text-sm text-muted-foreground">Creates visual hierarchy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Accessibility Features</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The BackgroundEffect component is designed to be purely decorative and accessible by default.
        </p>
      </div>

      <div className="relative min-h-[300px] border rounded-lg">
        <BackgroundEffect />
        <div className="relative z-10 p-6">
          <h4 className="font-semibold mb-3">Key Accessibility Properties:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • <strong>aria-hidden="true"</strong> - Hidden from screen readers as purely decorative
            </li>
            <li>
              • <strong>pointer-events-none</strong> - Does not interfere with clicks or interactions
            </li>
            <li>
              • <strong>Negative z-index</strong> - Always stays behind content
            </li>
            <li>
              • <strong>Absolute positioning</strong> - Does not affect layout flow
            </li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg space-y-3">
        <div>
          <p className="text-xs font-semibold mb-2">Performance Considerations:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Uses CSS gradients (GPU-accelerated)</li>
            <li>• No JavaScript animations or calculations</li>
            <li>• Minimal DOM impact (single div element)</li>
            <li>• Transform-gpu class for hardware acceleration</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Best Practices:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use for decorative purposes only</li>
            <li>• Ensure sufficient content contrast on top</li>
            <li>• Test with different color themes</li>
            <li>• Consider using backdrop-blur on content cards</li>
            <li>• Place at root of section or page container</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Usage Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Works well with hero sections and landing pages</li>
            <li>• Combine with semi-transparent cards for depth</li>
            <li>• Ideal for large content areas</li>
            <li>• Currently supports "subtle" pattern type</li>
          </ul>
        </div>
      </div>
    </div>
  ),
}

// Interaction Tests (Accessibility Verification)
export const DecorativeAndNonInteractive: Story = {
  render: () => (
    <div className="relative h-[200px]">
      <BackgroundEffect />
      <div className="relative z-10 p-4">
        <Button>Interactive Content</Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const backgroundDiv = canvasElement.querySelector('[aria-hidden="true"]')
    await expect(backgroundDiv).toBeInTheDocument()
    await expect(backgroundDiv).toHaveClass('pointer-events-none')
  },
}
