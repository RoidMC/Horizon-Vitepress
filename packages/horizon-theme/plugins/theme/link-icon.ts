/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

import type { EnhanceAppContext } from 'vitepress'
import type { ThemePluginFactory } from '../types'
import { definePlugin } from '../types'
import { inBrowser } from 'vitepress'

export interface LinkIconConfig {
  /**
   * Enable link icon
   */
  enable?: boolean
  /**
   * Link icon style
   */
  style?: 'none' | 'favicon'
  /**
   * Exclude domains (e.g., ['github.com', '*.example.com'])
   */
  excludeDomains?: string[]
  /**
   * Exclude CSS selectors (e.g., ['.no-icon', '.badge a'])
   */
  excludeSelectors?: string[]
}

const defaultConfig: Required<LinkIconConfig> = {
  enable: true,
  style: 'favicon',
  excludeDomains: [],
  excludeSelectors: ['.no-icon']
}

const matchesDomainPattern = (hostname: string, pattern: string): boolean => {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2)
    return hostname === suffix || hostname.endsWith('.' + suffix)
  }
  return hostname === pattern
}

const initLinkIcons = (config: Required<LinkIconConfig>): void => {
  if (typeof window === 'undefined') return

  let selector = '.vp-doc a:not([data-link-icon-processed])'

  if (config.excludeSelectors.length > 0) {
    const excludeSelector = config.excludeSelectors.map(s => `:not(${s})`).join('')
    selector = `.vp-doc a${excludeSelector}:not([data-link-icon-processed])`
  }

  const links = document.querySelectorAll<HTMLAnchorElement>(selector)

  links.forEach((link) => {
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#') || href.startsWith('/')) {
      link.setAttribute('data-link-icon-processed', 'true')
      return
    }

    try {
      const url = new URL(href, window.location.origin)
      const { hostname } = url

      if (hostname && hostname !== window.location.hostname) {
        const isExcluded = config.excludeDomains.some(pattern =>
          matchesDomainPattern(hostname, pattern)
        )

        if (!isExcluded) {
          link.style.setProperty('--horizon-plugin-theme-link-icon-favicon', `url(https://favicon.im/${hostname})`)
          link.classList.add('external-link')
        }
      }
    } catch {
      // 忽略无效 URL
    } finally {
      link.setAttribute('data-link-icon-processed', 'true')
    }
  })
}

const factory: ThemePluginFactory<LinkIconConfig> = (config) => {
  const mergedConfig = { ...defaultConfig, ...config }

  return {
    name: 'link-icon',
    enhanceApp({ }: EnhanceAppContext) {
      if (!inBrowser) return
      if (mergedConfig.enable) {
        document.body.classList.add('horizon-link-icon-enabled')
      }
    },
    onDomUpdated() {
      if (mergedConfig.enable && mergedConfig.style === 'favicon') {
        initLinkIcons(mergedConfig)
      }
    }
  }
}

export const linkIcon = definePlugin({
  key: 'linkIcon',
  factory,
  defaultConfig,
  initLinkIcons
})
