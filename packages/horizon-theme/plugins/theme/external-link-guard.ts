/**
 * SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 * SPDX-License-Identifier: MPL-2.0
 */

import type { EnhanceAppContext } from 'vitepress'
import type { ThemePluginFactory } from '../types'
import { definePlugin } from '../types'
import { inBrowser } from 'vitepress'

export interface ExternalLinkGuardConfig {
  /**
   * Enable external link guard
   */
  enable?: boolean
  /**
   * External link guard whitelist
   */
  whitelist?: (string | RegExp)[]
  /**
   * External link guard message
   */
  message?: string
  /**
   * External link guard confirm text
   */
  confirmText?: string
  /**
   * External link guard cancel text
   */
  cancelText?: string
}

export const defaultConfig: Required<ExternalLinkGuardConfig> = {
  enable: false,
  whitelist: [],
  message: 'You are about to leave this site. Are you sure you want to continue?',
  confirmText: 'Continue',
  cancelText: 'Cancel'
}

let currentConfig: Required<ExternalLinkGuardConfig> = { ...defaultConfig }

const isExternalLink = (href: string): boolean => {
  try {
    const url = new URL(href, window.location.origin)
    return url.hostname !== window.location.hostname
  } catch {
    return false
  }
}

type WhitelistItem = string | RegExp

const matchWhitelist = (href: string, pattern: WhitelistItem): boolean => {
  if (pattern instanceof RegExp) {
    return pattern.test(href)
  }

  try {
    const url = new URL(href, window.location.origin)

    if (pattern.startsWith('*.')) {
      const domain = pattern.slice(2)
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    }

    if (pattern.includes('/')) {
      const [domainPattern, ...pathParts] = pattern.split('/')

      if (url.hostname !== domainPattern && !url.hostname.endsWith(`.${domainPattern}`)) {
        return false
      }

      const urlPathParts = url.pathname.split('/')

      for (let i = 0; i < pathParts.length; i++) {
        const pPart = pathParts[i]
        const uPart = urlPathParts[i]

        if (pPart === '*') continue
        if (pPart !== uPart) return false
      }

      return true
    }

    return url.hostname === pattern || url.hostname.endsWith(`.${pattern}`)
  } catch {
    return false
  }
}

const isWhitelisted = (href: string, whitelist: WhitelistItem[]): boolean => {
  return whitelist.some(pattern => matchWhitelist(href, pattern))
}

const interceptLinks = (): void => {
  if (typeof window === 'undefined') return

  const { whitelist } = currentConfig

  document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]:not([data-link-guard-processed])').forEach(link => {
    const href = link.getAttribute('href')
    if (!href) return

    link.setAttribute('data-link-guard-processed', 'true')

    if (!isExternalLink(href) || isWhitelisted(href, whitelist)) return

    link.addEventListener('click', (e) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('horizon:open-link-guard', { detail: href }))
    })
  })
}

const factory: ThemePluginFactory<ExternalLinkGuardConfig> = (config) => {
  Object.assign(currentConfig, defaultConfig, config)

  return {
    name: 'external-link-guard',
    onDomUpdated(to: string, features?: Record<string, any>) {
      if (!inBrowser) return
      
      const featureConfig = features?.externalLinkGuard
      currentConfig.enable = featureConfig?.enable ?? defaultConfig.enable
      currentConfig.whitelist = featureConfig?.whitelist ?? defaultConfig.whitelist
      
      if (currentConfig.enable) {
        interceptLinks()
      }
    }
  }
}

export const externalLinkGuard = definePlugin({
  key: 'externalLinkGuard',
  factory,
  defaultConfig
})
