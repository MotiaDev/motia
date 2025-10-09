# @motiadev/plugin-logs

This package provides React components for the Motia workbench logs functionality.

## TailwindCSS Compilation

This package includes TailwindCSS compilation to ensure all Tailwind classes used in the components are properly compiled and available.

### Build Process

The build process includes two steps:

1. **CSS Compilation**: Compiles `src/styles.css` using PostCSS and TailwindCSS
2. **TypeScript Compilation**: Compiles TypeScript files to JavaScript

### Development

- `pnpm run build` - Build both CSS and TypeScript
- `pnpm run dev` - Watch mode for both CSS and TypeScript
- `pnpm run build:css` - Build only CSS
- `pnpm run dev:css` - Watch mode for CSS only

### Configuration Files

- `src/styles.css` - Main CSS entry point with Tailwind imports

## Features

- **LogsPage**: Main logs page component with search and filtering
- **LogDetail**: Sidebar component for viewing detailed log information
- **LogLevelBadge**: Badge component for log levels
- **useLogsStore**: Zustand store for managing logs state
