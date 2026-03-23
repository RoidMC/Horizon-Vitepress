import type { EnhanceAppContext } from 'vitepress'
import type { PluginOption } from 'vite'
import type { MarkdownOptions, PageData, SiteConfig } from 'vitepress'

export interface ThemePlugin {
  name: string
  enhanceApp?: (ctx: EnhanceAppContext) => void
  onBeforeRouteChange?: (to: string) => void | boolean
  onBeforePageLoad?: (to: string) => void | boolean
  onAfterPageLoad?: (to: string) => void
  onAfterRouteChange?: (to: string) => void
  onDomUpdated?: (to: string) => void
}

export type ThemePluginFactory<TConfig = unknown> = (
  config?: TConfig
) => ThemePlugin

export interface ConfigPlugin {
  name: string
  vite?: PluginOption | PluginOption[] | (() => PluginOption | PluginOption[])
  markdown?: MarkdownOptions | (() => MarkdownOptions)
  transformPageData?: (data: PageData) => PageData | undefined | void
  buildEnd?: (config: SiteConfig) => void | Promise<void>
}

export type ConfigPluginFactory<TConfig = unknown> = (
  config?: TConfig
) => ConfigPlugin

export type HorizonPlugin = ThemePlugin | ConfigPlugin