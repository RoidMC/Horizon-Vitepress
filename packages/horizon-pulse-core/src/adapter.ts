import type { ResolvedConfig } from 'vite'
import type { DiscoveredPaths } from './types'
import { createRequire } from 'module'
import { cwd } from 'process'

function tryResolveVitePressVersion(): string | null {
  const tryPaths = [
    () => {
      const req = createRequire(cwd() + '/package.json')
      return req.resolve('vitepress/package.json')
    },
    () => {
      const req = createRequire(import.meta.url)
      return req.resolve('vitepress/package.json')
    }
  ]
  
  for (const tryPath of tryPaths) {
    try {
      const pkgPath = tryPath()
      const req = createRequire(pkgPath)
      return req(pkgPath).version
    } catch {}
  }
  return null
}

export interface VitePressAdapter {
  minVersion: string
  maxVersion: string | null
  detectStrategies: Array<() => boolean | Promise<boolean>>
  discoverPaths(config: ResolvedConfig): DiscoveredPaths
}

const DEFAULT_SITE_DATA_ID = '@siteData'

function parseVersion(version: string): { numbers: number[]; prerelease: string } {
  const [numPart, prePart] = version.split('-')
  const numbers = numPart.split('.').map(v => parseInt(v, 10) || 0)
  const prerelease = prePart || ''
  return { numbers, prerelease }
}

function comparePrerelease(a: string, b: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  
  const aParts = a.split('.')
  const bParts = b.split('.')
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const ap = aParts[i] || ''
    const bp = bParts[i] || ''
    
    const aNum = parseInt(ap, 10)
    const bNum = parseInt(bp, 10)
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum > bNum ? 1 : -1
    } else {
      const cmp = ap.localeCompare(bp)
      if (cmp !== 0) return cmp
    }
  }
  
  return 0
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  
  for (let i = 0; i < Math.max(pa.numbers.length, pb.numbers.length); i++) {
    const na = pa.numbers[i] || 0
    const nb = pb.numbers[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  
  return comparePrerelease(pa.prerelease, pb.prerelease)
}

function isVersionInRange(version: string, min: string, max: string | null): boolean {
  if (compareVersions(version, min) < 0) return false
  if (max && compareVersions(version, max) > 0) return false
  return true
}

const v2Adapter: VitePressAdapter = {
  minVersion: '2.0.0-alpha.1',
  maxVersion: null,
  
  detectStrategies: [
    () => {
      const version = tryResolveVitePressVersion()
      if (!version) return false
      return isVersionInRange(version, '2.0.0-alpha.1', null)
    }
  ],
  
  discoverPaths(config: ResolvedConfig): DiscoveredPaths {
    const aliases = config.resolve?.alias || []
    let siteDataId = DEFAULT_SITE_DATA_ID
    let siteDataRequestPath = '/' + siteDataId
    
    for (const alias of aliases) {
      if (alias.find === DEFAULT_SITE_DATA_ID || alias.find === '/' + DEFAULT_SITE_DATA_ID) {
        siteDataRequestPath = alias.replacement || alias.find
        break
      }
    }
    
    return {
      siteDataId,
      siteDataRequestPath,
      dataModulePattern: /vitepress[\/\\].*[\/\\]data\.(ts|js)(\?|$)/
    }
  }
}

const adapters: VitePressAdapter[] = [v2Adapter]

export interface AdapterDetectionResult {
  adapter: VitePressAdapter
  version: string
}

export async function detectAdapter(): Promise<AdapterDetectionResult | null> {
  for (const adapter of adapters) {
    for (const strategy of adapter.detectStrategies) {
      try {
        const result = await strategy()
        if (result) {
          const version = tryResolveVitePressVersion()
          if (version) {
            return { adapter, version }
          }
        }
      } catch {
        continue
      }
    }
  }
  return null
}

export function getFallbackAdapter(): VitePressAdapter {
  return v2Adapter
}

export { isVersionInRange, compareVersions, parseVersion }
