/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-FileCopyrightText: 2022 jooy2 (https://github.com/jooy2/vitepress-sidebar)
 *  SPDX-License-Identifier: MPL-2.0
 */

import { readFileSync, existsSync } from 'fs'
import matter from '@11ty/gray-matter'
import { parse as parseYaml } from 'yaml'
import type {
  AnyValueObject,
  SidebarItem,
  SidebarListItem,
  SortByObjectKeyOptions,
  SidebarOptions,
  SidebarYamlConfig
} from './types'

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function generateNotTogetherMessage(options: string[]): string {
  return `These options cannot be used together: ${options.join(', ')}`
}

export function getValueFromFrontmatter<T>(filePath: string, key: string, defaultValue: T): T {
  try {
    const fileData = readFileSync(filePath, 'utf-8')
    const { data } = matter(fileData)

    if (data?.[key]) {
      return data[key]
    }

    const lines = fileData.split('\n')
    let frontmatterStart = false

    for (let i = 0, len = lines.length; i < len; i += 1) {
      const str = lines[i].toString().replace('\r', '')

      if (/^---$/.test(str)) {
        frontmatterStart = true
      }
      if (new RegExp(`^${key}: (.*)`).test(str) && frontmatterStart) {
        return JSON.parse(str.replace(`${key}: `, '')) as T
      }
    }
  } catch {
    return defaultValue
  }
  return defaultValue
}

export function getOrderFromFrontmatter(filePath: string, defaultOrder: number): number {
  return parseFloat(getValueFromFrontmatter<string>(filePath, 'order', defaultOrder.toString()))
}

export function getDateFromFrontmatter(filePath: string): string {
  return getValueFromFrontmatter<string>(filePath, 'date', '0001-01-01')
}

export function getExcludeFromFrontmatter(
  filePath: string,
  excludeFrontmatterFieldName?: string,
  excludeByVitePressSidebarFalse?: boolean
): boolean {
  if (excludeFrontmatterFieldName) {
    const excluded = getValueFromFrontmatter<boolean>(filePath, excludeFrontmatterFieldName, false)
    if (excluded) return true
  }

  if (excludeByVitePressSidebarFalse !== false) {
    const sidebar = getValueFromFrontmatter<boolean | undefined>(filePath, 'sidebar', undefined)
    if (sidebar === false) return true
  }

  return false
}

export function formatTitle(
  options: SidebarOptions,
  title: string,
  fromTitleHeading = false
): string {
  const htmlTags: string[] = []
  const h1Headers: string[] = []
  const htmlPlaceholder = '\u0001'
  const h1Placeholder = '\u0002'
  let text = title

  text = text.replace(/<[^>]*>/g, (match) => {
    htmlTags.push(match)
    return htmlPlaceholder
  })
  text = text.replace(/^(#+.*)$/gm, (match) => {
    h1Headers.push(match)
    return h1Placeholder
  })

  if (fromTitleHeading && !options.keepMarkdownSyntaxFromTitle) {
    text = text.replace(/\*{1,2}([^*]+?)\*{1,2}/g, '$1')
    text = text.replace(/_{1,2}([^_]+?)_{1,2}/g, '$1')
    text = text.replace(/~{1,2}([^~]+?)~{1,2}/g, '$1')
    text = text.replace(/`{1,3}([^`]+?)`{1,3}/g, '$1')
  }

  if (options.hyphenToSpace) {
    text = text.replace(/-/g, ' ')
  }
  if (options.underscoreToSpace) {
    text = text.replace(/_/g, ' ')
  }
  if (options.capitalizeEachWords) {
    let lastChar = ''

    for (let i = 0; i < text.length; i += 1) {
      if ((i === 0 || !/[a-zA-Z0-9]/.test(lastChar)) && /[a-z]/.test(text[i])) {
        text = text.slice(0, i) + text[i].toUpperCase() + text.slice(i + 1)
      }

      lastChar = text[i]
    }
  } else if (options.capitalizeFirst) {
    text = capitalizeFirst(text)
  }

  let h1Index = -1
  let htmlIndex = -1
  text = text.replace(new RegExp(h1Placeholder, 'g'), () => {
    h1Index += 1
    return h1Headers[h1Index]
  })
  text = text.replace(new RegExp(htmlPlaceholder, 'g'), () => {
    htmlIndex += 1
    return htmlTags[htmlIndex]
  })

  return text
}

export function getTitleFromMd(
  fileName: string,
  filePath: string,
  options: SidebarOptions,
  isDirectory: boolean,
  callbackTitleReceived?: () => void
): string {
  if (isDirectory) {
    return formatTitle(options, fileName)
  }

  if (options.useTitleFromFrontmatter) {
    let value = getValueFromFrontmatter<string | undefined>(
      filePath,
      options.frontmatterTitleFieldName || 'title',
      undefined
    )
    if (!value) {
      value = getValueFromFrontmatter<string | undefined>(filePath, 'title', undefined)
    }
    if (value) {
      callbackTitleReceived?.()
      return formatTitle(options, value)
    }
  }

  if (options.useTitleFromFileHeading) {
    try {
      const data = readFileSync(filePath, 'utf-8')
      const lines = data.split('\n')

      let inFrontmatter = false
      let frontmatterEnded = false

      for (let i = 0, len = lines.length; i < len; i += 1) {
        let str = lines[i].toString().replace('\r', '')

        if (!frontmatterEnded) {
          if (str === '---') {
            if (!inFrontmatter) {
              inFrontmatter = true
              continue
            } else {
              frontmatterEnded = true
              inFrontmatter = false
              continue
            }
          }
          if (inFrontmatter) {
            continue
          }
        }

        if (/^# /.test(str)) {
          str = str.replace(/^# /, '')

          if (/\[(.*)]\(.*\)/.test(str)) {
            const execValue = /(.*)?\[(.*)]\((.*)\)(.*)?/.exec(str) || ''

            str =
              execValue.length > 0
                ? `${execValue[1] || ''}${execValue[2] || ''}${execValue[4] || ''}`
                : ''
          }

          callbackTitleReceived?.()
          return formatTitle(options, str, true)
        }
      }
    } catch (e) {
      if (options.debugPrint) {
        console.warn(`[sidebar] Failed to read title from ${filePath}:`, e)
      }
      return 'Unknown'
    }
  }

  return formatTitle(options, fileName.replace(/\.md$/, ''))
}

export function sortByFileTypes(
  arrItems: SidebarListItem,
  sortFolderTo: 'top' | 'bottom'
): object[] {
  for (let i = 0; i < arrItems.length; i += 1) {
    if (arrItems[i].items && arrItems[i].items.length) {
      arrItems[i].items = sortByFileTypes(arrItems[i].items, sortFolderTo)
    }
  }

  const itemFolders = arrItems.filter((item: SidebarItem) => Object.hasOwn(item, 'items'))
  const itemFiles = arrItems.filter((item: SidebarItem) => !Object.hasOwn(item, 'items'))

  if (sortFolderTo === 'top') {
    return [...itemFolders, ...itemFiles]
  }

  return [...itemFiles, ...itemFolders]
}

export function sortByObjectKey(options: SortByObjectKeyOptions): object[] {
  for (let i = 0; i < options.arr.length; i += 1) {
    if (options.arr[i].items && options.arr[i].items.length) {
      options.arr[i].items = sortByObjectKey({
        ...options,
        arr: options.arr[i].items
      })
    }
  }

  const basicCollator = new Intl.Collator([], {
    numeric: options.numerically,
    sensitivity: 'base'
  })
  let result

  if (options.dateSortFromFrontmatter) {
    result = options.arr.sort(
      (a: SidebarListItem, b: SidebarListItem) =>
        new Date(a[options.key]).valueOf() - new Date(b[options.key]).valueOf()
    )

    if (options.desc) {
      result = result.reverse()
    }
  } else if (options.dateSortFromTextWithPrefix) {
    const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}/g

    result = options.arr.sort((a: SidebarListItem, b: SidebarListItem) => {
      const aDate = a[options.key].split(dateRegex)?.[0]
      const bDate = b[options.key].split(dateRegex)?.[0]

      return new Date(aDate).valueOf() - new Date(bDate).valueOf()
    })

    if (options.desc) {
      result = result.reverse()
    }
  } else {
    result = options.arr.sort((a: SidebarListItem, b: SidebarListItem) => {
      const compareResult = basicCollator.compare(a[options.key], b[options.key])

      return options.desc ? -compareResult : compareResult
    })
  }

  return result
}

export function deepDeleteKey(obj: SidebarListItem, key: string): void {
  if (typeof obj !== 'object' || obj === null) {
    return
  }

  if (Object.hasOwn(obj, key)) {
    delete obj[key]
  }

  Object.keys(obj).forEach((item) => {
    if (typeof obj[item] === 'object') {
      deepDeleteKey(obj[item], key)
    }
  })
}

export function removePrefixFromTitleAndLink(
  sidebarList: SidebarListItem,
  options: SidebarOptions
): SidebarListItem {
  const sidebarListLength = sidebarList.length

  for (let i = 0; i < sidebarListLength; i += 1) {
    const obj = sidebarList[i]

    for (let j = 0; j < Object.keys(obj).length; j += 1) {
      const key = Object.keys(obj)[j]

      if (key === 'text') {
        if (
          !(
            !(options.prefixSeparator instanceof RegExp) &&
            obj[key].indexOf(options.prefixSeparator as string) === -1
          )
        ) {
          const splitItem = obj[key].split(options.prefixSeparator as string)

          splitItem.shift()

          obj[key] = splitItem.join(options.prefixSeparator as string)
        }
      } else if (key === 'items') {
        obj[key] = removePrefixFromTitleAndLink(obj[key], options)
      }
    }
  }

  return sidebarList
}

export function debugPrint(optionItems?: AnyValueObject, sidebarResult?: AnyValueObject): void {
  process.stdout.write(
    `\n${'='.repeat(50)}\n${JSON.stringify(optionItems, null, 2)}\n${'-'.repeat(
      50
    )}\n${JSON.stringify(sidebarResult, null, 2)}\n${'='.repeat(50)}\n\n`
  )
}

export function matchGlobPattern(filename: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '<<<DOUBLE_STAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLE_STAR>>>/g, '.*')
    return new RegExp(`^${regex}$`).test(filename)
  }
  return filename === pattern
}

export function loadSidebarYamlConfig(dirPath: string): SidebarYamlConfig | null {
  const yamlPath = `${dirPath}/.sidebar.yml`

  if (!existsSync(yamlPath)) {
    return null
  }

  try {
    const content = readFileSync(yamlPath, 'utf-8')
    const config = parseYaml(content) as SidebarYamlConfig | null | undefined
    return config || null
  } catch (error) {
    console.warn(`[sidebar] Failed to parse .sidebar.yml at ${yamlPath}:`, error)
    return null
  }
}

export function unwrapFirstLevel(items: SidebarItem[]): SidebarItem[] {
  const result: SidebarItem[] = []

  for (const item of items) {
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      /** 保留包含 link 的子项 - 但是不确定有没有用，先注释掉
      if (item.link) {
        result.push({
          text: item.text,
          link: item.link
        })
      } */
      result.push(...item.items)
    } else if (item.link) {
      result.push(item)
    }
  }

  return result
}

export function flattenSidebarItems(items: SidebarItem[]): SidebarItem[] {
  const result: SidebarItem[] = []

  for (const item of items) {
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      /** 保留包含 link 的子项 - 但是不确定有没有用，先注释掉
      if (item.link) {
        result.push({
          text: item.text,
          link: item.link
        })
      } */
      result.push(...flattenSidebarItems(item.items))
    } else if (item.link) {
      result.push({
        text: item.text,
        link: item.link
      })
    }
  }

  return result
}
