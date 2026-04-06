import type { AutoSidebarConfig, SidebarOptions, Sidebar, SidebarItem } from './types'
import { generateSidebar } from './sidebar'
import { resolve, join, relative, normalize, basename, dirname } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'
import type { PulsePluginOptions } from '@roidmc/horizon-pulse-core'
import { loadSidebarYamlConfig, flattenSidebarItems, unwrapFirstLevel, getOrderFromFrontmatter } from './helper'

const pluginName = 'vite-plugin-horizon-sidebar'

const defaultOptions: Required<SidebarOptions> = {
  documentRootPath: '/',
  scanStartPath: undefined as any,
  resolvePath: undefined as any,
  basePath: undefined as any,
  collapsed: true,
  collapseDepth: 2,
  hyphenToSpace: true,
  underscoreToSpace: true,
  capitalizeFirst: false,
  capitalizeEachWords: false,
  includeRootIndexFile: false,
  includeFolderIndexFile: false,
  useTitleFromFileHeading: true,
  useTitleFromFrontmatter: true,
  useFolderTitleFromIndexFile: true,
  useFolderLinkFromIndexFile: false,
  useFolderLinkFromSameNameSubFile: false,
  includeDotFiles: false,
  folderLinkNotIncludesFileName: false,
  includeEmptyFolder: false,
  sortMenusByName: true,
  sortMenusByFrontmatterOrder: false,
  sortMenusByFrontmatterDate: false,
  sortMenusByFileDatePrefix: false,
  sortMenusOrderByDescending: false,
  sortMenusOrderNumericallyFromTitle: false,
  sortMenusOrderNumericallyFromLink: false,
  sortFolderTo: null,
  keepMarkdownSyntaxFromTitle: false,
  debugPrint: false,
  manualSortFileNameByPriority: [],
  excludeByFolderDepth: undefined as any,
  excludeByGlobPattern: [],
  excludeFilesByFrontmatterFieldName: undefined as any,
  excludeByVitePressSidebarFalse: true,
  followSymlinks: false,
  removePrefixAfterOrdering: false,
  prefixSeparator: '.',
  rootGroupText: undefined as any,
  rootGroupLink: undefined as any,
  rootGroupCollapsed: undefined as any,
  frontmatterOrderDefaultValue: 0,
  frontmatterTitleFieldName: 'title',
  hmr: true,
  excludeLocaleDirs: 'auto',
  flatten: false
}

function addLinkPrefix(items: SidebarItem[], prefix: string): SidebarItem[] {
  return items.map(item => {
    const newItem = { ...item }
    if (newItem.link && !newItem.link.startsWith(prefix)) {
      newItem.link = prefix.replace(/\/$/, '') + newItem.link
    }
    if (newItem.items && Array.isArray(newItem.items)) {
      newItem.items = addLinkPrefix(newItem.items, prefix)
    }
    return newItem
  })
}

