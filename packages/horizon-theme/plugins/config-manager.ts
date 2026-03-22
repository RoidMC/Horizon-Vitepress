import type { PluginOption } from 'vite'
import type { MarkdownOptions, PageData, SiteConfig } from 'vitepress'
import type { ConfigPlugin, ConfigPluginFactory } from './types'

export interface ConfigPluginManagerResult {
  vitePlugins: PluginOption[]
  markdownOptions: MarkdownOptions
  transformPageData: (data: PageData) => PageData | undefined
  buildEnd: (config: SiteConfig) => Promise<void>
}

class ConfigPluginManager {
  private plugins: ConfigPlugin[] = []

  register<TConfig>(factory: ConfigPluginFactory<TConfig>, config?: TConfig): this {
    const plugin = factory(config)
    this.plugins.push(plugin)
    return this
  }

  getVitePlugins(): PluginOption[] {
    const plugins: PluginOption[] = []

    for (const plugin of this.plugins) {
      if (!plugin.vite) continue

      const vite = typeof plugin.vite === 'function' ? plugin.vite() : plugin.vite
      if (Array.isArray(vite)) {
        plugins.push(...vite)
      } else {
        plugins.push(vite)
      }
    }

    return plugins
  }

  getMarkdownOptions(): MarkdownOptions {
    const options: MarkdownOptions = {}

    for (const plugin of this.plugins) {
      if (!plugin.markdown) continue

      const md = typeof plugin.markdown === 'function' ? plugin.markdown() : plugin.markdown
      Object.assign(options, md)
    }

    return options
  }

  getTransformPageData(): (data: PageData) => PageData | undefined {
    const transformers = this.plugins
      .map(plugin => plugin.transformPageData)
      .filter((fn): fn is NonNullable<ConfigPlugin['transformPageData']> => !!fn)

    return (data: PageData) => {
      let result = data
      for (const transformer of transformers) {
        const transformed = transformer(result)
        if (transformed) result = transformed
      }
      return result
    }
  }

  getBuildEnd(): (config: SiteConfig) => Promise<void> {
    const handlers = this.plugins
      .map(plugin => plugin.buildEnd)
      .filter((fn): fn is NonNullable<ConfigPlugin['buildEnd']> => !!fn)

    return async (config: SiteConfig) => {
      for (const handler of handlers) {
        await handler(config)
      }
    }
  }

  resolve(): ConfigPluginManagerResult {
    return {
      vitePlugins: this.getVitePlugins(),
      markdownOptions: this.getMarkdownOptions(),
      transformPageData: this.getTransformPageData(),
      buildEnd: this.getBuildEnd()
    }
  }
}

export function createConfigPluginManager(): ConfigPluginManager {
  return new ConfigPluginManager()
}
