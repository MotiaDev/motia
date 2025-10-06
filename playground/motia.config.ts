import { config, MotiaPluginBuilder } from '@motiadev/core'

function pluginExample(): MotiaPluginBuilder {
  return () => {
    return {
      workbench: [
        {
          packageName: 'antd',
          componentName: 'Button',
          labelIcon: 'link',
          label: 'Plugin example',
          props: {
            children: 'Button from antd',
            type: 'primary',
            size: 'large',
          },
        },
      ],
    }
  }
}

export default config({
  plugins: [pluginExample()],
})
