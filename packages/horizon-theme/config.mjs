import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

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
 * @typedef {import('vitepress').UserConfig} UserConfig
 */

/**
 * 合并用户配置与 Horizon 主题默认配置
 * @param {UserConfig} userConfig 
 * @returns {UserConfig}
 */
export function defineHorizonConfig(userConfig = {}) {
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
        ...(Array.isArray(userVite.plugins) ? userVite.plugins : (userVite.plugins ? [userVite.plugins] : []))
      ]
    }
  }
}

export const horizonViteConfig = defineHorizonConfig()
