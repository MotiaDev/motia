import type { Preview } from '@storybook/react'
import '../src/styles/globals.css'
import { withThemeByClassName } from '@storybook/addon-themes'
import { DocsContainer } from './DocsContainer'

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'dark',
    }),
  ],
  parameters: {
    a11y: {
      test: 'error',
    },
    actions: { argTypesRegex: '^on.*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
      container: DocsContainer,
    },
  },
  tags: ['autodocs'],
}

export default preview
