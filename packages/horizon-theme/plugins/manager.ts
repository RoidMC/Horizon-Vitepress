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

    const routeCallbacks = this.plugins
      .map(p => p.onRouteChange)
      .filter((cb): cb is () => void => !!cb)

    if (routeCallbacks.length > 0) {
      this.router.onAfterRouteChange = () => {
        setTimeout(() => {
          routeCallbacks.forEach(cb => cb())
        }, 100)
      }
    }
  }
}

export function createPluginManager(options: PluginManagerOptions): PluginManager {
  return new PluginManager(options)
}
