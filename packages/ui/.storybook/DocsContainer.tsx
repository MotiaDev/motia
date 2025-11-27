import { FC, PropsWithChildren } from 'react'
import { DocsContainer as BaseContainer, DocsContainerProps } from '@storybook/addon-docs/blocks'
import { themes } from 'storybook/theming'

export const DocsContainer: FC<PropsWithChildren<DocsContainerProps>> = ({ children, context }) => {
  const globals = (context as any).store.userGlobals?.globals
  const themeMode = globals?.theme || 'dark'
  const sbTheme = themeMode === 'dark' ? themes.dark : themes.light
  return (
    <BaseContainer context={context} theme={sbTheme}>
      {children}
    </BaseContainer>
  )
}
