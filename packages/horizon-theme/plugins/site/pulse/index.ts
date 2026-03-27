import type { Plugin, ResolvedConfig } from 'vite'
import type { PulsePluginOptions, DiscoveredPaths, PulsePatchContext, PulsePatchResult } from './types'
import { parse } from 'acorn'
import MagicString from 'magic-string'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const DEFAULT_SITE_DATA_ID = '@siteData'
const HMR_EVENT_PREFIX = 'horizon:pulse:'

function walkAst(ast: any, callback: (node: any, parent: any, key: string, index: number) => void) {
  const visit = (node: any, parent: any = null, key: string = '', index: number = -1) => {
    if (!node || typeof node !== 'object') return
    
    callback(node, parent, key, index)
    
    for (const k in node) {
      const child = node[k]
      if (Array.isArray(child)) {
        child.forEach((c, i) => visit(c, node, k, i))
      } else if (child && typeof child === 'object' && child.type) {
        visit(child, node, k, -1)
      }
    }
  }
  visit(ast)
}

function discoverPaths(config: ResolvedConfig): DiscoveredPaths {
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

function getWatchFiles(options: PulsePluginOptions): string[] {
  if (!options.watchFiles) return []
  
  if (typeof options.watchFiles === 'function') {
    return options.watchFiles(options)
  }
  
  return options.watchFiles
}

function scanDirectory(dir: string, extensions: string[]): string[] {
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

export function createPulsePlugin(userOptions: PulsePluginOptions): Plugin {
  const pluginName = userOptions.name || 'horizon-pulse'
  const hmrEventName = HMR_EVENT_PREFIX + pluginName.replace(/[^a-zA-Z0-9]/g, '-')
  
  let config: ResolvedConfig
  let paths: DiscoveredPaths
  let currentData: any = null
  let server: any
  
  const debug = userOptions.debug || false
  const log = (...args: any[]) => {
    if (debug) console.log(`[${pluginName}]`, ...args)
  }

  return {
    name: pluginName,
    enforce: 'post',

    config() {
      return {
        optimizeDeps: {
          exclude: ['vitepress']
        }
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig
      paths = discoverPaths(config)
      log('Discovered paths:', paths)
    },

    resolveId(id) {
      if (id === `virtual:${pluginName}`) {
        return id
      }
      if (id === 'virtual:horizon-pulse-client') {
        return id
      }
      return null
    },

    load(id) {
      if (id === `virtual:${pluginName}`) {
        return `export const dataRef = null`
      }
      if (id === 'virtual:horizon-pulse-client') {
        return `
import { shallowRef } from 'vue'

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        target[key] = deepMerge({ ...target[key] }, source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

export function createHmrHandler(hmrEventName, initialData) {
  const dataRef = shallowRef(initialData)
  
  if (import.meta.hot) {
    import.meta.hot.on(hmrEventName, (newData) => {
      console.log('[horizon-pulse] 🔥 HMR received:', hmrEventName, newData)
      const current = dataRef.value
      if (current && newData) {
        const merged = deepMerge({ ...current }, newData)
        dataRef.value = merged
        console.log('[horizon-pulse] ✅ Data updated')
      }
    })
  }
  
  return { dataRef }
}

export function setGlobalDataRef(ref) {
  // no-op for now
}
`
      }
      return null
    },

    async transform(code, id) {
      if (id.includes('data') && id.includes('vitepress')) {
        log('Checking file:', id)
      }
      
      if (id === paths.siteDataRequestPath) {
        const ast = parse(code, {
          ecmaVersion: 'latest',
          sourceType: 'module'
        })
        
        const s = new MagicString(code)
        let exportNode: any = null
        
        walkAst(ast, (node) => {
          if (node.type === 'ExportDefaultDeclaration') {
            exportNode = node
          }
        })
        
        if (!exportNode) return null
        
        const originalExpr = code.substring(exportNode.declaration.start, exportNode.declaration.end)
        
        let patchResult: any = null
        
        if (userOptions.patch) {
          try {
            patchResult = await userOptions.patch({
              originalData: null,
              code: originalExpr,
              id
            })
          } catch (error) {
            console.error(`[${pluginName}] Patch error:`, error)
            return null
          }
        }
        
        s.prepend(`import { createHmrHandler, setGlobalDataRef } from 'virtual:horizon-pulse-client';
`)
        
        const wrappedCode = `const __original__ = ${originalExpr};
${patchResult?.code || ''}
const __patchedData__ = ${patchResult?.data ? `(() => {
  const __base__ = __original__;
  const __patch__ = ${JSON.stringify(patchResult.data)};
  
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null
        ) {
          target[key] = deepMerge({ ...target[key] }, source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
  
  if (__base__ && __patch__) {
    deepMerge(__base__, __patch__);
  }
  return __base__;
})()` : '__original__'}

const __handler__ = createHmrHandler('${hmrEventName}', __patchedData__)
export const siteDataRef = __handler__.dataRef
setGlobalDataRef(siteDataRef)

export default __patchedData__`
        
        s.overwrite(exportNode.start, exportNode.end, wrappedCode)
        
        currentData = patchResult?.data || {}
        
        const finalCode = s.toString()
        log('Site data transformed')
        
        return {
          code: finalCode,
          map: s.generateMap()
        }
      }

      if (paths.dataModulePattern.test(id)) {
        log('Data module matched:', id)
        log('Pattern:', paths.dataModulePattern)
        if (code.includes('@siteData') && code.includes('siteDataRef')) {
          const ast = parse(code, {
            ecmaVersion: 'latest',
            sourceType: 'module'
          })
          
          const s = new MagicString(code)
          let hasTransform = false
          let siteDataRefDecl: any = null
          
          walkAst(ast, (node, parent) => {
            if (node.type === 'ImportDeclaration' && 
                node.source?.value === '@siteData') {
              const specifier = node.specifiers?.[0]
              if (specifier?.type === 'ImportDefaultSpecifier' && 
                  specifier.local?.name === 'siteData') {
                s.overwrite(
                  node.start, 
                  node.end, 
                  `import { siteDataRef as __pulse_siteDataRef__ } from '@siteData'`
                )
                hasTransform = true
              }
            }
            
            if (node.type === 'VariableDeclaration' && parent?.type === 'ExportNamedDeclaration') {
              for (const decl of node.declarations || []) {
                if (decl.id?.type === 'Identifier' && 
                    decl.id.name === 'siteDataRef' &&
                    decl.init?.type === 'CallExpression' &&
                    decl.init.callee?.name === 'shallowRef') {
                  siteDataRefDecl = { node, parent, decl }
                }
              }
            }
          })
          
          if (siteDataRefDecl) {
            s.overwrite(
              siteDataRefDecl.parent.start,
              siteDataRefDecl.parent.end,
              `export const siteDataRef = __pulse_siteDataRef__`
            )
            hasTransform = true
          }
          
          if (hasTransform) {
            log('Data module transformed')
            return {
              code: s.toString(),
              map: s.generateMap()
            }
          }
        }
      }

      return null
    },

    async hotUpdate(ctx) {
      const { file } = ctx
      
      if (userOptions.onHotUpdate) {
        const result = await userOptions.onHotUpdate({
          file,
          server,
          currentData
        })
        
        const shouldUpdate = typeof result === 'boolean' ? result : result?.shouldUpdate
        const newData = typeof result === 'boolean' ? null : result?.newData
        
        if (shouldUpdate) {
          if (newData) {
            currentData = newData
          }
          
          const module = server.moduleGraph.getModuleById(paths.siteDataRequestPath)
          if (module) {
            server.moduleGraph.invalidateModule(module)
          }
          
          server.ws.send({
            type: 'custom',
            event: hmrEventName,
            data: currentData
          })
          
          log('HMR event sent')
        }
        
        return []
      }
      
      const watchFiles = getWatchFiles(userOptions)
      if (watchFiles.some(f => file === f || file.endsWith(f))) {
        const module = server.moduleGraph.getModuleById(paths.siteDataRequestPath)
        if (module) {
          server.moduleGraph.invalidateModule(module)
        }
        
        server.ws.send({
          type: 'custom',
          event: hmrEventName,
          data: currentData
        })
        
        log('HMR event sent for file:', file)
        
        return []
      }
      
      return undefined
    },

    configureServer(_server) {
      server = _server
      
      const watchFiles = getWatchFiles(userOptions)
      watchFiles.forEach(file => {
        server.watcher.add(file)
      })
      
      if (server.httpServer) {
        server.httpServer.once('listening', () => {
          log('Pulse enabled, watching', watchFiles.length, 'files')
        })
      }
    }
  }
}

export { scanDirectory }
export type { PulsePluginOptions, PulsePatchContext, PulsePatchResult }
