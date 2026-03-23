import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { Layout } from './horizon-ui'
import './themes/style.scss'
import { createPluginManager, themePluginRegistry } from './plugins'
import type { HorizonFeatures } from './utils/define'
export type { ThemePluginConfigs } from './plugins/theme'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    const { siteData, router } = ctx
    const features = siteData.value.themeConfig.features as HorizonFeatures | undefined

    const manager = createPluginManager({ router })
    
    for (const { key, factory } of themePluginRegistry) {
      const config = features?.[key as keyof HorizonFeatures]
      manager.register(factory, config)
    }
    
    manager.enhanceApp(ctx)
  }
} satisfies Theme