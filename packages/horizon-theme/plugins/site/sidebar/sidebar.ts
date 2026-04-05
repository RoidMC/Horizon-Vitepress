import { join, resolve } from 'path'
import { existsSync, readdirSync, statSync, lstatSync } from 'fs'
import type { Sidebar, SidebarItem, SidebarListItem, SidebarOptions, MultiLocaleSidebarOptions } from './types'
import {
  debugPrint,
  deepDeleteKey,
  generateNotTogetherMessage,
  getDateFromFrontmatter,
  getExcludeFromFrontmatter,
  getOrderFromFrontmatter,
  getTitleFromMd,
  removePrefixFromTitleAndLink,
  sortByFileTypes,
  sortByObjectKey,
  matchGlobPattern
} from './helper'

function isTrueMinimumNumberOfTimes(values: (boolean | undefined | null)[], times: number): boolean {
  let count = 0
  for (const v of values) {
    if (v === true) count++
  }
  return count >= times
}

function objMergeNewKey<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const result: Record<string, any> = { ...target }
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      result[key] = objMergeNewKey(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result as T
}

function scanDirectory(
  dir: string,
  options: SidebarOptions
): string[] {
  const excludePatterns = options.excludeByGlobPattern || []
  const includeDot = options.includeDotFiles || false
  const followSymlinks = options.followSymlinks || false

  try {
    const files = readdirSync(dir)
    return files.filter(file => {
      if (!includeDot && file.startsWith('.')) {
        return false
      }
      if (excludePatterns.length > 0) {
        for (const pattern of excludePatterns) {
          if (matchGlobPattern(file, pattern)) {
            return false
          }
          if (pattern.endsWith('/**') || pattern.endsWith('/*')) {
            const dirName = pattern.replace(/\/\*{1,2}$/, '')
            if (file === dirName) {
              return false
            }
          }
        }
      }
      return true
    })
  } catch {
    return []
  }
}

