import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { ConfigPlugin } from './plugins/types'
import type { DefineHorizonConfigOptions, HorizonThemeConfig } from './utils/define/site'
import { createConfigPluginManager } from './plugins/config-manager'
import { sitePluginRegistry } from './plugins/site/registry'

export type { HorizonFooter, HorizonFeatures, HorizonThemeData } from './utils/define/theme'
export type { ConfigPlugin as SitePlugin, ConfigPluginFactory as SitePluginFactory } from './plugins/types'
export type { DefineHorizonConfigOptions, HorizonThemeConfig } from './utils/define/site'

const pkgDir = dirname(fileURLToPath(import.meta.url))
const isDev = !pkgDir.includes('dist')
const componentsDir = isDev
  ? resolve(pkgDir, 'horizon-ui/components')
  : resolve(pkgDir, 'components')

const componentMappings = {
  'Button': 'HorizonButton',
  'Footer': 'HorizonFooter',
  'Badge': 'HorizonBadge',
}

function generateAliases() {
  const ext = isDev ? '.vue' : '.js'
  return Object.entries(componentMappings).map(([vpName, horizonName]) => ({
    find: new RegExp(`.*/VP${vpName}\\.vue$`),
    replacement: resolve(componentsDir, horizonName + ext)
  }))
}

/**
 * Define Horizon theme configuration
 * @param options - Horizon theme configuration options
 * @returns VitePress user configuration
 * @example
 * ```ts
 * import { defineHorizonConfig } from 'horizon-theme/config'
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

  const vitePlugins: any[] = [
    ...pluginResult.vitePlugins as any[],
    ...(Array.isArray(userVite.plugins) ? userVite.plugins : (userVite.plugins ? [userVite.plugins] : []))
  ]

  return {
    ...extendedConfig,
    vite: {
      ...userVite,
      resolve: {
        ...userResolve,
        alias: [
          ...generateAliases(),
          ...(Array.isArray(userAliases) ? userAliases : [userAliases])
        ]
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