function scanContentDirs(srcDir: string): Map<string, string> {
  const localeDirs = new Map<string, string>()

  try {
    const entries = readdirSync(srcDir)

    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'public') continue

      const fullPath = join(srcDir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory()) {
          localeDirs.set(entry, fullPath)
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return localeDirs
}

function scanContentDirectories(srcDir: string, debugPrint: boolean = false): { contentDirs: Map<string, { path: string, config: any }>, localeDirs: Map<string, string> } {
  const contentDirs = new Map<string, { path: string, config: any }>()
  const localeDirs = new Map<string, string>()

  try {
    const entries = readdirSync(srcDir)

    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'public') continue

      const fullPath = join(srcDir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory()) {
          const yamlConfig = loadSidebarYamlConfig(fullPath)

          if (yamlConfig && !yamlConfig.exclude) {
            contentDirs.set(entry, { path: fullPath, config: yamlConfig })
            if (debugPrint) {
              console.log(`[${pluginName}] Loaded config for ${entry}:`, JSON.stringify(yamlConfig))
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return { contentDirs, localeDirs }
}

export interface SidebarPulseOptions {
  config: AutoSidebarConfig
  userConfig: Record<string, any>
  srcDir?: string
}

export function createSidebarPulsePlugin(options: SidebarPulseOptions): PulsePluginOptions {
  let sidebarResults: Record<string, any> = {}
  let lastLocales: any = null
  let lastSrcDir: string = options.srcDir || process.cwd()

  function generateSidebarForLocale(localeKey: string, scanPath: string, linkPrefix: string, localeConfig?: AutoSidebarConfig, excludeDirs?: string[]): SidebarItem[] {
    const { locales: _, ...configWithoutLocales } = options.config || {}
    const { locales: __, ...localeConfigWithoutLocales } = (localeConfig || {}) as AutoSidebarConfig

    const normalizedScanPath = scanPath.replace(/\\/g, '/')

    const excludePatterns = excludeDirs && excludeDirs.length > 0
      ? excludeDirs.map(d => `${d}/**`)
      : []

    const baseDir = lastSrcDir || process.cwd()
    const resolvedBaseDir = resolve(process.cwd(), baseDir)

    const isAbsolutePath = /^[A-Za-z]:[\\/]|^\//.test(normalizedScanPath)

    let finalDocumentRootPath: string
    let finalScanStartPath: string

    if (isAbsolutePath) {
      finalDocumentRootPath = normalizedScanPath.replace(/\\/g, '/')
      finalScanStartPath = ''
    } else {
      finalDocumentRootPath = resolvedBaseDir
      finalScanStartPath = normalizedScanPath
    }

    const opts = {
      ...defaultOptions,
      ...configWithoutLocales,
      ...localeConfigWithoutLocales,
      documentRootPath: finalDocumentRootPath,
      scanStartPath: finalScanStartPath,
      sortMenusByFrontmatterOrder: true,
      sortMenusByName: false,
      excludeByGlobPattern: [
        ...(configWithoutLocales.excludeByGlobPattern || []),
        ...excludePatterns
      ]
    } as SidebarOptions

    if (options.config?.debugPrint) {
      console.log(`[${pluginName}] Generating sidebar for ${normalizedScanPath}:`)
      console.log(`[${pluginName}]   - isAbsolutePath: ${isAbsolutePath}`)
      console.log(`[${pluginName}]   - documentRootPath: ${finalDocumentRootPath}`)
      console.log(`[${pluginName}]   - scanStartPath: ${finalScanStartPath}`)
    }

    const items: Sidebar = generateSidebar(opts)

    if (options.config?.debugPrint && normalizedScanPath.includes('new')) {
      console.log(`[${pluginName}] RAW generateSidebar result for ${normalizedScanPath}:`, JSON.stringify(items, null, 2))
    }

    let sidebar: SidebarItem[]
    if (Array.isArray(items)) {
      sidebar = items
    } else if (items && typeof items === 'object') {
      const firstValue = Object.values(items)[0]
      sidebar = firstValue && 'items' in firstValue ? firstValue.items : []
    } else {
      sidebar = []
    }

    if (linkPrefix && linkPrefix !== '/') {
      sidebar = addLinkPrefix(sidebar, linkPrefix)
    }

    return sidebar
  }

  function loadSidebarConfigFromLocales(locales: any) {
    if (!locales || typeof locales !== 'object') {
      return
    }

    sidebarResults = {}
    const localeKeys = Object.keys(locales)

    if (localeKeys.length === 0) {
      return
    }

    const srcDir = lastSrcDir
    const { contentDirs, localeDirs } = scanContentDirectories(srcDir, !!options.config?.debugPrint)

    if (options.config?.debugPrint) {
      console.log(`[${pluginName}] Loading sidebar for locales:`, localeKeys.join(', '))
      console.log(`[${pluginName}] Found content dirs with .sidebar.yml:`, Array.from(contentDirs.keys()).join(', '))
      console.log(`[${pluginName}] Found locale dirs:`, Array.from(localeDirs.keys()).join(', '))
    }

    for (const localeKey of localeKeys) {
      if (localeKey === 'root') {
        if (contentDirs.size > 0) {
          const sortedContentDirs = Array.from(contentDirs.entries())
            .sort((a, b) => (a[1].config.order || 0) - (b[1].config.order || 0))

          const independentDirs = sortedContentDirs.filter(([, dirInfo]) => {
            if (options.config?.debugPrint) {
              console.log(`[${pluginName}] Checking ${dirInfo.path}: independent=${dirInfo.config.independent}, config=`, JSON.stringify(dirInfo.config))
            }
            return dirInfo.config.independent
          })
          const mergedDirs = sortedContentDirs.filter(([, dirInfo]) => !dirInfo.config.independent)

          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Total content dirs:`, sortedContentDirs.length)
            console.log(`[${pluginName}] Independent dirs:`, independentDirs.map(([name]) => name))
            console.log(`[${pluginName}] Merged dirs:`, mergedDirs.map(([name]) => name))
          }

          const mergedSidebar: SidebarItem[] = []
          const independentSidebars: Record<string, SidebarItem[]> = {}

          for (const [dirName, dirInfo] of mergedDirs) {
            const yamlConfig = dirInfo.config
            const { locales: _, ...configWithoutLocales } = options.config || {}

            const fullDirPath = resolve(process.cwd(), lastSrcDir || '.', dirName)
            const linkPrefix = `/${dirName}/`

            if (options.config?.debugPrint) {
              console.log(`[${pluginName}] Generating merged sidebar for ${dirName}:`)
              console.log(`[${pluginName}]   - Full directory path: ${fullDirPath}`)
              console.log(`[${pluginName}]   - Link prefix: ${linkPrefix}`)
            }

            let dirSidebar = generateSidebarForLocale(
              'root',
              fullDirPath,
              linkPrefix,
              options.config,
              []
            )

            if (yamlConfig.flatten && dirSidebar.length > 0) {
              let flattenedSidebar: SidebarItem[]

              if (yamlConfig.flatten === 'recursive') {
                flattenedSidebar = flattenSidebarItems(dirSidebar)
              } else if (yamlConfig.flatten === 'merge') {
                flattenedSidebar = dirSidebar  // 直接 push 原始 items
              } else {
                flattenedSidebar = unwrapFirstLevel(dirSidebar)  // true 的情况
              }

              if (options.config?.debugPrint) {
                console.log(`[${pluginName}] ${dirName} flatten=${yamlConfig.flatten}, merging ${flattenedSidebar.length} items`)
              }
              mergedSidebar.push(...flattenedSidebar)
            } else {
              const groupTitle = yamlConfig.title || dirName

              mergedSidebar.push({
                text: groupTitle,
                ...(yamlConfig.collapsed !== undefined ? { collapsed: yamlConfig.collapsed } : {}),
                items: dirSidebar
              })
            }
          }

          for (const [dirName, dirInfo] of independentDirs) {
            const yamlConfig = dirInfo.config

            const otherContentDirs = Array.from(contentDirs.keys()).filter(d => d !== dirName)

            const fullDirPath = resolve(process.cwd(), lastSrcDir || '.', dirName)

            if (options.config?.debugPrint) {
              console.log(`[${pluginName}] Generating independent sidebar for ${dirName}:`)
              console.log(`[${pluginName}]   - Full directory path: ${fullDirPath}`)
            }

            let dirSidebar = generateSidebarForLocale(
              'root',
              fullDirPath,
              `/${dirName}/`,
              options.config,
              otherContentDirs
            )

            if (yamlConfig.flatten && dirSidebar.length > 0) {
              if (yamlConfig.flatten === 'recursive') {
                dirSidebar = flattenSidebarItems(dirSidebar)
              } else if (yamlConfig.flatten !== 'merge') {
                dirSidebar = unwrapFirstLevel(dirSidebar)
              }
              // 'merge' 的情况保持 dirSidebar 不变
            }

            if (options.config?.debugPrint) {
              console.log(`[${pluginName}] Raw sidebar for ${dirName} (before flatten):`, dirSidebar.length, 'items')
            }

            const basePath = `/${dirName}/`
            independentSidebars[basePath] = dirSidebar

            if (options.config?.debugPrint) {
              console.log(`[${pluginName}] Generated independent sidebar for ${basePath}:`, dirSidebar.length, 'items')
              if (dirSidebar.length > 0) {
                console.log(`[${pluginName}] First item:`, JSON.stringify(dirSidebar[0]))
              } else {
                console.log(`[${pluginName}] WARNING: ${basePath} sidebar is empty!`)
              }
            }
          }

          const excludeDirPatterns = [
            ...Array.from(contentDirs.keys()),
            ...localeKeys.filter(k => k !== 'root')
          ]

          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Generating remaining items for root (srcDir: ${srcDir}, exclude: [${excludeDirPatterns.join(', ')}])`)
          }

          const fullSrcDirPath = resolve(process.cwd(), srcDir)

          const remainingItems = generateSidebarForLocale(
            'root',
            fullSrcDirPath,
            '/',
            options.config,
            excludeDirPatterns
          )

          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Remaining items for root:`, remainingItems.length, 'items')
            console.log(`[${pluginName}] Merged sidebar before adding remaining:`, mergedSidebar.length, 'items')
          }

          if (remainingItems.length > 0) {
            mergedSidebar.push(...remainingItems)
          }

          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Final merged sidebar:`, mergedSidebar.length, 'items')
          }

          if (Object.keys(independentSidebars).length > 0) {
            const rootNavItems: SidebarItem[] = Array.from(independentDirs)
              .filter(([, dirInfo]) => dirInfo.config.showInRoot === true)
              .sort((a, b) => (a[1].config.order || 0) - (b[1].config.order || 0))
              .map(([dirName, dirInfo]) => ({
                text: dirInfo.config.title?.replace(/"/g, '') || dirName,
                link: `/${dirName}/`,
                _order: dirInfo.config.order || 999,
                ...(dirInfo.config.collapsed !== undefined ? { collapsed: dirInfo.config.collapsed } : {})
              }))

            const mergedWithOrder = mergedSidebar.map(item => {
              let itemOrder = (item as any).order || 0

              if (!itemOrder) {
                try {
                  let targetPath = ''
                  let targetDir = ''

                  if (item.link) {
                    const linkPath = item.link.startsWith('/') ? item.link.slice(1) : item.link
                    targetPath = resolve(process.cwd(), lastSrcDir || '.', linkPath.replace(/\/$/, ''), 'index.md')
                    targetDir = dirname(targetPath)
                  } else if (item.items && item.items.length > 0 && item.items[0].link) {
                    const childLink = item.items[0].link
                    const linkPath = childLink.startsWith('/') ? childLink.slice(1) : childLink
                    const parentDir = dirname(linkPath)
                    targetPath = resolve(process.cwd(), lastSrcDir || '.', parentDir, 'index.md')
                    targetDir = resolve(process.cwd(), lastSrcDir || '.', parentDir)
                  }

                  if (targetDir) {
                    const yamlConfig = loadSidebarYamlConfig(targetDir)
                    if (yamlConfig?.order !== undefined) {
                      itemOrder = yamlConfig.order
                    }
                  }

                  if (!itemOrder && targetPath && existsSync(targetPath)) {
                    itemOrder = getOrderFromFrontmatter(targetPath, 0)
                  }
                } catch (e) {
                  // ignore
                }
              }

              return {
                ...item,
                _order: itemOrder
              }
            })

            const allItems = [...mergedWithOrder, ...rootNavItems]
            const sortedItems = allItems.sort((a, b) => {
              const orderA = (a as any)._order || 0
              const orderB = (b as any)._order || 0

              if (orderA !== orderB) return orderA - orderB

              const textA = a.text || a.link || ''
              const textB = b.text || b.link || ''
              return textA.localeCompare(textB)
            }).map(({ _order, ...item }) => item)

            if (options.config?.debugPrint) {
              console.log(`[${pluginName}] Generated root navigation with ${sortedItems.length} items (sorted by order + name):`, sortedItems.map(item => ({ text: item.text, order: (mergedWithOrder.find(m => m.text === item.text) || rootNavItems.find(r => r.text === item.text))?._order })))
            }

            sidebarResults['root'] = {
              ...independentSidebars,
              '/': sortedItems
            }
          } else {
            sidebarResults['root'] = mergedSidebar
          }

          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Independent sidebars:`, Object.keys(independentSidebars))
            console.log(`[${pluginName}] Merged sidebar groups:`, mergedSidebar.map(s => s.text))
          }
        } else {
          const rootPath = resolve(process.cwd(), srcDir)
          sidebarResults['root'] = generateSidebarForLocale('root', rootPath, '/', options.config)
        }
      } else {
        const localeDir = localeDirs.get(localeKey) || localeDirs.get(localeKey.replace(/-/g, '_'))
        const localePath = localeDir || resolve(process.cwd(), lastSrcDir || '.', localeKey)

        const { contentDirs: localeContentDirs } = scanContentDirectories(localePath, !!options.config?.debugPrint)

        if (localeContentDirs.size > 0) {
          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Found content dirs in ${localeKey}:`, Array.from(localeContentDirs.keys()).join(', '))
          }

          const mergedSidebar: SidebarItem[] = []

          for (const [dirName, dirInfo] of localeContentDirs) {
            const yamlConfig = dirInfo.config
            const fullDirPath = resolve(localePath, dirName)
            const linkPrefix = `/${localeKey}/${dirName}/`

            let dirSidebar = generateSidebarForLocale(
              localeKey,
              fullDirPath,
              linkPrefix,
              options.config,
              []
            )

            if (yamlConfig.flatten && dirSidebar.length > 0) {
              let flattenedSidebar: SidebarItem[]

              if (yamlConfig.flatten === 'recursive') {
                flattenedSidebar = flattenSidebarItems(dirSidebar)
              } else if (yamlConfig.flatten === 'merge') {
                flattenedSidebar = dirSidebar
              } else {
                flattenedSidebar = unwrapFirstLevel(dirSidebar)
              }

              if (options.config?.debugPrint) {
                console.log(`[${pluginName}] ${localeKey}/${dirName} flatten=${yamlConfig.flatten}, merging ${flattenedSidebar.length} items`)
              }
              mergedSidebar.push(...flattenedSidebar)
            } else {
              const groupTitle = yamlConfig.title || dirName
              mergedSidebar.push({
                text: groupTitle,
                ...(yamlConfig.collapsed !== undefined ? { collapsed: yamlConfig.collapsed } : {}),
                items: dirSidebar
              })
            }
          }

          const excludeDirPatterns = Array.from(localeContentDirs.keys())
          const remainingItems = generateSidebarForLocale(
            localeKey,
            localePath,
            `/${localeKey}/`,
            options.config,
            excludeDirPatterns
          )

          if (remainingItems.length > 0) {
            mergedSidebar.push(...remainingItems)
          }

          if (options.config?.debugPrint) {
            console.log(`[${pluginName}] Final merged sidebar for ${localeKey}:`, mergedSidebar.length, 'items')
          }

          sidebarResults[localeKey] = mergedSidebar
        } else {
          sidebarResults[localeKey] = generateSidebarForLocale(
            localeKey,
            localePath,
            `/${localeKey}/`,
            options.config
          )
        }
      }
    }

    if (options.config?.debugPrint) {
      console.log(`[${pluginName}] Sidebar config loaded for ${Object.keys(sidebarResults).length} locales`)
    }
  }

  function getWatchDirs(): string[] {
    const dirs: string[] = []
    let srcDir = lastSrcDir

    srcDir = resolve(process.cwd(), srcDir)
    srcDir = normalize(srcDir)

    if (existsSync(srcDir)) {
      dirs.push(srcDir)
    }

    const { contentDirs, localeDirs } = scanContentDirectories(srcDir, !!options.config?.debugPrint)

    for (const dirInfo of contentDirs.values()) {
      if (existsSync(dirInfo.path)) {
        dirs.push(dirInfo.path)
      }
    }

    for (const dir of localeDirs.values()) {
      if (existsSync(dir)) {
        dirs.push(dir)
      }
    }

    return [...new Set(dirs)]
  }

  return {
    name: pluginName,
    priority: 50,
    debug: options.config?.debugPrint || false,

    watchFiles: getWatchDirs(),

    async patch(ctx) {
      const { previousData } = ctx

      const locales = previousData?.locales || options.userConfig?.locales

      if (locales) {
        lastLocales = locales
        if (options.config?.debugPrint) {
          const source = previousData?.locales ? 'i18n plugin' : 'user config'
          console.log(`[${pluginName}] Loading locales from ${source}`)
        }
        loadSidebarConfigFromLocales(lastLocales)
      }

      if (Object.keys(sidebarResults).length === 0) {
        return null
      }

      const localesWithSidebar: Record<string, any> = {}

      for (const [localeKey, sidebar] of Object.entries(sidebarResults)) {
        localesWithSidebar[localeKey] = {
          themeConfig: {
            sidebar
          }
        }
      }

      if (options.config?.debugPrint) {
        console.log(`[${pluginName}] Patching with sidebar data for ${Object.keys(sidebarResults).length} locales`)
      }

      return {
        data: {
          locales: localesWithSidebar
        },
        code: `// sidebar patch applied`
      }
    },

    async onHotUpdate(ctx) {
      const { file, allPluginData } = ctx

      const isMarkdownFile = file.endsWith('.md') || file.endsWith('.markdown')
      const isSidebarConfig = file.endsWith('.sidebar.yml')

      if (!isMarkdownFile && !isSidebarConfig) {
        return false
      }

      const watchDirs = getWatchDirs()
      const normalizedFile = normalize(file).toLowerCase()
      const isWatched = watchDirs.some(dir => normalizedFile.startsWith(normalize(dir).toLowerCase()))

      if (!isWatched) {
        return false
      }

      if (options.config?.debugPrint) {
        console.log(`\n[${pluginName}] ${isSidebarConfig ? 'Sidebar config' : 'Markdown'} file changed: ${relative(process.cwd(), file)}`)
      }

      if (allPluginData?.['vite-plugin-horizon-i18n']?.locales) {
        lastLocales = allPluginData['vite-plugin-horizon-i18n'].locales
      } else if (!lastLocales && options.userConfig?.locales) {
        lastLocales = options.userConfig.locales
      }

      if (!lastLocales) {
        return false
      }

      loadSidebarConfigFromLocales(lastLocales)

      const localesWithSidebar: Record<string, any> = {}

      for (const [localeKey, sidebar] of Object.entries(sidebarResults)) {
        localesWithSidebar[localeKey] = {
          themeConfig: {
            sidebar
          }
        }
      }

      return {
        shouldUpdate: true,
        newData: {
          locales: localesWithSidebar
        }
      }
    }
  }
}
