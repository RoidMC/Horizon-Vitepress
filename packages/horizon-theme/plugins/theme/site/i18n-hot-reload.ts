/// <reference types="vite/client" />
import type { ThemePluginFactory } from '../../types'
import { definePlugin } from '../../types'

const factory: ThemePluginFactory = () => {
  return {
    name: 'i18n-hot-reload',
    enhanceApp() {
      if (typeof window !== 'undefined' && import.meta.hot) {
        import.meta.hot.on('i18n-update', (data: any) => {
          console.log('[Horizon Theme] i18n configuration updated, reloading...')
          
          if (data?.vitepress) {
            const { locales, themeConfig } = data.vitepress
            
            ;(window as any).__HORIZON_I18N_LOCALES__ = locales
            ;(window as any).__HORIZON_I18N_THEME_CONFIG__ = themeConfig
          }
        })
      }
    }
  }
}

export const i18nHotReload = definePlugin({
  key: 'i18nHotReload',
  factory
})
