import type { EnhanceAppContext } from 'vitepress'
import type { ThemePlugin, ThemePluginFactory } from '../types'

export interface LinkIconConfig {
  enable: boolean
  style: 'none' | 'favicon'
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

export const linkIconPlugin: ThemePluginFactory<LinkIconConfig> = (config) => {
  return {
    name: 'link-icon',
    enhanceApp({ router }: EnhanceAppContext) {
      if (typeof window === 'undefined') return

      const { enable, style } = config

      if (enable) {
        document.body.classList.add('horizon-link-icon-enabled')

        if (style === 'favicon') {
          initLinkIcons()
          router.onAfterRouteChange = () => {
            setTimeout(initLinkIcons, 100)
          }
        }
      }
    }
  }
}

export default linkIconPlugin