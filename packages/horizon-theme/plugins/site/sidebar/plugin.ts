import type { ConfigPluginFactory, SitePluginRegistryItem } from '../../types'
import { defineSitePlugin } from '../../types'
import type { AutoSidebarConfig } from './types'
import type { PulsePluginOptions } from '../pulse'
import { createSidebarPulsePlugin } from './vite-plugin'

export type { AutoSidebarConfig } from './types'

const sidebarPluginFactory: ConfigPluginFactory<AutoSidebarConfig | boolean> = (config) => {
  let cachedUserConfig: Record<string, any> = {}
  
  return {
    name: 'horizon-sidebar',
    
    extendConfig(userConfig) {
      cachedUserConfig = userConfig
      return
    },
    
    vite() {
      const sidebarConfig = typeof config === 'boolean' ? {} : config
      
      return {
        name: 'horizon-sidebar-placeholder',
        enforce: 'post',
        config() {
          return {}
        }
      }
    },
    
    getPulsePlugin(): PulsePluginOptions {
      const sidebarConfig = typeof config === 'boolean' ? {} : config
      
      return createSidebarPulsePlugin({
        config: {
          ...sidebarConfig,
          hmr: true
        },
        userConfig: cachedUserConfig,
        srcDir: cachedUserConfig.srcDir || cachedUserConfig.root
      })
    }
  }
}

export const sidebarPlugin = defineSitePlugin({
  key: 'sidebar',
  factory: sidebarPluginFactory
})
