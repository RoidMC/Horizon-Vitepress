import type { PluginOption } from 'vite'
import type { MarkdownOptions, PageData, SiteConfig } from 'vitepress'
import type { ConfigPlugin, ConfigPluginFactory } from './types'
import type { PulsePluginOptions } from '@roidmc/horizon-pulse-core'
import { createMultiPulsePlugin, createPulsePlugin } from '@roidmc/horizon-pulse-core'

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

  extendUserConfig(userConfig: Record<string, any>): Record<string, any> {
    let extended = { ...userConfig }
    
    for (const plugin of this.plugins) {
      if (!plugin.extendConfig) continue
      
      const result = plugin.extendConfig(extended)
      if (result) {
        extended = { ...extended, ...result }
      }
    }
    
    return extended
  }

  getPulsePlugins(): PulsePluginOptions[] {
    const pulsePlugins: PulsePluginOptions[] = []

    for (const plugin of this.plugins) {
      if (plugin.getPulsePlugin) {
        const pulsePlugin = plugin.getPulsePlugin()
        if (pulsePlugin) {
          pulsePlugins.push(pulsePlugin)
        }
      }
    }

    return pulsePlugins
  }

  getVitePlugins(): PluginOption[] {
    const plugins: PluginOption[] = []

    const pulsePlugins = this.getPulsePlugins()
    if (pulsePlugins.length > 0) {
      if (pulsePlugins.length === 1) {
        plugins.push(createPulsePlugin(pulsePlugins[0]))
      } else {
        plugins.push(createMultiPulsePlugin(pulsePlugins))
      }
    }

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