function generateSidebarItem(
  depth: number,
  currentDir: string,
  displayDir: string,
  parentName: string | null,
  options: SidebarOptions
): SidebarListItem {
  if (typeof options.excludeByFolderDepth === 'number' && options.excludeByFolderDepth <= depth) {
    return []
  }

  const directoryFiles = scanDirectory(currentDir, options)

  if (options.manualSortFileNameByPriority!.length > 0) {
    const needSortItem = directoryFiles.filter(
      (x) => options.manualSortFileNameByPriority?.indexOf(x) !== -1
    )
    const remainItem = directoryFiles.filter(
      (x) => options.manualSortFileNameByPriority?.indexOf(x) === -1
    )

    needSortItem.sort(
      (a, b) =>
        options.manualSortFileNameByPriority!.indexOf(a) -
        options.manualSortFileNameByPriority!.indexOf(b)
    )

    directoryFiles.length = 0
    directoryFiles.push(...needSortItem, ...remainItem)
  }

  let sidebarItems: SidebarListItem = directoryFiles
    .map((x: string) => {
      const childItemPath = resolve(currentDir, x)

      let childItemPathDisplay = `${displayDir}/${x}`.replace(/\/{2}/, '/').replace(/\\/g, '/')

      if (childItemPathDisplay.endsWith('/index.md')) {
        childItemPathDisplay = childItemPathDisplay.replace('index.md', '')
      } else {
        childItemPathDisplay = childItemPathDisplay.replace(/\.md$/, '')
      }

      if (options.documentRootPath && childItemPathDisplay.startsWith(options.documentRootPath)) {
        if (depth === 1) {
          childItemPathDisplay = childItemPathDisplay.replace(
            new RegExp(`^${options.documentRootPath}`, 'g'),
            ''
          )
        }

        if (options.scanStartPath) {
          const normalizedScanStartPath = options.scanStartPath.replace(/\\/g, '/')
          const escapedPath = normalizedScanStartPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          childItemPathDisplay = childItemPathDisplay.replace(
            new RegExp(`^/?${escapedPath}`, 'g'),
            ''
          )

          childItemPathDisplay = childItemPathDisplay.replace(/^\/(?!$)/g, '')

          if (childItemPathDisplay === '/') {
            childItemPathDisplay = 'index.md'
          }
          
          // 确保链接以 / 开头
          if (childItemPathDisplay && !childItemPathDisplay.startsWith('/')) {
            childItemPathDisplay = `/${childItemPathDisplay}`
          }
        } else if (!childItemPathDisplay.startsWith('/')) {
          childItemPathDisplay = `/${childItemPathDisplay}`
        }
      }

      if (!childItemPathDisplay) {
        childItemPathDisplay = 'index.md'
      }
      
      // 确保所有链接都以 / 开头
      if (childItemPathDisplay && !childItemPathDisplay.startsWith('/')) {
        childItemPathDisplay = `/${childItemPathDisplay}`
      }

      if (/\.vitepress/.test(childItemPath)) {
        return null
      }

      if (/node_modules/.test(childItemPath)) {
        return null
      }

      if (depth === 1 && x === 'index.md' && !options.includeRootIndexFile) {
        return null
      }

      if (depth !== 1 && x === 'index.md' && !options.includeFolderIndexFile) {
        return null
      }

      let stat
      try {
        stat = options.followSymlinks ? statSync(childItemPath) : lstatSync(childItemPath)
      } catch {
        return null
      }

      if (stat.isDirectory() || (options.followSymlinks && stat.isSymbolicLink())) {
        let directorySidebarItems =
          generateSidebarItem(depth + 1, childItemPath, childItemPathDisplay, x, options) || []

        let isTitleReceivedFromFileContent = false
        let newDirectoryText = getTitleFromMd(x, childItemPath, options, true, () => {
          isTitleReceivedFromFileContent = true
        })
        let newDirectoryPagePath = childItemPath
        let withDirectoryLink
        let isNotEmptyDirectory = false

        const indexFilePath = `${childItemPath}/index.md`
        const findSameNameSubFile = directorySidebarItems.find(
          (y: SidebarListItem) => y.text === x
        )

        if (options.useFolderLinkFromSameNameSubFile && findSameNameSubFile) {
          newDirectoryPagePath = resolve(childItemPath, `${findSameNameSubFile.text}.md`)
          newDirectoryText = getTitleFromMd(x, newDirectoryPagePath, options, false, () => {
            isTitleReceivedFromFileContent = true
          })

          if (options.folderLinkNotIncludesFileName) {
            withDirectoryLink = `${childItemPathDisplay}/`
          } else {
            withDirectoryLink = findSameNameSubFile.link
          }

          directorySidebarItems = directorySidebarItems.filter(
            (y: SidebarListItem) => y.text !== x
          )
        }

        if (existsSync(indexFilePath)) {
          if (options.includeFolderIndexFile) {
            isNotEmptyDirectory = true
          }

          if (options.useFolderLinkFromIndexFile) {
            isNotEmptyDirectory = true
            newDirectoryPagePath = indexFilePath
            withDirectoryLink = `${childItemPathDisplay}/index.md`
          }

          if (options.useFolderTitleFromIndexFile && !isTitleReceivedFromFileContent) {
            isNotEmptyDirectory = true
            newDirectoryPagePath = indexFilePath
            newDirectoryText = getTitleFromMd('index', newDirectoryPagePath, options, false)
          }
        }

        if (
          (withDirectoryLink && options.includeEmptyFolder !== false) ||
          options.includeEmptyFolder ||
          directorySidebarItems.length > 0 ||
          isNotEmptyDirectory
        ) {
          return {
            text: newDirectoryText,
            ...(withDirectoryLink ? { link: withDirectoryLink } : {}),
            ...(directorySidebarItems.length > 0 ? { items: directorySidebarItems } : {}),
            ...(options.collapsed === null ||
            options.collapsed === undefined ||
            directorySidebarItems.length < 1
              ? {}
              : { collapsed: depth >= options.collapseDepth! && options.collapsed }),
            ...(options.sortMenusByFrontmatterOrder
              ? {
                  order: getOrderFromFrontmatter(
                    newDirectoryPagePath,
                    options.frontmatterOrderDefaultValue!
                  )
                }
              : {}),
            ...(options.sortMenusByFrontmatterDate
              ? {
                  date: getDateFromFrontmatter(childItemPath)
                }
              : {})
          }
        }

        return null
      }

      if (childItemPath.endsWith('.md')) {
        if (getExcludeFromFrontmatter(childItemPath, options.excludeFilesByFrontmatterFieldName, options.excludeByVitePressSidebarFalse)) {
          return null
        }

        let childItemText
        const childItemTextWithoutExt = x.replace(/\.md$/, '')

        if (options.useFolderLinkFromSameNameSubFile && parentName === childItemTextWithoutExt) {
          childItemText = childItemTextWithoutExt
        } else {
          childItemText = getTitleFromMd(x, childItemPath, options, false)
        }

        return {
          text: childItemText,
          link: childItemPathDisplay,
          ...(options.sortMenusByFrontmatterOrder
            ? {
                order: getOrderFromFrontmatter(childItemPath, options.frontmatterOrderDefaultValue!)
              }
            : {}),
          ...(options.sortMenusByFrontmatterDate
            ? {
                date: getDateFromFrontmatter(childItemPath)
              }
            : {})
        }
      }
      return null
    })
    .filter((x) => x !== null)

  if (options.sortMenusByName) {
    sidebarItems = sortByObjectKey({
      arr: sidebarItems,
      key: 'text',
      desc: options.sortMenusOrderByDescending
    })
  }

  if (options.sortMenusByFileDatePrefix) {
    sidebarItems = sortByObjectKey({
      arr: sidebarItems,
      key: 'text',
      desc: options.sortMenusOrderByDescending,
      dateSortFromTextWithPrefix: true,
      datePrefixSeparator: options.prefixSeparator
    })
  }

  if (options.sortMenusByFrontmatterOrder) {
    sidebarItems = sortByObjectKey({
      arr: sidebarItems,
      key: 'order',
      desc: options.sortMenusOrderByDescending,
      numerically: true
    })

    deepDeleteKey(sidebarItems, 'order')
  }

  if (options.sortMenusByFrontmatterDate) {
    sidebarItems = sortByObjectKey({
      arr: sidebarItems,
      key: 'date',
      desc: options.sortMenusOrderByDescending,
      dateSortFromFrontmatter: true
    })

    deepDeleteKey(sidebarItems, 'date')
  }

  if (options.sortMenusOrderNumericallyFromTitle) {
    sidebarItems = sortByObjectKey({
      arr: sidebarItems,
      key: 'text',
      desc: options.sortMenusOrderByDescending,
      numerically: true
    })
  }

  if (options.sortMenusOrderNumericallyFromLink) {
    sidebarItems = sortByObjectKey({
      arr: sidebarItems,
      key: 'link',
      desc: options.sortMenusOrderByDescending,
      numerically: true
    })
  }

  if (options.sortFolderTo) {
    sidebarItems = sortByFileTypes(sidebarItems, options.sortFolderTo)
  }

  return sidebarItems
}

