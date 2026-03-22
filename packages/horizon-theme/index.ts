import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { Layout } from './horizon-ui'
import './themes/style.scss'
import { createPluginManager, linkIconPlugin, externalLinkGuardPlugin } from './plugins'
import type { HorizonFeatures } from './utils/define'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    const { siteData, router } = ctx
    const features = siteData.value.themeConfig.features as HorizonFeatures | undefined

    createPluginManager({ router })
      .register(linkIconPlugin, features?.linkIcon)
      .register(externalLinkGuardPlugin, features?.externalLinkGuard)
      .enhanceApp(ctx)
  }
} satisfies Theme