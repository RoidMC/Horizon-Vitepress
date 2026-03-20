import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const pkgDir = dirname(fileURLToPath(import.meta.url))
const isDev = !pkgDir.includes('dist')
const componentsDir = isDev 
  ? resolve(pkgDir, 'horizon-ui/components')
  : resolve(pkgDir, 'components')

// 静态定义的组件映射
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

export const horizonViteConfig = {
  vite: {
    resolve: {
      alias: generateAliases()
    }
  }
}
