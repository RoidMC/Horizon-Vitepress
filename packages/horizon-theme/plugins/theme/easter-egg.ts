import type { ThemePluginFactory } from '../types'
import { definePlugin } from '../types'
import { inBrowser } from 'vitepress'

export interface EasterEggConfig {
  /**
   * Enable easter egg
   */
  enable?: boolean
  /**
   * Console message
   */
  message?: string
  /**
   * Console link
   */
  link?: string
}

const defaultConfig: Required<EasterEggConfig> = {
  enable: true,
  message: 'Horizon Theme',
  link: 'https://www.roidmc.com'
}

const factory: ThemePluginFactory<EasterEggConfig> = (config) => {
  const mergedConfig = { ...defaultConfig, ...config }

  return {
    name: 'easter-egg',
    enhanceApp() {
      if (!inBrowser || !mergedConfig.enable) return

      console.log(
        `%c ${mergedConfig.message} %c ${mergedConfig.link} `,
        'background: #ff8345; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px;',
        'background: #282828; color: #ff8345; padding: 4px 8px; border-radius: 0 4px 4px 0;'
      )
    }
  }
}

export const easterEgg = definePlugin({
  key: 'easterEgg',
  factory,
  defaultConfig
})