export function generateSidebar(
  options?: SidebarOptions | SidebarOptions[]
): Sidebar {
  const sidebar: Record<string, { base: string; items: SidebarItem[] }> = {}
  const isMultipleSidebars = Array.isArray(options)
  let enableDebugPrint = false
  let optionItems: (SidebarOptions | undefined)[]

  if (arguments.length > 1) {
    throw new Error(`You must pass 1 argument, see the documentation for details.`)
  }

  if (options === undefined) {
    optionItems = [{}]
  } else {
    optionItems = Array.isArray(options) ? options : [options]
  }

  for (let i = 0; i < optionItems.length; i += 1) {
    const optionItem = optionItems[i]!

    if (
      isTrueMinimumNumberOfTimes(
        [
          optionItem.sortMenusByFrontmatterOrder,
          optionItem.sortMenusByName,
          optionItem.sortMenusByFileDatePrefix
        ],
        2
      )
    ) {
      throw new Error(
        generateNotTogetherMessage([
          'sortMenusByFrontmatterOrder',
          'sortMenusByName',
          'sortMenusByFileDatePrefix'
        ])
      )
    }
    if (
      isTrueMinimumNumberOfTimes(
        [
          optionItem.sortMenusByFrontmatterOrder,
          optionItem.sortMenusOrderNumericallyFromTitle,
          optionItem.sortMenusOrderNumericallyFromLink
        ],
        2
      )
    ) {
      throw new Error(
        generateNotTogetherMessage([
          'sortMenusByFrontmatterOrder',
          'sortMenusOrderNumericallyFromTitle',
          'sortMenusOrderNumericallyFromLink'
        ])
      )
    }
    if (
      isTrueMinimumNumberOfTimes(
        [optionItem.sortMenusByFrontmatterOrder, optionItem.sortMenusByFrontmatterDate],
        2
      )
    ) {
      throw new Error(
        generateNotTogetherMessage(['sortMenusByFrontmatterOrder', 'sortMenusByFrontmatterDate'])
      )
    }
    if (optionItem.removePrefixAfterOrdering && !optionItem.prefixSeparator) {
      throw new Error(`'prefixSeparator' should not use empty string`)
    }

    if (optionItem.debugPrint && !enableDebugPrint) {
      enableDebugPrint = true
    }

    optionItem.documentRootPath = optionItem?.documentRootPath ?? '/'

    if (!/^\//.test(optionItem.documentRootPath)) {
      optionItem.documentRootPath = `/${optionItem.documentRootPath}`
    }

    if (optionItem.collapseDepth) {
      optionItem.collapsed = true
    }

    if (!optionItem.prefixSeparator) {
      optionItem.prefixSeparator = '.'
    }

    optionItem.collapseDepth = optionItem?.collapseDepth ?? 1
    optionItem.manualSortFileNameByPriority = optionItem?.manualSortFileNameByPriority ?? []
    optionItem.frontmatterOrderDefaultValue = optionItem?.frontmatterOrderDefaultValue ?? 0

    let scanPath = optionItem.documentRootPath

    if (optionItem.scanStartPath) {
      scanPath = `${optionItem.documentRootPath}/${optionItem.scanStartPath}`
        .replace(/\/{2,}/g, '/')
        .replace('/$', '')
        .replace(/\\/g, '/')
    }

    let sidebarResult: SidebarListItem = generateSidebarItem(
      1,
      join(process.cwd(), scanPath),
      scanPath.replace(/\\/g, '/'),
      null,
      optionItem
    )

    if (optionItem.removePrefixAfterOrdering) {
      sidebarResult = removePrefixFromTitleAndLink(sidebarResult, optionItem)
    }

    sidebar[optionItem.resolvePath || '/'] = {
      base: optionItem.basePath || optionItem.resolvePath || '/',
      items:
        sidebarResult?.items ||
        (optionItem.rootGroupText ||
        optionItem.rootGroupLink ||
        optionItem.rootGroupCollapsed === true ||
        optionItem.rootGroupCollapsed === false
          ? [
              {
                text: optionItem.rootGroupText,
                ...(optionItem.rootGroupLink ? { link: optionItem.rootGroupLink } : {}),
                items: sidebarResult as SidebarItem[],
                ...(optionItem.rootGroupCollapsed === null
                  ? {}
                  : { collapsed: optionItem.rootGroupCollapsed })
              }
            ]
          : (sidebarResult as SidebarItem[]))
    }
  }

  let sidebarResult: Sidebar

  // 对于多语言配置，始终返回对象格式
  if (isMultipleSidebars) {
    sidebarResult = sidebar
  } else if (Object.keys(sidebar).length === 1) {
    // 单一配置时返回数组格式
    sidebarResult = Object.values(sidebar)[0].items
  } else {
    sidebarResult = sidebar
  }

  if (enableDebugPrint) {
    debugPrint(optionItems, sidebarResult)
  }

  return sidebarResult
}

