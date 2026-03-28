import type { I18nPluginConfig } from './types'
import type { PulsePluginOptions } from '../pulse'
import { createI18nCore } from './core'
import { createPulsePlugin } from '../pulse'
import { scanDirectory } from '../pulse/utils'

export function createI18nPulsePlugin(options: I18nPluginConfig): PulsePluginOptions {
  const pluginName = 'vite-plugin-horizon-i18n'
  let i18nResults: any = null

  function loadI18nConfig() {
    try {
      const i18nCore = createI18nCore(options)
      i18nResults = i18nCore.process({ userConfig: options.userConfig })
      
      if (options.debug) {
        console.log(`[${pluginName}] i18n config loaded`)
        if (i18nResults.vitepress?.locales) {
          console.log(`[${pluginName}] Locales:`, Object.keys(i18nResults.vitepress.locales).join(', '))
        }
      }
      
      return i18nResults
    } catch (error) {
      console.error(`[${pluginName}] Failed to load i18n config:`, error)
      return null
    }
  }

  loadI18nConfig()

  return {
    name: pluginName,
    priority: 10,
    debug: options.debug || false,
    
    watchFiles: options.translateDir 
      ? () => scanDirectory(options.translateDir!, ['.yml', '.yaml'])
      : [],
    
    async patch(ctx) {
      if (!i18nResults?.vitepress) {
        return null
      }
      
      const { locales, themeConfig } = i18nResults.vitepress
      
      return {
        data: {
          locales,
          themeConfig
        },
        code: `// i18n patch applied`
      }
    },
    
    async onHotUpdate(ctx) {
      const { file } = ctx
      
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        console.log(`\n[${pluginName}] File changed: ${file}`)
        console.log(`[${pluginName}] Reloading i18n configuration...`)
        
        const newResults = loadI18nConfig()
        
        if (newResults?.vitepress) {
          console.log(`[${pluginName}] i18n configuration reloaded successfully`)
          
          const { locales, themeConfig } = newResults.vitepress
          
          return {
            shouldUpdate: true,
            newData: {
              locales,
              themeConfig
            }
          }
        }
      }
      
      return false
    }
  }
}

export function i18nVitePlugin(options: I18nPluginConfig) {
  return createPulsePlugin(createI18nPulsePlugin(options))
}

export function createI18nVitePlugin(config: I18nPluginConfig) {
  return i18nVitePlugin(config)
}
