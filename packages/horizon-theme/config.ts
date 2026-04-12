/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { ConfigPlugin } from './plugins/types'
import type { DefineHorizonConfigOptions, HorizonThemeConfig } from './utils/define/site'
import { createConfigPluginManager } from './plugins/config-manager'
import { sitePluginRegistry } from './plugins/site/registry'

export type { HorizonFooter, HorizonFeatures, HorizonThemeData } from './utils/define/theme'
export type { ConfigPlugin as SitePlugin, ConfigPluginFactory as SitePluginFactory } from './plugins/types'
export type { DefineHorizonConfigOptions, HorizonThemeConfig } from './utils/define/site'
export type { AutoSidebarConfig } from './plugins/site/sidebar/types'
export type { I18nAdapter } from './plugins/site/i18n/types'

const pkgDir = dirname(fileURLToPath(import.meta.url))
const devComponentsDir = resolve(pkgDir, 'horizon-ui/components')
const distComponentsDir = resolve(pkgDir, 'components')
const isDev = existsSync(devComponentsDir)
const componentsDir = isDev ? devComponentsDir : distComponentsDir

const componentMappings = {
  'Button': 'HorizonButton',
  'Footer': 'HorizonFooter',
  'Badge': 'HorizonBadge',
}

function generateAliases() {
  const ext = isDev ? '.vue' : '.js'
  return Object.entries(componentMappings).map(([vpName, horizonName]) => ({
    find: new RegExp(`^.*\\/VP${vpName}\\.vue$`),
    replacement: resolve(componentsDir, horizonName + ext)
  }))
}

/**
 * Define Horizon theme configuration
 * @param options - Horizon theme configuration options
 * @returns VitePress user configuration
 * @example
 * ```ts
 * import { defineHorizonConfig } from '@roidmc/horizon-theme/config'
 * 
 * export default defineHorizonConfig({
 *   title: 'My Docs',
 *   i18n: {
 *     translateDir: './i18n/translate',
 *     defaultLocale: 'en-US'
 *   }
 * })
 * ```
 */
export function defineHorizonConfig(options?: DefineHorizonConfigOptions): HorizonThemeConfig {
  const pluginKeys = sitePluginRegistry.map(item => item.key)
  const pluginConfigs: Record<string, any> = {}
  const userConfig: Record<string, any> = {}

  for (const [key, value] of Object.entries(options || {})) {
    if (pluginKeys.includes(key)) {
      pluginConfigs[key] = value
    } else {
      userConfig[key] = value
    }
  }

  const manager = createConfigPluginManager()

  for (const { key, factory } of sitePluginRegistry) {
    const config = pluginConfigs[key]
    if (config) {
      manager.register(factory, config)
    }
  }

  // 扩展用户配置
  const extendedConfig = manager.extendUserConfig(userConfig)
  const pluginResult = manager.resolve()

  const userVite = extendedConfig.vite || {}
  const userResolve = userVite.resolve || {}
  const userAliases = userResolve.alias || []
  const userBuild = userVite.build || {}
  const userRollupOptions = userBuild.rollupOptions || {}
  const userOutput = userRollupOptions.output || {}
  const userSsr = userVite.ssr || {}
  const userNoExternal = userSsr.noExternal || []
  const userNoExternalArr = Array.isArray(userNoExternal) ? userNoExternal : [userNoExternal]
  // vitepress 和 horizon 主题不能外部化，否则构建会报错失败，不能让Node环境负责这部分的构建
  const noExternalSet = new Set(['vitepress', '@roidmc/horizon-theme', ...userNoExternalArr])

  const vitePlugins: any[] = [
    ...pluginResult.vitePlugins as any[],
    ...(Array.isArray(userVite.plugins) ? userVite.plugins : (userVite.plugins ? [userVite.plugins] : []))
  ]

  const baseManualChunks = (id: string) => {
    if (id.includes('vitepress/dist/client/theme-default')) {
      return 'theme'
    }
  }

  const userManualChunks = (userOutput as any).manualChunks
  const manualChunks = typeof userManualChunks === 'function'
    ? (id: string) => baseManualChunks(id) ?? userManualChunks(id)
    : baseManualChunks

  const output = {
    ...userOutput,
    manualChunks
  }

  return {
    ...extendedConfig,
    vite: {
      ...userVite,
      ssr: {
        ...userSsr,
        noExternal: Array.from(noExternalSet)
      },
      resolve: {
        ...userResolve,
        alias: [
          ...generateAliases(),
          ...(Array.isArray(userAliases) ? userAliases : [userAliases])
        ]
      },
      build: {
        ...userBuild,
        rollupOptions: {
          ...userRollupOptions,
          output
        }
      },
      plugins: vitePlugins
    },
    markdown: {
      ...extendedConfig.markdown,
      ...pluginResult.markdownOptions
    },
    transformPageData: pluginResult.transformPageData,
    buildEnd: pluginResult.buildEnd
  }
}

export const horizonViteConfig: HorizonThemeConfig = defineHorizonConfig()
