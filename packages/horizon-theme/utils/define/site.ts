import type { UserConfig } from 'vitepress'
import type { HorizonThemeData } from './theme'
import type { I18nPluginConfig } from '../../plugins/site'

export type HorizonThemeConfig = UserConfig<HorizonThemeData>

export interface DefineHorizonConfigOptions extends HorizonThemeConfig {
    /**
     * Horizon GenX I18n
     */
    i18n?: I18nPluginConfig
}
