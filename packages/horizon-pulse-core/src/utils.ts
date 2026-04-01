import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

/**
 * 递归扫描目录，返回指定扩展名的文件列表
 * @param dir - 要扫描的目录路径
 * @param extensions - 要包含的文件扩展名列表（例如 ['.ts', '.js']）
 * @returns 匹配的文件路径数组
 */
export function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  
  try {
    const entries = readdirSync(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      try {
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          files.push(...scanDirectory(fullPath, extensions))
        } else if (stat.isFile()) {
          const ext = extname(entry)
          if (extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  
  return files
}

/**
 * 深度合并两个对象
 * @param target - 目标对象
 * @param source - 源对象
 * @returns 合并后的新对象
 */
export function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target
  if (!target || typeof target !== 'object') return source
  
  const result = { ...target }
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = deepMerge({ ...result[key] }, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  return result
}
