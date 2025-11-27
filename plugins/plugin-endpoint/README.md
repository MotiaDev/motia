# @motiadev/plugin-endpoint

This package provides React components for the Motia workbench endpoint functionality.

## TailwindCSS Compilation

This package now includes TailwindCSS compilation to ensure all Tailwind classes used in the components are properly compiled and available.

### Build Process

The build process includes two steps:
1. **CSS Compilation**: Compiles `src/styles.css` using PostCSS and TailwindCSS
2. **TypeScript Compilation**: Compiles TypeScript files to JavaScript

### Usage

To use the compiled styles in consuming packages, import the CSS file:

```css
@import "@motiadev/plugin-endpoint/styles.css";
```

### Development

- `pnpm run build` - Build both CSS and TypeScript
- `pnpm run dev` - Watch mode for both CSS and TypeScript
- `pnpm run build:css` - Build only CSS
- `pnpm run dev:css` - Watch mode for CSS only

### Configuration Files

- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration with TailwindCSS plugin
- `src/styles.css` - Main CSS entry point with Tailwind imports