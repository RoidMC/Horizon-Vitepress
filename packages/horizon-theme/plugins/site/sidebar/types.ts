import type { DefaultTheme } from 'vitepress'

export interface SidebarOptions {
  documentRootPath?: string
  scanStartPath?: string
  resolvePath?: string
  basePath?: string
  collapsed?: boolean | null
  collapseDepth?: number
  hyphenToSpace?: boolean
  underscoreToSpace?: boolean
  capitalizeFirst?: boolean
  capitalizeEachWords?: boolean
  includeRootIndexFile?: boolean
  includeFolderIndexFile?: boolean
  useTitleFromFileHeading?: boolean
  useTitleFromFrontmatter?: boolean
  useFolderTitleFromIndexFile?: boolean
  useFolderLinkFromIndexFile?: boolean
  useFolderLinkFromSameNameSubFile?: boolean
  includeDotFiles?: boolean
  folderLinkNotIncludesFileName?: boolean
  includeEmptyFolder?: boolean
  sortMenusByName?: boolean
  sortMenusByFrontmatterOrder?: boolean
  sortMenusByFrontmatterDate?: boolean
  sortMenusByFileDatePrefix?: boolean
  sortMenusOrderByDescending?: boolean
  sortMenusOrderNumericallyFromTitle?: boolean
  sortMenusOrderNumericallyFromLink?: boolean
  sortFolderTo?: null | 'top' | 'bottom'
  keepMarkdownSyntaxFromTitle?: boolean
  debugPrint?: boolean
  manualSortFileNameByPriority?: string[]
  excludeByFolderDepth?: number
  excludeByGlobPattern?: string[]
  excludeFilesByFrontmatterFieldName?: string
  excludeByVitePressSidebarFalse?: boolean
  followSymlinks?: boolean
  removePrefixAfterOrdering?: boolean
  prefixSeparator?: string | RegExp
  rootGroupText?: string
  rootGroupLink?: string
  rootGroupCollapsed?: boolean | null
  frontmatterOrderDefaultValue?: number
  frontmatterTitleFieldName?: string
  hmr?: boolean
  excludeLocaleDirs?: boolean | 'auto'
}

export type Sidebar = DefaultTheme.Sidebar
export type SidebarItem = DefaultTheme.SidebarItem
export type SidebarMulti = DefaultTheme.SidebarMulti

export interface SidebarListItem {
  [key: string]: any
}

export interface SortByObjectKeyOptions {
  arr: SidebarListItem
  key: string
  desc?: boolean
  numerically?: boolean
  datePrefixSeparator?: string | RegExp
  dateSortFromFrontmatter?: boolean
  dateSortFromTextWithPrefix?: boolean
}

export type AnyValueObject = { [key: string]: any }

export interface MultiLocaleSidebarOptions {
  [locale: string]: SidebarOptions | SidebarOptions[]
}

export interface AutoSidebarConfig extends SidebarOptions {
  locales?: MultiLocaleSidebarOptions
}
