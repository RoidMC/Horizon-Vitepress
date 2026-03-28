import type { EnhanceAppContext } from 'vitepress'
import type { PluginOption } from 'vite'
import type { MarkdownOptions, PageData, SiteConfig } from 'vitepress'
import type { PulsePluginOptions } from './site/pulse'

export interface ThemePlugin {
  name: string
  enhanceApp?: (ctx: EnhanceAppContext) => void
  onBeforeRouteChange?: (to: string) => void | boolean
  onBeforePageLoad?: (to: string) => void | boolean
  onAfterPageLoad?: (to: string) => void
  onAfterRouteChange?: (to: string) => void
  onDomUpdated?: (to: string, features?: Record<string, any>) => void
}

export type ThemePluginFactory<TConfig = unknown> = (
  config?: TConfig
) => ThemePlugin

export interface ThemePluginRegistryItem<TKey extends string = string, TConfig = any> {
  key: TKey
  factory: ThemePluginFactory<TConfig>
  defaultConfig?: TConfig
}

export function definePlugin<TKey extends string, TConfig, TExtra extends Record<string, unknown> = {}>(
  options: {
    key: TKey
    factory: ThemePluginFactory<TConfig>
    defaultConfig?: TConfig
  } & TExtra
): ThemePluginRegistryItem<TKey, TConfig> & TExtra {
  return options as ThemePluginRegistryItem<TKey, TConfig> & TExtra
}

export interface ConfigPlugin {
  name: string
  extendConfig?: (userConfig: Record<string, any>) => Record<string, any> | void
  vite?: PluginOption | PluginOption[] | (() => PluginOption | PluginOption[])
  markdown?: MarkdownOptions | (() => MarkdownOptions)
  transformPageData?: (data: PageData) => PageData | undefined | void
  buildEnd?: (config: SiteConfig) => void | Promise<void>
  getPulsePlugin?: () => PulsePluginOptions
}

export type ConfigPluginFactory<TConfig = unknown> = (
  config?: TConfig
) => ConfigPlugin

export interface SitePluginRegistryItem<TKey extends string = string, TConfig = any> {
  key: TKey
  factory: ConfigPluginFactory<TConfig>
  defaultConfig?: TConfig
}

export function defineSitePlugin<TKey extends string, TConfig, TExtra extends Record<string, unknown> = {}>(
  options: {
    key: TKey
    factory: ConfigPluginFactory<TConfig>
    defaultConfig?: TConfig
  } & TExtra
): SitePluginRegistryItem<TKey, TConfig> & TExtra {
  return options as SitePluginRegistryItem<TKey, TConfig> & TExtra
}

export type HorizonPlugin = ThemePlugin | ConfigPlugin