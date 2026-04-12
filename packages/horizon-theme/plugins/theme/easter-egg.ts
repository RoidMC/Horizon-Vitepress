/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

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
        `%c${mergedConfig.message} %c ${mergedConfig.link} `,
        'background: #ff8344; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px;',
        'background: #444444; color: #ff8344; padding: 4px 8px; border-radius: 0 4px 4px 0;'
      )
      console.log(
        '%cPowered By Horizon %c|%c © RoidMC Studios ',
        'background: #ff8344; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px;',
        'background: #676767ff; color: #fff; padding: 4px;',
        'background: #444444; color: #fff; padding: 4px 8px; border-radius: 0 4px 4px 0;'
      )
    }
  }
}

export const easterEgg = definePlugin({
  key: 'easterEgg',
  factory,
  defaultConfig
})
