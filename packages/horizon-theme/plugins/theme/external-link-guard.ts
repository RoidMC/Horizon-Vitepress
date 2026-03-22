import type { EnhanceAppContext } from 'vitepress'
import type { ThemePlugin, ThemePluginFactory } from '../types'
import { createApp, h, ref } from 'vue'
import LinkGuardDialog from '../../horizon-ui/plugins/LinkGuardDialog.vue'

export interface ExternalLinkGuardConfig {
  /**
   *  Enable external link guard
   */
  enable?: boolean
  /**
   *  External link guard whitelist
   */
  whitelist?: (string | RegExp)[]
  /**
   *  External link guard message
   */
  message?: string
  /**
   *  External link guard confirm text
   */
  confirmText?: string
  /**
   *  External link guard cancel text
   */
  cancelText?: string
}

export const defaultExternalLinkGuardConfig: Required<ExternalLinkGuardConfig> = {
  enable: false,
  whitelist: [],
  message: 'You are about to leave this site. Are you sure you want to continue?',
  confirmText: 'Continue',
  cancelText: 'Cancel'
}

const createDialogManager = (config: Required<ExternalLinkGuardConfig>) => {
  const container = document.createElement('div')
  container.id = 'horizon-link-guard-dialog'
  document.body.appendChild(container)

  const dialogRef = ref<InstanceType<typeof LinkGuardDialog> | null>(null)

  const app = createApp({
    render() {
      return h(LinkGuardDialog, {
        ref: dialogRef,
        message: config.message,
        confirmText: config.confirmText,
        cancelText: config.cancelText
      })
    }
  })

  app.mount(container)

  return {
    open: (url: string) => {
      dialogRef.value?.open(url)
    },
    destroy: () => {
      app.unmount()
      container.remove()
    }
  }
}

let dialogManager: ReturnType<typeof createDialogManager> | null = null

const getDialog = (config: Required<ExternalLinkGuardConfig>) => {
  if (!dialogManager) {
    dialogManager = createDialogManager(config)
  }
  return dialogManager
}

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

export const interceptLinks = (config: Required<ExternalLinkGuardConfig>): void => {
  if (typeof window === 'undefined') return

  const { whitelist } = config

  document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]:not([data-link-guard-processed])').forEach(link => {
    const href = link.getAttribute('href')
    if (!href) return

    link.setAttribute('data-link-guard-processed', 'true')

    if (!isExternalLink(href) || isWhitelisted(href, whitelist)) return

    link.addEventListener('click', (e) => {
      e.preventDefault()
      getDialog(config).open(href)
    })
  })
}

export const externalLinkGuardPlugin: ThemePluginFactory<ExternalLinkGuardConfig> = (config) => {
  const mergedConfig = { ...defaultExternalLinkGuardConfig, ...config }

  return {
    name: 'external-link-guard',
    enhanceApp({ }: EnhanceAppContext) {
      if (typeof window === 'undefined') return

      if (!mergedConfig.enable) return

      interceptLinks(mergedConfig)
    },
    onRouteChange() {
      if (mergedConfig.enable) {
        interceptLinks(mergedConfig)
      }
    }
  }
}

export default externalLinkGuardPlugin
