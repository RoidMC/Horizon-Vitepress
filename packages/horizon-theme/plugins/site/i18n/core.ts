/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

import type { I18nPluginConfig, TranslationData, I18nAdapter, I18nTransformContext } from './types'
import { YmlParser, setParserDebug } from './parser'
import { vitePressAdapter } from './adapters/vitepress'

/**
 * i18n 核心管理器
 * 协调 YML 解析器和适配器,提供统一的翻译处理流程
 */
export class I18nCore {
  private config: I18nPluginConfig
  private adapters: I18nAdapter[]

  constructor(config: I18nPluginConfig) {
    this.config = {
      defaultLocale: 'en-US',
      debug: false,
      ...config
    }
    
    setParserDebug(this.config.debug || false)
    
    // 默认使用 VitePress 适配器
    this.adapters = config.adapters || [vitePressAdapter]
  }

  /**
   * 加载并解析所有翻译文件
   */
  loadTranslations(): TranslationData[] {
    if (!this.config.translateDir) {
      if (this.config.debug) {
        console.warn('[i18n] No translateDir specified, skipping translation loading')
      }
      return []
    }

    if (this.config.debug) {
      console.log(`[i18n] Loading translations from: ${this.config.translateDir}`)
    }

    // 解析 YML 文件,传入 localeMappings 配置
    const parsedData = YmlParser.parseDirectory(
      this.config.translateDir,
      this.config.localeMappings
    )
    
    // 转换为统一的翻译数据格式
    const translations = YmlParser.batchToTranslationData(parsedData)

    if (this.config.debug) {
      console.log(`[i18n] Loaded ${translations.length} translation entries`)
      console.log(`[i18n] Locales: ${[...new Set(translations.map(t => t.locale))].join(', ')}`)
    }

    return translations
  }

  /**
   * 使用指定适配器转换翻译数据
   */
  transformWithAdapter(
    adapterName: string, 
    translations: TranslationData[], 
    context?: I18nTransformContext
  ): any {
    const adapter = this.adapters.find(a => a.name === adapterName)
    
    if (!adapter) {
      throw new Error(`[i18n] Adapter not found: ${adapterName}`)
    }

    return adapter.transform(translations, context)
  }

  /**
   * 使用所有适配器转换翻译数据
   */
  transformAll(translations: TranslationData[], context?: I18nTransformContext): Record<string, any> {
    const results: Record<string, any> = {}
    const mergedContext: I18nTransformContext = {
      defaultLocale: this.config.defaultLocale,
      ...context
    }

    for (const adapter of this.adapters) {
      results[adapter.name] = adapter.transform(translations, mergedContext)
      
      if (this.config.debug) {
        console.log(`[i18n] Transformed with adapter: ${adapter.name}`)
      }
    }

    return results
  }

  /**
   * 完整的处理流程: 加载 → 转换
   */
  process(context?: I18nTransformContext): Record<string, any> {
    const translations = this.loadTranslations()
    return this.transformAll(translations, context)
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLocales(): string[] {
    const translations = this.loadTranslations()
    return [...new Set(translations.map(t => t.locale))]
  }
}

/**
 * 创建 i18n 核心实例的工厂函数
 */
export function createI18nCore(config: I18nPluginConfig): I18nCore {
  return new I18nCore(config)
}
