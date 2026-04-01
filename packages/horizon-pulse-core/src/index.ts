import type { Plugin, ResolvedConfig } from 'vite'
import type { PulsePluginOptions, DiscoveredPaths, PulsePatchContext, PulsePatchResult } from './types'
import { parse } from 'acorn'
import MagicString from 'magic-string'
import { scanDirectory, deepMerge } from './utils'

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

/**
 * 创建单个 Pulse 插件
 * @param userOptions - 插件配置选项
 * @returns Vite 插件实例
 */
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
  if (!target || typeof source !== 'object') return source;
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = deepMerge({ ...result[key] }, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

export function createHmrHandler(hmrEventName, initialData) {
  const dataRef = shallowRef(initialData)
  
  if (import.meta.hot) {
    import.meta.hot.on(hmrEventName, (newData) => {
      console.log('[horizon-pulse] 🔥 HMR received:', hmrEventName, newData)
      if (newData) {
        const merged = deepMerge(dataRef.value, newData)
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
  const __base__ = typeof __original__ === 'object' && __original__ !== null ? { ...__original__ } : __original__;
  const __patch__ = ${JSON.stringify(patchResult.data)};
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    if (!target || typeof source !== 'object') return source;
    const result = { ...target };
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) && typeof result[key] === 'object' && result[key] !== null) {
          result[key] = deepMerge({ ...result[key] }, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }
  return deepMerge(__base__, __patch__);
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
            currentData = deepMerge(currentData, newData)
          }
          
          const module = server.moduleGraph.getModuleById(paths.siteDataRequestPath)
          if (module) {
            server.moduleGraph.invalidateModule(module)
          }
          
          server.ws.send({
            type: 'custom',
            event: hmrEventName,
            data: {
              data: currentData,
              plugins: [pluginName]
            }
          })
          
          log(`🔥 HMR event sent for plugin: ${pluginName}`)
        }
        
        return []
      }
      
      const watchFiles = typeof userOptions.watchFiles === 'function' 
        ? userOptions.watchFiles(userOptions) 
        : userOptions.watchFiles || []
        
      if (watchFiles.some(f => file === f || file.endsWith(f))) {
        const module = server.moduleGraph.getModuleById(paths.siteDataRequestPath)
        if (module) {
          server.moduleGraph.invalidateModule(module)
        }
        
        server.ws.send({
          type: 'custom',
          event: hmrEventName,
          data: {
            data: currentData,
            plugins: [pluginName]
          }
        })
        
        log(`🔥 HMR event sent for plugin: ${pluginName}, file: ${file}`)
        
        return []
      }
      
      return undefined
    },

    configureServer(_server) {
      server = _server
      
      const watchFiles = typeof userOptions.watchFiles === 'function' 
        ? userOptions.watchFiles(userOptions) 
        : userOptions.watchFiles || []
        
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

/**
 * 创建多个 Pulse 插件的组合
 * @param plugins - 插件配置选项数组
 * @returns Vite 插件实例
 */
export function createMultiPulsePlugin(plugins: PulsePluginOptions[]): Plugin {
  const mainPluginName = 'horizon-pulse-hub'
  const hmrEventName = HMR_EVENT_PREFIX + 'hub'
  
  let config: ResolvedConfig
  let paths: DiscoveredPaths
  let server: any
  let currentData: Record<string, any> = {}
  let lastHmrFile: string = ''
  let lastHmrTime: number = 0

  const sortedPlugins = [...plugins].sort((a, b) => {
    const pa = a.priority ?? 100
    const pb = b.priority ?? 100
    return pa - pb
  })

  return {
    name: mainPluginName,
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
    },

    resolveId(id) {
      if (id === 'virtual:horizon-pulse-client') {
        return id
      }
      return null
    },

    load(id) {
      if (id === 'virtual:horizon-pulse-client') {
        return `
import { shallowRef } from 'vue'

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof source !== 'object') return source;
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = deepMerge({ ...result[key] }, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

export function createHmrHandler(hmrEventName, initialData) {
  const dataRef = shallowRef(initialData)
  
  if (import.meta.hot) {
    import.meta.hot.on(hmrEventName, (newData) => {
      const isEnhancedData = newData.data !== undefined && newData.plugins !== undefined
      const actualData = isEnhancedData ? newData.data : newData
      const updatedPlugins = isEnhancedData ? newData.plugins : []
      
      console.log('[horizon-pulse] 🔥 HMR received:', hmrEventName)
      
      if (actualData) {
        const merged = deepMerge(dataRef.value, actualData)
        dataRef.value = merged
        
        if (updatedPlugins.length > 0) {
          console.log('[horizon-pulse] 🔥 Updated plugins: [' + updatedPlugins.join(', ') + ']')
        }
        console.log('[horizon-pulse] ✅ Data updated')
      }
    })
  }
  
  return { dataRef }
}

export function setGlobalDataRef(ref) {}
`
      }
      return null
    },

    async transform(code, id) {
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
        
        let mergedData: any = {}
        let previousData: any = null
        
        for (const plugin of sortedPlugins) {
          if (plugin.patch) {
            try {
              const result = await plugin.patch({
                originalData: null,
                code: originalExpr,
                id,
                previousData
              })
              
              if (result?.data) {
                mergedData = deepMerge(mergedData, result.data)
                currentData[plugin.name || 'unknown'] = result.data
                previousData = deepMerge(previousData || {}, result.data)
              }
            } catch (error) {
              console.error(`[${plugin.name}] Patch error:`, error)
            }
          }
        }
        
        s.prepend(`import { createHmrHandler, setGlobalDataRef } from 'virtual:horizon-pulse-client';
`)
        
        const wrappedCode = `const __original__ = ${originalExpr};
const __patchedData__ = ${Object.keys(mergedData).length > 0 ? `(() => {
  const __base__ = typeof __original__ === 'object' && __original__ !== null ? { ...__original__ } : __original__;
  const __patch__ = ${JSON.stringify(mergedData)};
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    if (!target || typeof source !== 'object') return source;
    const result = { ...target };
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) && typeof result[key] === 'object' && result[key] !== null) {
          result[key] = deepMerge({ ...result[key] }, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }
  return deepMerge(__base__, __patch__);
})()` : '__original__'}

const __handler__ = createHmrHandler('${hmrEventName}', __patchedData__)
export const siteDataRef = __handler__.dataRef

export default __patchedData__`
        
        s.overwrite(exportNode.start, exportNode.end, wrappedCode)
        
        return {
          code: s.toString(),
          map: s.generateMap()
        }
      }

      if (paths.dataModulePattern.test(id)) {
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
      
      const now = Date.now()
      if (file === lastHmrFile && now - lastHmrTime < 100) {
        return undefined
      }
      lastHmrFile = file
      lastHmrTime = now
      
      let shouldUpdate = false
      let newData: any = {}
      let previousData: any = null
      const updatedPlugins: string[] = []
      
      for (const plugin of sortedPlugins) {
        if (plugin.onHotUpdate) {
          try {
            const result = await plugin.onHotUpdate({
              file,
              server,
              currentData: currentData[plugin.name || 'unknown'],
              allPluginData: currentData
            })
            
            const update = typeof result === 'boolean' ? result : result?.shouldUpdate
            
            if (update) {
              shouldUpdate = true
              const pluginData = typeof result === 'boolean' ? null : result?.newData
              const pluginName = plugin.name || 'unknown'
              updatedPlugins.push(pluginName)
              
              if (pluginData) {
                newData = deepMerge(newData, pluginData)
                currentData[pluginName] = pluginData
                previousData = deepMerge(previousData || {}, pluginData)
              }
            }
          } catch (error) {
            console.error(`[${plugin.name}] Hot update error:`, error)
          }
        }
      }
      
      if (shouldUpdate) {
        const module = server.moduleGraph.getModuleById(paths.siteDataRequestPath)
        if (module) {
          server.moduleGraph.invalidateModule(module)
        }
        
        server.ws.send({
          type: 'custom',
          event: hmrEventName,
          data: {
            data: newData,
            plugins: updatedPlugins
          }
        })
        
        console.log(`[${mainPluginName}] 🔥 HMR event sent - Updated plugins: [${updatedPlugins.join(', ')}]`)
      }
      
      return undefined
    },

    configureServer(_server) {
      server = _server
      
      for (const plugin of sortedPlugins) {
        if (plugin.watchFiles) {
          const watchFiles = typeof plugin.watchFiles === 'function' 
            ? plugin.watchFiles(plugin) 
            : plugin.watchFiles
            
          watchFiles.forEach(file => {
            server.watcher.add(file)
          })
        }
      }
      
      if (server.httpServer) {
        server.httpServer.once('listening', () => {
          console.log(`[${mainPluginName}] Multi-pulse enabled with ${sortedPlugins.length} plugins (sorted by priority)`)
        })
      }
    }
  }
}

export type { PulsePluginOptions, PulsePatchContext, PulsePatchResult, PulseHotUpdateResult, PulseClientOptions, DiscoveredPaths } from './types'
export { scanDirectory, deepMerge } from './utils'
