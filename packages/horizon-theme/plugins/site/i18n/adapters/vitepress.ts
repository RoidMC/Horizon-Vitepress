import type { I18nAdapter, TranslationData, VitePressI18nResult, VitePressLocaleConfig, I18nTransformContext } from '../types'

/**
 * VitePress 适配器
 * 将统一的翻译数据转换为 VitePress 所需的配置格式
 */
export class VitePressAdapter implements I18nAdapter {
  name = 'vitepress'

  /**
   * 语言代码到显示标签的映射
   */
  private localeLabels: Record<string, string> = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'en-US': 'English',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
    'es-ES': 'Español',
    'pt-PT': 'Português',
    'ru-RU': 'Русский',
    'de-DE': 'Deutsch',
    'fr-FR': 'Français'
  }

  /**
   * 转换翻译数据为 VitePress 配置
   */
  transform(data: TranslationData[], context?: I18nTransformContext): VitePressI18nResult {
    const defaultLocale = context?.defaultLocale || 'en-US'
    
    // 按语言分组
    const localeGroups = this.groupByLocale(data)
    
    const locales: Record<string, VitePressLocaleConfig> = {}
    const themeConfig: Record<string, any> = {}

    // 检测用户使用的搜索类型
    const searchProvider = this.detectSearchProvider(context?.userConfig)

    for (const [locale, translations] of Object.entries(localeGroups)) {
      const localeConfig = this.buildLocaleConfig(locale, translations, searchProvider)
      
      // VitePress 使用 'root' 作为默认语言的 key
      const localeKey = locale === defaultLocale ? 'root' : locale
      locales[localeKey] = localeConfig
    }

    return { locales, themeConfig }
  }

  /**
   * 检测用户使用的搜索类型
   */
  private detectSearchProvider(userConfig?: Record<string, any>): 'local' | 'algolia' | undefined {
    if (!userConfig?.themeConfig?.search) {
      return undefined
    }

    const search = userConfig.themeConfig.search
    
    if (typeof search === 'object') {
      if (search.provider === 'local') return 'local'
      if (search.provider === 'algolia') return 'algolia'
    }

    // 兼容旧版 algolia 配置
    if (userConfig.themeConfig.algolia) {
      return 'algolia'
    }

    return undefined
  }

  /**
   * 按语言分组翻译数据
   */
  private groupByLocale(data: TranslationData[]): Record<string, TranslationData[]> {
    const groups: Record<string, TranslationData[]> = {}
    
    for (const item of data) {
      if (!groups[item.locale]) {
        groups[item.locale] = []
      }
      groups[item.locale].push(item)
    }

    return groups
  }

  /**
   * 构建单个语言的配置
   */
  private buildLocaleConfig(
    locale: string, 
    translations: TranslationData[],
    searchProvider?: 'local' | 'algolia'
  ): VitePressLocaleConfig {
    // 获取 meta 数据
    const meta = translations.find(t => t.namespace === 'meta')?.data
    
    const config: VitePressLocaleConfig = {
      label: meta?.name || this.localeLabels[locale] || locale,
      lang: locale,
      themeConfig: {}
    }

    // 处理 link
    if (meta?.link) {
      config.link = meta.link
    }

    // 合并所有命名空间的数据
    for (const { namespace, data } of translations) {
      if (namespace === 'vitepress') {
        // VitePress 核心配置
        this.mergeVitePressCore(config, data, searchProvider)
      } else if (namespace === 'horizon-i18n') {
        // Horizon 主题特定配置
        this.mergeHorizonConfig(config, data)
      }
      // 忽略 'meta' 命名空间,已经处理过了
    }

    return config
  }

  /**
   * 合并 VitePress 核心配置
   */
  private mergeVitePressCore(
    config: VitePressLocaleConfig, 
    data: Record<string, any>,
    searchProvider?: 'local' | 'algolia'
  ) {
    const { search, ...themeData } = data

    // 合并主题配置
    config.themeConfig = {
      ...config.themeConfig,
      ...themeData
    }

    // 处理搜索配置
    if (search) {
      this.mergeSearchConfig(config, search, searchProvider)
    }
  }

  /**
   * 合并搜索配置
   */
  private mergeSearchConfig(
    config: VitePressLocaleConfig, 
    searchData: Record<string, any>,
    searchProvider?: 'local' | 'algolia'
  ) {
    const { localSearch, algoliaSearch } = searchData

    // 根据用户配置的搜索类型选择对应的翻译
    if (searchProvider === 'local' && localSearch) {
      config.themeConfig!.search = {
        provider: 'local',
        options: {
          translations: localSearch
        }
      }
    } else if (searchProvider === 'algolia' && algoliaSearch) {
      config.themeConfig!.search = {
        provider: 'algolia',
        options: {
          translations: algoliaSearch
        }
      }
    } else if (localSearch) {
      // 默认使用 localSearch
      config.themeConfig!.search = {
        provider: 'local',
        options: {
          translations: localSearch
        }
      }
    }
  }

  /**
   * 合并 Horizon 主题特定配置
   */
  private mergeHorizonConfig(config: VitePressLocaleConfig, data: Record<string, any>) {
    // 这里可以扩展 Horizon 主题的特定翻译
    config.themeConfig!.horizon = data
  }
}

/**
 * 导出单例实例
 */
export const vitePressAdapter = new VitePressAdapter()
