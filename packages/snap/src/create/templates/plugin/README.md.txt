# {{PROJECT_NAME}}

A minimal plugin demonstrating the Motia plugin system.

## Overview

This plugin serves as a reference implementation showing how to create custom workbench plugins for Motia. It demonstrates:

- Basic plugin structure and configuration
- Creating custom workbench tabs
- Using Motia's UI component library
- Building with Vite and TypeScript

## Installation

```bash
pnpm install
```

## Development

```bash
# Build the plugin
pnpm run build

# Watch mode for development
pnpm run dev

# Clean build artifacts
pnpm run clean
```

## Usage

To use this plugin in your Motia project, import it in your `motia.config.ts`:

```typescript
import examplePlugin from '{{PROJECT_NAME}}/plugin'

export default {
  plugins: [examplePlugin],
}
```

## Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── components/
│   │   └── example-page.tsx    # Main UI component
│   ├── index.ts                # Package entry point
│   ├── plugin.ts               # Plugin definition
│   └── styles.css              # Tailwind styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Learn More

For detailed documentation on creating plugins, see the [Motia Plugins Guide](https://motia.dev/docs/development-guide/plugins).

