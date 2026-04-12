/**
 * SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 * SPDX-License-Identifier: MPL-2.0
 */

import type { ConfigPlugin, ConfigPluginFactory } from '../types'

export type { ConfigPlugin, ConfigPluginFactory } from '../types'
export { defineSitePlugin } from '../types'

// 导出 i18n 插件类型
export type { I18nPluginConfig } from './i18n/types'

// 导出 sidebar 插件类型
export type { AutoSidebarConfig } from './sidebar/types'
