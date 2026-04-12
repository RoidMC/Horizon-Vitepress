/**
 * SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 * SPDX-License-Identifier: MPL-2.0
 */

import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { Layout } from './horizon-ui'
import './themes/style.scss'
import { createPluginManager, themePluginRegistry } from './plugins'
import type { HorizonFeatures } from './utils/define/theme'
export type { ThemePluginConfigs } from './plugins/theme'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    const { siteData, router } = ctx
    const manager = createPluginManager({
      router,
      getFeatures: () => siteData.value.themeConfig.features as HorizonFeatures | undefined
    })

    const features = siteData.value.themeConfig.features as HorizonFeatures | undefined

    for (const { key, factory } of themePluginRegistry) {
      const config = features?.[key as keyof HorizonFeatures]
      manager.register(factory, config)
    }

    manager.enhanceApp(ctx)
  }
} satisfies Theme