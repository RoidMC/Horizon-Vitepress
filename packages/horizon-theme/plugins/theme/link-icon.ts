import type { EnhanceAppContext } from 'vitepress'
import type { ThemePlugin, ThemePluginFactory } from '../types'

export interface LinkIconConfig {
  /**
   *  Enable link icon
   */
  enable?: boolean
  /**
   *  Link icon style
   */
  style?: 'none' | 'favicon'
}

export const defaultLinkIconConfig: Required<LinkIconConfig> = {
  enable: true,
  style: 'favicon'
}

export const initLinkIcons = (): void => {
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

export const linkIconPlugin: ThemePluginFactory<LinkIconConfig> = (config) => {
  const mergedConfig = { ...defaultLinkIconConfig, ...config }

  return {
    name: 'link-icon',
    enhanceApp({}: EnhanceAppContext) {
      if (typeof window === 'undefined') return

      if (mergedConfig.enable) {
        document.body.classList.add('horizon-link-icon-enabled')
        
        if (mergedConfig.style === 'favicon') {
          initLinkIcons()
        }
      }
    },
    onAfterRouteChange() {
      if (mergedConfig.enable && mergedConfig.style === 'favicon') {
        initLinkIcons()
      }
    }
  }
}

export default linkIconPlugin