import type { ThemePluginRegistryItem } from '../../types'
import { i18nHotReload } from './i18n-hot-reload'

export { i18nHotReload }

export const sitePlugins: ThemePluginRegistryItem[] = [
  i18nHotReload
]
