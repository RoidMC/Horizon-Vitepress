import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import * as yaml from 'yaml'
import type { ParsedYmlTranslation, TranslationData, I18nPluginConfig } from './types'

let debugMode = false

export function setParserDebug(debug: boolean) {
  debugMode = debug
}

/**
 * 默认的文件名到 locale 映射表
 */
const DEFAULT_LOCALE_MAPPINGS: Record<string, string> = {
  // 简写形式
  'cn': 'zh-CN',
  'en': 'en-US',
  'jp': 'ja-JP',
  'kr': 'ko-KR',
  'tw': 'zh-TW',
  'es': 'es-ES',
  'pt': 'pt-PT',
  'ru': 'ru-RU',
  'de': 'de-DE',
  'fr': 'fr-FR',
  
  // 标准形式
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'en-US': 'en-US',
  'ja-JP': 'ja-JP',
  'ko-KR': 'ko-KR',
  'es-ES': 'es-ES',
  'pt-PT': 'pt-PT',
  'ru-RU': 'ru-RU',
  'de-DE': 'de-DE',
  'fr-FR': 'fr-FR'
}

/**
 * YML 文件解析器
 * 负责读取和解析 YML 翻译文件
 */
export class YmlParser {
  /**
   * 解析单个 YML 文件
   * @param filePath YML 文件路径
   * @param localeMappings 文件名映射配置
   * @returns 解析后的翻译数据
   */
  static parseFile(
    filePath: string, 
    localeMappings?: I18nPluginConfig['localeMappings']
  ): ParsedYmlTranslation | null {
    if (!existsSync(filePath)) {
      console.warn(`[i18n] YML file not found: ${filePath}`)
      return null
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const data = yaml.parse(content) as Record<string, any>
      
      // 提取 i18n-meta
      const meta = data['i18n-meta']
      const namespaces = { ...data }
      delete namespaces['i18n-meta']  // 移除 meta,只保留命名空间
      
      // 从文件名提取语言代码
      const filename = basename(filePath)
      
      // 确定 locale (优先级: meta.lang > localeMappings > 文件名)
      let locale: string | undefined
      
      // 1. 最高优先级: i18n-meta.lang
      if (meta?.lang) {
        locale = meta.lang
        if (debugMode) {
          console.log(`[i18n] Using meta.lang from ${filename}: ${locale}`)
        }
      }
      // 2. 中优先级: localeMappings
      else {
        locale = this.resolveLocale(filename, localeMappings)
      }
      
      if (!locale) {
        console.warn(`[i18n] Cannot resolve locale for file: ${filename}`)
        return null
      }
      
      if (debugMode) {
        console.log(`[i18n] Parsed ${filename} → locale: ${locale}${meta?.name ? ` (${meta.name})` : ''}`)
      }
      
      return {
        locale,
        namespaces: namespaces || {},
        meta
      }
    } catch (error) {
      console.error(`[i18n] Failed to parse YML file: ${filePath}`, error)
      return null
    }
  }

  /**
   * 解析文件名到 locale
   */
  private static resolveLocale(
    filename: string,
    localeMappings?: I18nPluginConfig['localeMappings']
  ): string | undefined {
    // 移除 .yml 或 .yaml 后缀
    const nameWithoutExt = filename.replace(/\.(yml|yaml)$/, '')
    
    // 1. 用户自定义映射(函数)
    if (typeof localeMappings === 'function') {
      const result = localeMappings(filename)
      if (result) return result
    }
    
    // 2. 用户自定义映射(对象)
    if (localeMappings && typeof localeMappings === 'object') {
      // 先尝试完整文件名
      if (localeMappings[filename]) {
        return localeMappings[filename]
      }
      // 再尝试不带后缀的文件名
      if (localeMappings[nameWithoutExt]) {
        return localeMappings[nameWithoutExt]
      }
    }
    
    // 3. 默认映射
    if (DEFAULT_LOCALE_MAPPINGS[nameWithoutExt]) {
      return DEFAULT_LOCALE_MAPPINGS[nameWithoutExt]
    }
    
    // 4. 如果都不匹配,返回文件名本身(可能就是标准 locale)
    return nameWithoutExt
  }

  /**
   * 解析目录下的所有 YML 文件
   * @param dirPath YML 文件目录
   * @param localeMappings 文件名映射配置
   * @returns 解析后的翻译数据数组
   */
  static parseDirectory(
    dirPath: string,
    localeMappings?: I18nPluginConfig['localeMappings']
  ): ParsedYmlTranslation[] {
    if (!existsSync(dirPath)) {
      console.warn(`[i18n] Translation directory not found: ${dirPath}`)
      return []
    }

    // 获取所有 YML 文件
    const allFiles = readdirSync(dirPath)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))

    let filesToProcess: string[]

    // 如果配置了对象形式的 localeMappings,只加载指定的文件
    if (localeMappings && typeof localeMappings === 'object') {
      const specifiedFiles = Object.keys(localeMappings)
      filesToProcess = specifiedFiles.filter(filename => allFiles.includes(filename))
      
      if (debugMode) {
        console.log(`[i18n] Loading specified files: ${filesToProcess.join(', ')}`)
      }
      
      // 转换为完整路径
      filesToProcess = filesToProcess.map(filename => join(dirPath, filename))
    } else {
      // 没有配置或函数形式:加载所有文件
      filesToProcess = allFiles.map(file => join(dirPath, file))
    }

    const results: ParsedYmlTranslation[] = []
    
    for (const file of filesToProcess) {
      const parsed = this.parseFile(file, localeMappings)
      if (parsed) {
        results.push(parsed)
      }
    }

    return results
  }

  /**
   * 将解析后的 YML 数据转换为统一的 TranslationData 格式
   * @param parsed 解析后的 YML 数据
   * @returns 统一的翻译数据数组
   */
  static toTranslationData(parsed: ParsedYmlTranslation): TranslationData[] {
    const { locale, namespaces, meta } = parsed
    const result: TranslationData[] = []

    // 如果有 meta,添加到结果中
    if (meta) {
      result.push({
        locale,
        namespace: 'meta',
        data: meta
      })
    }

    // 遍历所有命名空间
    for (const [namespace, data] of Object.entries(namespaces)) {
      result.push({
        locale,
        namespace,
        data: data as Record<string, any>
      })
    }

    return result
  }

  /**
   * 批量转换解析数据
   * @param parsedArray 解析后的 YML 数据数组
   * @returns 统一的翻译数据数组
   */
  static batchToTranslationData(parsedArray: ParsedYmlTranslation[]): TranslationData[] {
    return parsedArray.flatMap(parsed => this.toTranslationData(parsed))
  }
}