export function withSidebar<T extends { themeConfig?: { sidebar?: any } }>(
  vitePressOptions: T,
  sidebarOptions?: SidebarOptions | SidebarOptions[]
): T {
  let optionItems: (SidebarOptions | undefined)[]

  if (sidebarOptions === undefined) {
    optionItems = [{}]
  } else {
    optionItems = Array.isArray(sidebarOptions) ? sidebarOptions : [sidebarOptions]
  }

  let enableDebugPrint = false

  optionItems.forEach((optionItem) => {
    if (optionItem?.debugPrint && !enableDebugPrint) {
      enableDebugPrint = true
      optionItem.debugPrint = false
    }
  })

  const sidebarResult = {
    themeConfig: {
      sidebar: generateSidebar(sidebarOptions)
    }
  }

  if (vitePressOptions?.themeConfig?.sidebar) {
    vitePressOptions.themeConfig.sidebar = {}
  }

  const result = objMergeNewKey(vitePressOptions, sidebarResult) as T

  if (enableDebugPrint) {
    debugPrint(sidebarOptions, result)
  }

  return result
}

export function generateMultiLocaleSidebar(
  localeOptions: MultiLocaleSidebarOptions,
  defaultLocale?: string
): Record<string, any> {
  const locales: Record<string, any> = {}

  for (const [locale, options] of Object.entries(localeOptions)) {
    const localeKey = locale === defaultLocale ? 'root' : locale
    const sidebar = generateSidebar(options)

    locales[localeKey] = {
      themeConfig: {
        sidebar
      }
    }
  }

  return locales
}
