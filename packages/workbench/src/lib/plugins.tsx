import { addAppTab, TabLocation } from '@/stores/use-app-tabs-store'
import { DynamicIcon, dynamicIconImports, IconName } from 'lucide-react/dynamic'
import { memo } from 'react'
import { plugins } from 'virtual:motia-plugins'
import { isValidTabLocation } from './utils'

export const registerPluginTabs = (): void => {
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

      addAppTab(tabLocation, {
        id: plugin.label,
        tabLabel: PluginTabLabel,
        content: PluginContent,
      })
    } catch (error) {
      console.error(`[Motia] Error registering plugin "${plugin.label}":`, error)
    }
  })
}
