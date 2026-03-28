import type { AutoSidebarConfig, SidebarOptions, Sidebar, SidebarItem } from './types'
import { generateSidebar } from './sidebar'
import { resolve, join, relative, normalize, basename } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'
import type { PulsePluginOptions } from '../pulse'

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
  followSymlinks: false,
  removePrefixAfterOrdering: false,
  prefixSeparator: '.',
  rootGroupText: undefined as any,
  rootGroupLink: undefined as any,
  rootGroupCollapsed: undefined as any,
  frontmatterOrderDefaultValue: 0,
  frontmatterTitleFieldName: 'title',
  hmr: true,
  excludeLocaleDirs: 'auto'
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

export interface SidebarPulseOptions {
  config: AutoSidebarConfig
  userConfig: Record<string, any>
  srcDir?: string
}

export function createSidebarPulsePlugin(options: SidebarPulseOptions): PulsePluginOptions {
  const pluginName = 'vite-plugin-horizon-sidebar'
  let sidebarResults: Record<string, any[]> = {}
  let lastLocales: any = null
  let lastSrcDir: string = options.srcDir || process.cwd()

  function generateSidebarForLocale(localeKey: string, scanPath: string, linkPrefix: string, localeConfig?: AutoSidebarConfig, excludeDirs?: string[]): SidebarItem[] {
    const { locales: _, ...configWithoutLocales } = options.config || {}
    const { locales: __, ...localeConfigWithoutLocales } = (localeConfig || {}) as AutoSidebarConfig
    
    const normalizedScanPath = scanPath.replace(/\\/g, '/')
    
    const excludePatterns = excludeDirs && excludeDirs.length > 0 
      ? excludeDirs.map(d => `${d}/**`)
      : []
    
    const opts = {
      ...defaultOptions,
      ...configWithoutLocales,
      ...localeConfigWithoutLocales,
      scanStartPath: normalizedScanPath,
      documentRootPath: '/',
      excludeByGlobPattern: [
        ...(configWithoutLocales.excludeByGlobPattern || []),
        ...excludePatterns
      ]
    } as SidebarOptions

    const items: Sidebar = generateSidebar(opts)

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
    const localeDirs = scanContentDirs(srcDir)
    
    const excludeLocaleDirs = options.config?.excludeLocaleDirs ?? 'auto'
    const shouldExcludeLocaleDirs = excludeLocaleDirs === true || excludeLocaleDirs === 'auto'
    
    const nonRootLocaleKeys = localeKeys.filter(k => k !== 'root')
    const excludeDirPatterns: string[] = shouldExcludeLocaleDirs ? nonRootLocaleKeys : []
    
    if (options.config?.debugPrint) {
      console.log(`[${pluginName}] Loading sidebar for locales:`, localeKeys.join(', '))
      console.log(`[${pluginName}] Found locale dirs:`, Array.from(localeDirs.keys()).join(', '))
      if (excludeDirPatterns.length > 0) {
        console.log(`[${pluginName}] Excluding locale dirs from root sidebar:`, excludeDirPatterns.join(', '))
      }
    }

    for (const localeKey of localeKeys) {
      if (localeKey === 'root') {
        sidebarResults['root'] = generateSidebarForLocale('root', srcDir, '/', options.config, excludeDirPatterns)
      } else {
        const localeDir = localeDirs.get(localeKey) || localeDirs.get(localeKey.replace(/-/g, '_'))
        
        if (localeDir) {
          sidebarResults[localeKey] = generateSidebarForLocale(
            localeKey, 
            localeDir, 
            `/${localeKey}/`, 
            options.config
          )
        } else {
          sidebarResults[localeKey] = generateSidebarForLocale(
            localeKey, 
            join(srcDir, localeKey), 
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

    const localeDirs = scanContentDirs(srcDir)
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
      
      if (previousData?.locales) {
        lastLocales = previousData.locales
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
        console.log(`[${pluginName}] Patching with sidebar data for ${Object.keys(localesWithSidebar).length} locales`)
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
      
      if (file.endsWith('.md') || file.endsWith('.markdown')) {
        const watchDirs = getWatchDirs()
        const normalizedFile = normalize(file).toLowerCase()
        const isWatched = watchDirs.some(dir => normalizedFile.startsWith(normalize(dir).toLowerCase()))

        if (!isWatched) {
          return false
        }

        if (options.config?.debugPrint) {
          console.log(`\n[${pluginName}] Markdown file changed: ${relative(process.cwd(), file)}`)
        }

        if (allPluginData?.['vite-plugin-horizon-i18n']?.locales) {
          lastLocales = allPluginData['vite-plugin-horizon-i18n'].locales
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
      
      return false
    }
  }
}
