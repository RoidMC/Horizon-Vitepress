import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { Layout } from './horizon-ui'
import './themes/style.scss'
import { linkIconPlugin } from './plugins/theme'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    const { siteData } = ctx
    const features = siteData.value.themeConfig.features as {
      linkIcon?: {
        enable?: boolean
        style?: 'none' | 'favicon'
      }
    } | undefined

    const linkIconConfig = {
      enable: features?.linkIcon?.enable !== false,
      style: features?.linkIcon?.style ?? 'favicon'
    }

    linkIconPlugin(linkIconConfig).enhanceApp?.(ctx)
  }
} satisfies Theme