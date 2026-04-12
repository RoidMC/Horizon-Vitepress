/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

// 导出类型和工具
export type { I18nPluginConfig, TranslationData, I18nAdapter } from './types'
export { I18nCore, createI18nCore } from './core'
export { YmlParser } from './parser'
export { VitePressAdapter, vitePressAdapter } from './adapters/vitepress'
export { i18nVitePlugin, createI18nVitePlugin } from './vite-plugin'
export { i18nPlugin } from './plugin'
