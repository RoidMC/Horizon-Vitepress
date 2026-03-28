import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

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
