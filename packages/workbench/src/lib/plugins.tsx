import { plugins } from 'virtual:motia-plugins'
import { DynamicIcon, dynamicIconImports, type IconName } from 'lucide-react/dynamic'
import { memo } from 'react'
import { type AppTab, TabLocation, useAppTabsStore } from '../stores/use-app-tabs-store'
import { isValidTabLocation } from './utils'

export const registerPluginTabs = (addTab: (position: TabLocation, tab: AppTab) => void): void => {
  if (!Array.isArray(plugins)) {
    console.warn('[Motia] Invalid plugins configuration: expected array')
    return
  }

  plugins.forEach((plugin, index) => {
    try {
      if (!plugin.label) {
        console.warn(`[Motia] Plugin at index ${index} missing label, skipping`)
        return
      }

      if (!plugin.component) {
        console.warn(`[Motia] Plugin "${plugin.label}" missing component, skipping`)
        return
      }

      const position = plugin.position || 'top'
      if (!isValidTabLocation(position)) {
        console.warn(`[Motia] Plugin "${plugin.label}" has invalid position "${position}", defaulting to "top"`)
      }

      const tabLocation = isValidTabLocation(position) ? position : TabLocation.TOP

      const PluginTabLabel = memo(() => {
        const hasIcon = Object.keys(dynamicIconImports).includes(plugin.labelIcon as IconName)
        const iconName = hasIcon ? (plugin.labelIcon as IconName) : 'toy-brick'

        if (!hasIcon) {
          console.warn(
            `[Motia] Plugin "${plugin.label}" has invalid icon "${plugin.labelIcon}", defaulting to "toy-brick"`,
          )
        }

        return (
          <>
            <DynamicIcon name={iconName} />
            <span>{plugin.label}</span>
          </>
        )
      })
      PluginTabLabel.displayName = `${plugin.label}TabLabel`

      const PluginContent = memo(() => {
        const Component = plugin.component
        const props = plugin.props || {}

        if (!Component) {
          return <div>Error: Plugin component not found</div>
        }

        return <Component {...props} />
      })
      PluginContent.displayName = `${plugin.label}Content`

      addTab(tabLocation, {
        id: plugin.label.toLowerCase(),
        tabLabel: PluginTabLabel,
        content: PluginContent,
      })
    } catch (error) {
      console.error(`[Motia] Error registering plugin "${plugin.label}":`, error)
    }
  })
}

const refreshPluginTabs = (nextPlugins: typeof plugins): void => {
  try {
    const state = useAppTabsStore.getState()
    const { removeTab, addTab } = state

    const idsToRefresh = new Set(nextPlugins.map((p) => (p.label || '').toLowerCase()))

    idsToRefresh.forEach((id) => {
      removeTab(TabLocation.TOP, id)
      removeTab(TabLocation.BOTTOM, id)
    })

    nextPlugins.forEach((plugin, index) => {
      try {
        if (!plugin.label || !plugin.component) return

        const position = plugin.position || 'top'
        const tabLocation = isValidTabLocation(position) ? position : TabLocation.TOP

        const PluginTabLabel = memo(() => {
          const hasIcon = Object.keys(dynamicIconImports).includes(plugin.labelIcon as IconName)
          const iconName: IconName = hasIcon ? (plugin.labelIcon as IconName) : 'toy-brick'
          return (
            <>
              <DynamicIcon name={iconName} />
              <span>{plugin.label}</span>
            </>
          )
        })
        PluginTabLabel.displayName = `${plugin.label}TabLabel_HMR_${index}`

        const PluginContent = memo(() => {
          const Component = plugin.component as React.ElementType
          const props = plugin.props || {}
          if (!Component) return <div>Error: Plugin component not found</div>
          return <Component {...props} />
        })
        PluginContent.displayName = `${plugin.label}Content_HMR_${index}`

        addTab(tabLocation, {
          id: plugin.label.toLowerCase(),
          tabLabel: PluginTabLabel,
          content: PluginContent,
        })
      } catch (error) {
        console.error(`[Motia] Error refreshing plugin "${plugin.label}":`, error)
      }
    })
  } catch (err) {
    console.error('[Motia] Failed to refresh plugin tabs via HMR:', err)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept('virtual:motia-plugins', (mod) => {
    const next = (mod as unknown as { plugins?: typeof plugins })?.plugins || []
    refreshPluginTabs(next)
  })
}
