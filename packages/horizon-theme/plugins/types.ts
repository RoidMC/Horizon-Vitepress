import type { EnhanceAppContext } from 'vitepress'

export interface ThemePlugin {
  name: string
  enhanceApp?: (ctx: EnhanceAppContext) => void
}

export type ThemePluginFactory<TConfig = unknown> = (
  config: TConfig
) => ThemePlugin