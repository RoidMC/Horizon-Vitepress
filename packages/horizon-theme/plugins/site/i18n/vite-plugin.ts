import type { Plugin, ResolvedConfig } from 'vite'
import type { I18nPluginConfig } from './types'
import { createI18nCore } from './core'
import { resolve, basename, join, extname } from 'node:path'
import { readdirSync, statSync } from 'node:fs'

const SITE_DATA_REQUEST_PATH = '/@siteData'

/**
 * i18n Vite 插件
 * 支持热更新(HMR),修改 YML 文件后自动重启服务器
 */
export function i18nVitePlugin(options: I18nPluginConfig): Plugin {
  const pluginName = 'vite-plugin-horizon-i18n'
  let viteConfig: ResolvedConfig
  let i18nResults: any = null
  
  /**
   * 加载 i18n 配置
   */
  function loadI18nConfig() {
    try {
      const i18nCore = createI18nCore(options)
      i18nResults = i18nCore.process({ userConfig: options.userConfig })
      
      if (options.debug) {
        console.log(`[${pluginName}] i18n config loaded`)
        if (i18nResults.vitepress?.locales) {
          console.log(`[${pluginName}] Locales:`, Object.keys(i18nResults.vitepress.locales).join(', '))
        }
      }
      
      return i18nResults
    } catch (error) {
      console.error(`[${pluginName}] Failed to load i18n config:`, error)
      return null
    }
  }
  
  /**
   * 递归获取目录中的所有 YML 文件
   */
  function getYmlFiles(dir: string, files: string[] = []): string[] {
    try {
      const entries = readdirSync(dir)
      
      for (const entry of entries) {
        const fullPath = join(dir, entry)
        try {
          const stat = statSync(fullPath)
          
          if (stat.isDirectory()) {
            getYmlFiles(fullPath, files)
          } else if (stat.isFile()) {
            const ext = extname(entry)
            if (ext === '.yml' || ext === '.yaml') {
              files.push(fullPath)
            }
          }
        } catch (error) {
          // 忽略无法访问的文件
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
    }
    
    return files
  }
  
  return {
    name: pluginName,
    enforce: 'pre',
    
    /**
     * 存储 Vite 配置
     */
    configResolved(config) {
      viteConfig = config
    },
    
    /**
     * 在配置阶段注入 i18n 配置
     */
    config() {
      // 初始加载
      const results = loadI18nConfig()
      
      if (!results?.vitepress) {
        return {}
      }
      
      // 返回空配置，YML 文件监听在 configureServer 中处理
      return {}
    },
    
    /**
     * 解析虚拟模块
     */
    resolveId(id) {
      if (id === 'virtual:horizon-i18n-config') {
        return id
      }
      return null
    },
    
    /**
     * 加载虚拟模块
     */
    load(id) {
      if (id === 'virtual:horizon-i18n-config') {
        if (!i18nResults?.vitepress) {
          return 'export default {}'
        }
        
        const { locales, themeConfig } = i18nResults.vitepress
        
        return `export default ${JSON.stringify({
          locales,
          themeConfig,
          full: i18nResults
        }, null, 2)}`
      }
      return null
    },
    
    /**
     * 转换 VitePress 配置
     */
    transform(code, id) {
      // 拦截 siteData 虚拟模块
      if (id === SITE_DATA_REQUEST_PATH) {
        if (!i18nResults?.vitepress) {
          return null
        }
        
        const { locales, themeConfig } = i18nResults.vitepress
        
        // 在 siteData 中注入 i18n 配置
        // 找到 export default 语句，在之前注入配置
        const exportDefaultIndex = code.indexOf('export default')
        if (exportDefaultIndex === -1) {
          return null
        }
        
        const beforeExport = code.substring(0, exportDefaultIndex)
        const afterExport = code.substring(exportDefaultIndex)
        
        // 修改 siteData 对象，合并 locales 和 themeConfig
        const modifiedCode = beforeExport + `
// Inject i18n configuration
const __i18nLocales__ = ${JSON.stringify(locales, null, 2)};
const __i18nThemeConfig__ = ${JSON.stringify(themeConfig, null, 2)};

// Merge i18n configuration into siteData
const __originalData__ = ${afterExport.replace('export default', '')};
if (__originalData__ && typeof __originalData__ === 'object') {
  if (__i18nLocales__) {
    __originalData__.locales = { ...__originalData__.locales, ...__i18nLocales__ };
  }
  if (__i18nThemeConfig__ && __originalData__.themeConfig) {
    Object.assign(__originalData__.themeConfig, __i18nThemeConfig__);
  }
}
export default __originalData__;
`
        
        return {
          code: modifiedCode,
          map: null
        }
      }
      
      // 拦截 VitePress 配置文件
      if (id.includes('.vitepress/config')) {
        if (!i18nResults?.vitepress) {
          return null
        }
        
        const { locales, themeConfig } = i18nResults.vitepress
        
        // 注入 i18n 配置到用户配置中
        const i18nConfigCode = `
;(() => {
  const i18nLocales = ${JSON.stringify(locales, null, 2)};
  const i18nThemeConfig = ${JSON.stringify(themeConfig, null, 2)};
  
  // 合并到全局配置
  if (typeof window !== 'undefined') {
    window.__HORIZON_I18N_LOCALES__ = i18nLocales;
    window.__HORIZON_I18N_THEME_CONFIG__ = i18nThemeConfig;
  }
})();
`
        
        return {
          code: code + '\n' + i18nConfigCode,
          map: null
        }
      }
      
      return null
    },
    
    /**
     * 热更新处理
     */
    async hotUpdate(ctx) {
      const { file, server } = ctx
      
      // 检查是否是 YML 文件
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        console.log(`\n[${pluginName}] File changed: ${file}`)
        
        // 重新加载配置
        console.log(`[${pluginName}] Reloading i18n configuration...`)
        const newResults = loadI18nConfig()
        
        if (newResults) {
          console.log(`[${pluginName}] i18n configuration reloaded successfully`)
          
          // 使 siteData 虚拟模块失效
          const siteDataModule = server.moduleGraph.getModuleById(SITE_DATA_REQUEST_PATH)
          if (siteDataModule) {
            server.moduleGraph.invalidateModule(siteDataModule)
          }
          
          // 使虚拟模块失效
          const virtualModule = server.moduleGraph.getModuleById('virtual:horizon-i18n-config')
          if (virtualModule) {
            server.moduleGraph.invalidateModule(virtualModule)
          }
          
          // 发送自定义事件到客户端，让客户端刷新页面
          server.ws.send({
            type: 'custom',
            event: 'i18n-update',
            data: newResults
          })
          
          // 触发全量重载
          server.ws.send({
            type: 'full-reload',
            path: '*'
          })
        }
        
        // 已经触发了 full-reload，不需要返回模块数组
        return []
      }
    },
    
    /**
     * 配置开发服务器
     */
    configureServer(server) {
      // 将 YML 文件添加到 watcher
      const ymlFiles = options.translateDir ? getYmlFiles(options.translateDir) : []
      ymlFiles.forEach(file => {
        server.watcher.add(file)
      })
      
      // 监听服务器启动
      if (server.httpServer) {
        server.httpServer.once('listening', () => {
          console.log(`[${pluginName}] i18n hot reload enabled`)
          console.log(`[${pluginName}] Watching ${ymlFiles.length} YML files in: ${options.translateDir}`)
        })
      }
      
      if (options.debug) {
        console.log(`[${pluginName}] i18n hot reload configured`)
        if (options.translateDir) {
          console.log(`[${pluginName}] Will watch for changes in: ${options.translateDir}`)
        }
      }
    }
  }
}

/**
 * 创建 i18n Vite 插件的工厂函数
 */
export function createI18nVitePlugin(config: I18nPluginConfig) {
  return i18nVitePlugin(config)
}
