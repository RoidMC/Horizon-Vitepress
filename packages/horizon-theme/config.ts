import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { UserConfig } from 'vitepress'
import type { HorizonThemeData } from './utils/define'
import type { ConfigPlugin } from './plugins/types'
import { createConfigPluginManager } from './plugins/config-manager'

export type { HorizonFooter, HorizonFeatures, HorizonThemeData } from './utils/define'
export type { ConfigPlugin as SitePlugin, ConfigPluginFactory as SitePluginFactory } from './plugins/types'

export type HorizonThemeConfig = UserConfig<HorizonThemeData>

export interface DefineHorizonConfigOptions extends HorizonThemeConfig {
  plugins?: ConfigPlugin[]
}

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

export function defineHorizonConfig(options?: DefineHorizonConfigOptions): HorizonThemeConfig {
  const { plugins = [], ...userConfig } = options || {}
  
  const manager = createConfigPluginManager()
  plugins.forEach(plugin => {
    manager.register(() => plugin)
  })
  const pluginResult = manager.resolve()
  
  const userVite = userConfig.vite || {}
  const userResolve = userVite.resolve || {}
  const userAliases = userResolve.alias || []

  return {
    ...userConfig,
    vite: {
      ...userVite,
      resolve: {
        ...userResolve,
        alias: [
          ...generateAliases(),
          ...(Array.isArray(userAliases) ? userAliases : [userAliases])
        ]
      },
      plugins: [
        // 绕过类型检查，因为VitePress用的还是Vite7，不加会类型报错
        ...pluginResult.vitePlugins as any[],
        ...(Array.isArray(userVite.plugins) ? userVite.plugins : (userVite.plugins ? [userVite.plugins] : []))
      ]
    },
    markdown: {
      ...userConfig.markdown,
      ...pluginResult.markdownOptions
    },
    transformPageData: pluginResult.transformPageData,
    buildEnd: pluginResult.buildEnd
  }
}

export const horizonViteConfig: HorizonThemeConfig = defineHorizonConfig()
