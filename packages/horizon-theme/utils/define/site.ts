/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

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
