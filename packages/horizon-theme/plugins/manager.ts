import type { EnhanceAppContext } from 'vitepress'
import type { ThemePlugin, ThemePluginFactory } from './types'

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
      plugin.enhanceApp?.(ctx)
    })

    const beforeRouteChangeCallbacks = this.plugins
      .map(p => p.onBeforeRouteChange)
      .filter((cb): cb is (to: string) => void | boolean => !!cb)

    const beforePageLoadCallbacks = this.plugins
      .map(p => p.onBeforePageLoad)
      .filter((cb): cb is (to: string) => void | boolean => !!cb)

    const afterPageLoadCallbacks = this.plugins
      .map(p => p.onAfterPageLoad)
      .filter((cb): cb is (to: string) => void => !!cb)

    const afterRouteChangeCallbacks = this.plugins
      .map(p => p.onAfterRouteChange)
      .filter((cb): cb is (to: string) => void => !!cb)

    if (beforeRouteChangeCallbacks.length > 0) {
      this.router.onBeforeRouteChange = (to: string) => {
        for (const cb of beforeRouteChangeCallbacks) {
          const result = cb(to)
          if (result === false) return false
        }
      }
    }

    if (beforePageLoadCallbacks.length > 0) {
      this.router.onBeforePageLoad = (to: string) => {
        for (const cb of beforePageLoadCallbacks) {
          const result = cb(to)
          if (result === false) return false
        }
      }
    }

    if (afterPageLoadCallbacks.length > 0) {
      this.router.onAfterPageLoad = (to: string) => {
        afterPageLoadCallbacks.forEach(cb => cb(to))
      }
    }

    if (afterRouteChangeCallbacks.length > 0) {
      this.router.onAfterRouteChange = (to: string) => {
        afterRouteChangeCallbacks.forEach(cb => cb(to))
      }
    }
  }
}

export function createPluginManager(options: PluginManagerOptions): PluginManager {
  return new PluginManager(options)
}
