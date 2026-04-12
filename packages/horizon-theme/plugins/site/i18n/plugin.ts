/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

import type { ConfigPluginFactory, SitePluginRegistryItem } from '../../types'
import { defineSitePlugin } from '../../types'
import type { I18nPluginConfig } from './types'
import type { PulsePluginOptions } from '@roidmc/horizon-pulse-core'
import { loadI18nConfig } from './config-loader'
import { createI18nPulsePlugin } from './vite-plugin'

export type { I18nPluginConfig } from './types'

const i18nPluginFactory: ConfigPluginFactory<I18nPluginConfig | boolean> = (config) => {
  let cachedUserConfig: Record<string, any> = {}
  let cachedI18nResult: ReturnType<typeof loadI18nConfig> = null
  
  return {
    name: 'horizon-i18n',
    
    extendConfig(userConfig) {
      cachedUserConfig = userConfig
      const i18nConfig = typeof config === 'boolean' ? {} : config
      cachedI18nResult = loadI18nConfig(i18nConfig, userConfig)
      
      if (!cachedI18nResult?.mergedConfig) return
      
      return {
        locales: cachedI18nResult.mergedConfig.locales,
        themeConfig: cachedI18nResult.mergedConfig.themeConfig
      }
    },
    
    vite() {
      return {
        name: 'horizon-i18n-placeholder',
        enforce: 'post',
        config() {
          return {}
        }
      }
    },
    
    getPulsePlugin(): PulsePluginOptions {
      const i18nConfig = typeof config === 'boolean' ? {} : config
      
      if (cachedI18nResult) {
        return createI18nPulsePlugin({
          ...cachedI18nResult.config,
          userConfig: cachedUserConfig
        })
      }
      
      return createI18nPulsePlugin({
        translateDir: undefined,
        defaultLocale: 'en-US',
        debug: false,
        ...i18nConfig,
        userConfig: cachedUserConfig
      })
    }
  }
}

export const i18nPlugin = defineSitePlugin({
  key: 'i18n',
  factory: i18nPluginFactory
})
