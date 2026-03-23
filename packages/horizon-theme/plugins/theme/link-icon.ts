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
}

const defaultConfig: Required<LinkIconConfig> = {
  enable: true,
  style: 'favicon'
}

const initLinkIcons = (): void => {
  if (typeof window === 'undefined') return

  const links = document.querySelectorAll<HTMLAnchorElement>(
    '.vp-doc a:not([href^="https://img.shields.io/"]):not(.not):not([data-link-icon-processed])'
  )

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
        link.style.setProperty('--horizon-plugin-theme-link-icon-favicon', `url(https://favicon.im/${hostname})`)
        link.classList.add('external-link')
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
    enhanceApp({}: EnhanceAppContext) {
      if (!inBrowser) return
      if (mergedConfig.enable) {
        document.body.classList.add('horizon-link-icon-enabled')
      }
    },
    onDomUpdated() {
      if (mergedConfig.enable && mergedConfig.style === 'favicon') {
        initLinkIcons()
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
