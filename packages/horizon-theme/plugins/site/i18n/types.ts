/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

/**
 * i18n 核心类型定义
 * 基于适配器模式,解耦翻译源与目标系统
 */

/**
 * 翻译数据结构
 */
export interface TranslationData {
  /** 语言代码,如 'zh-CN', 'en-US' */
  locale: string
  /** 命名空间,用于区分不同的翻译来源 */
  namespace: string
  /** 翻译数据 */
  data: Record<string, any>
}

/**
 * 适配器接口 - 核心抽象层
 * 所有目标系统的适配器都需要实现此接口
 */
export interface I18nAdapter {
  /** 适配器名称 */
  name: string
  /** 
   * 将统一的翻译数据转换为目标系统所需的格式
   * @param data 翻译数据数组
   * @param context 上下文信息，包含用户配置等
   * @returns 目标系统的配置对象
   */
  transform(data: TranslationData[], context?: I18nTransformContext): any
}

/**
 * 适配器转换上下文
 */
export interface I18nTransformContext {
  /** 用户配置 */
  userConfig?: Record<string, any>
  /** 默认语言 */
  defaultLocale?: string
}

/**
 * YML 文件解析结果
 */
export interface ParsedYmlTranslation {
  locale: string
  namespaces: Record<string, any>
  /** i18n 元数据 */
  meta?: {
    /** 目标 locale */
    lang?: string
    /** 显示名称 */
    name?: string
    /** 链接路径 */
    link?: string
    /** 其他自定义元数据 */
    [key: string]: any
  }
}

/**
 * i18n 插件配置
 */
export interface I18nPluginConfig {
  /** YML 文件目录路径 */
  translateDir?: string
  /** 默认语言 */
  defaultLocale?: string
  /** 是否启用调试日志 */
  debug?: boolean
  
  /**
   * 文件名到目标 locale 的映射
   * 将指定文件的翻译内容映射到目标 locale
   * 
   * 示例:
   * - { 'cn.yml': 'zh-CN' } → cn.yml 的内容映射为 zh-CN locale
   * - { 'en-US.yml': 'zh-CN' } → en-US.yml 的内容映射为 zh-CN locale（覆盖）
   * 
   * - 不配置: 文件名即 locale (en-US.yml → en-US)
   * - 对象: 自定义文件名到 locale 的映射
   * - 函数: 完全自定义 (filename) => targetLocale
   */
  localeMappings?: 
    | Record<string, string>
    | ((filename: string) => string | undefined)
  
  /** 启用的适配器列表 */
  adapters?: I18nAdapter[]
  
  /**
   * 用户配置（用于自动检测搜索类型等）
   * @internal 内部使用
   */
  userConfig?: Record<string, any>
}

/**
 * VitePress locale 配置类型
 */
export interface VitePressLocaleConfig {
  label: string
  lang: string
  link?: string
  title?: string
  titleTemplate?: string | boolean
  description?: string
  head?: any[]
  themeConfig?: Record<string, any>
}

/**
 * VitePress 完整配置类型
 */
export interface VitePressI18nResult {
  locales?: Record<string, VitePressLocaleConfig>
  themeConfig?: Record<string, any>
}
