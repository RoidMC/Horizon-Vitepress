import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { UserConfig } from 'vitepress'
import type { HorizonThemeData } from './utils/define'

export type { HorizonFooter, HorizonFeatures, HorizonThemeData } from './utils/define'
export type { LinkIconConfig } from './plugins/theme/link-icon'

export type HorizonThemeConfig = UserConfig<HorizonThemeData>

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

export function defineHorizonConfig(userConfig?: HorizonThemeConfig): HorizonThemeConfig {
  const userVite = userConfig?.vite || {}
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
        ...(Array.isArray(userVite.plugins) ? userVite.plugins : (userVite.plugins ? [userVite.plugins] : []))
      ]
    }
  }
}

export const horizonViteConfig: HorizonThemeConfig = defineHorizonConfig()
