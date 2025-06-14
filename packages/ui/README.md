# @motiadev/ui

A modern React UI components library built with shadcn/ui, designed for the Motia ecosystem.

## Features

- 🎨 **Modern Design System** - Built with shadcn/ui components
- 🚀 **TypeScript First** - Full TypeScript support with comprehensive types
- 📦 **Tree Shakeable** - Import only what you need
- 🎭 **Storybook Integration** - Interactive component documentation
- 🌗 **Dark Mode Ready** - Built-in support for light and dark themes
- ⚡ **Vite Powered** - Fast builds and development experience
- 🎯 **Accessible** - ARIA compliant components built on Radix UI

## Installation
Since this is a workspace package, you can add it as a dependency using the workspace protocol:

```json
{
  "dependencies": {
    "@motiadev/ui": "workspace:*"
  }
}
```

Or 
```bash
npm install @motiadev/ui
# or
yarn add @motiadev/ui
# or
pnpm add @motiadev/ui
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom
```

## Usage

Import the components and styles you need:

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@motiadev/ui'
import '@motiadev/ui/styles.css'

function App() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Welcome to Motia UI</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

## CSS Variables

The components use CSS variables for theming. Add these to your CSS:

```css
@import '@motiadev/ui/globals.css';
```

Or set up your own theme variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 9% 15%;
  --primary-foreground: 0 0% 98%;
  /* ... other variables */
}
```

## Utilities

### cn Function

A utility function for merging class names with Tailwind CSS classes.

```tsx
import { cn } from '@motiadev/ui'

const className = cn(
  "base-classes",
  condition && "conditional-classes",
  "more-classes"
)
```

## Development

To run Storybook for component development:

```bash
cd packages/ui
npm run storybook
```

To build the library:

```bash
npm run build
```

## Customization

The library is built on top of Tailwind CSS and uses CSS variables for theming. You can customize the appearance by:

1. **Overriding CSS variables** in your global styles
2. **Extending Tailwind configuration** to add custom colors, spacing, etc.
3. **Using className props** to apply custom styles to individual components

## License

MIT 