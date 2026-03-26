import { dirname, resolve, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import type { I18nPluginConfig } from './types'
import { createI18nCore } from './core'

export interface I18nLoadResult {
  config: I18nPluginConfig
  mergedConfig: {
    locales?: Record<string, any>
    themeConfig?: Record<string, any>
  }
}

export function loadI18nConfig(
  i18n: boolean | I18nPluginConfig | undefined,
  userConfig: Record<string, any>
): I18nLoadResult | null {
  const config = resolveI18nConfigPath(i18n)
  if (!config) return null
  
  const results = loadAndMergeConfig(config, userConfig)
  
  return {
    config,
    mergedConfig: results
  }
}

function resolveI18nConfigPath(i18n: boolean | I18nPluginConfig | undefined): I18nPluginConfig | null {
  if (!i18n) return null
  
  const pkgDir = dirname(fileURLToPath(import.meta.url))
  const projectRoot = resolve(pkgDir, '..', '..', '..')
  
  const possibleDirs = [
    resolve(projectRoot, 'i18n', 'translate'),
    resolve(pkgDir, 'translate'),
    resolve(process.cwd(), 'i18n', 'translate'),
    resolve(process.cwd(), 'packages', 'horizon-theme', 'plugins', 'site', 'i18n', 'translate'),
    resolve(projectRoot, 'docs', 'i18n', 'translate')
  ]
  
  if (typeof i18n === 'object' && i18n.translateDir) {
    const translateDir = isAbsolute(i18n.translateDir) 
      ? i18n.translateDir 
      : resolve(process.cwd(), i18n.translateDir)
    possibleDirs.unshift(translateDir)
  }
  
  const translateDir = possibleDirs.find(dir => {
    const exists = existsSync(dir)
    if (exists) console.log(`[i18n] Found translate directory: ${dir}`)
    return exists
  })
  
  if (!translateDir) {
    console.warn('[i18n] No i18n/translate directory found')
    return null
  }
  
  return {
    translateDir,
    defaultLocale: 'en-US',
    debug: false,
    ...(typeof i18n === 'object' ? i18n : {})
  }
}

function loadAndMergeConfig(
  config: I18nPluginConfig, 
  userConfig: Record<string, any>
): { locales?: Record<string, any>; themeConfig?: Record<string, any> } {
  const i18nCore = createI18nCore(config)
  const results = i18nCore.process({ userConfig })
  
  if (!results.vitepress) {
    return {}
  }
  
  const { locales, themeConfig } = results.vitepress
  
  if (config.debug) {
    console.log('[i18n] Auto-loaded i18n configuration')
    console.log('[i18n] Locales:', Object.keys(locales || {}).join(', '))
  }
  
  return {
    locales: {
      ...locales,
      ...userConfig.locales
    },
    themeConfig: {
      ...themeConfig,
      ...userConfig.themeConfig
    }
  }
}
