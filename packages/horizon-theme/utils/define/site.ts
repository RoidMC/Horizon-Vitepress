import type { UserConfig } from 'vitepress'
import type { HorizonThemeData } from './theme'
import type { I18nPluginConfig } from '../../plugins/site'
import type { AutoSidebarConfig } from '../../plugins/site'

export type HorizonThemeConfig = UserConfig<HorizonThemeData>

export interface DefineHorizonConfigOptions extends HorizonThemeConfig {
    /**
     * Horizon Pulse Core I18n
     */
    i18n?: I18nPluginConfig
    /**
     * Horizon Pulse Core Sidebar
     */
    sidebar?: AutoSidebarConfig
}
