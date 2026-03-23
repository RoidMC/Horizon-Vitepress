import type { EnhanceAppContext } from 'vitepress'
import type { ThemePlugin, ThemePluginFactory } from './types'

const safeCall = <T>(
  fn: () => T,
  pluginName: string,
  hookName: string
): T | undefined => {
  try {
    return fn()
  } catch (e) {
    console.error(`[Horizon Plugin] ${pluginName}.${hookName} error:`, e)
    return undefined
  }
}

export interface PluginManagerOptions {
  router: EnhanceAppContext['router']
}

class PluginManager {
  private plugins: ThemePlugin[] = []
  private router: EnhanceAppContext['router']

  constructor(options: PluginManagerOptions) {
    this.router = options.router
  }

  register<TConfig>(factory: ThemePluginFactory<TConfig>, config?: TConfig): this {
    const plugin = factory(config)
    this.plugins.push(plugin)
    return this
  }

  enhanceApp(ctx: EnhanceAppContext): void {
    this.plugins.forEach(plugin => {
      safeCall(() => plugin.enhanceApp?.(ctx), plugin.name, 'enhanceApp')
    })

    const beforeRouteChangeCallbacks = this.plugins
      .filter(p => p.onBeforeRouteChange)
      .map(p => ({ name: p.name, cb: p.onBeforeRouteChange! }))

    const beforePageLoadCallbacks = this.plugins
      .filter(p => p.onBeforePageLoad)
      .map(p => ({ name: p.name, cb: p.onBeforePageLoad! }))

    const afterPageLoadCallbacks = this.plugins
      .filter(p => p.onAfterPageLoad)
      .map(p => ({ name: p.name, cb: p.onAfterPageLoad! }))

    const afterRouteChangeCallbacks = this.plugins
      .filter(p => p.onAfterRouteChange)
      .map(p => ({ name: p.name, cb: p.onAfterRouteChange! }))

    const domUpdatedCallbacks = this.plugins
      .filter(p => p.onDomUpdated)
      .map(p => ({ name: p.name, cb: p.onDomUpdated! }))

    if (beforeRouteChangeCallbacks.length > 0) {
      this.router.onBeforeRouteChange = (to: string) => {
        for (const { name, cb } of beforeRouteChangeCallbacks) {
          const result = safeCall(() => cb(to), name, 'onBeforeRouteChange')
          if (result === false) return false
        }
      }
    }

    if (beforePageLoadCallbacks.length > 0) {
      this.router.onBeforePageLoad = (to: string) => {
        for (const { name, cb } of beforePageLoadCallbacks) {
          const result = safeCall(() => cb(to), name, 'onBeforePageLoad')
          if (result === false) return false
        }
      }
    }

    if (afterPageLoadCallbacks.length > 0) {
      this.router.onAfterPageLoad = (to: string) => {
        afterPageLoadCallbacks.forEach(({ name, cb }) => {
          safeCall(() => cb(to), name, 'onAfterPageLoad')
        })
      }
    }

    if (afterRouteChangeCallbacks.length > 0) {
      this.router.onAfterRouteChange = (to: string) => {
        afterRouteChangeCallbacks.forEach(({ name, cb }) => {
          safeCall(() => cb(to), name, 'onAfterRouteChange')
        })
      }
    }

    if (domUpdatedCallbacks.length > 0) {
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          domUpdatedCallbacks.forEach(({ name, cb }) => {
            safeCall(() => cb(window.location.pathname), name, 'onDomUpdated')
          })
        })
      }

      const existingHandler = this.router.onAfterRouteChange
      this.router.onAfterRouteChange = (to: string) => {
        existingHandler?.(to)
        if (typeof window !== 'undefined') {
          requestAnimationFrame(() => {
            domUpdatedCallbacks.forEach(({ name, cb }) => {
              safeCall(() => cb(to), name, 'onDomUpdated')
            })
          })
        }
      }
    }
  }
}

export function createPluginManager(options: PluginManagerOptions): PluginManager {
  return new PluginManager(options)
}
