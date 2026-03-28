import type { SitePluginRegistryItem } from '../types'
import { i18nPlugin } from './i18n/plugin'
import { sidebarPlugin } from './sidebar/plugin'

export const sitePluginRegistry: SitePluginRegistryItem[] = [
  i18nPlugin,
  sidebarPlugin
]
