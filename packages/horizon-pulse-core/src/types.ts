/**
 * 补丁上下文对象
 */
export interface PulsePatchContext {
  originalData: any
  code: string
  id: string
  previousData?: any
}

/**
 * 补丁结果对象
 */
export interface PulsePatchResult {
  data?: any
  code?: string
}

/**
 * 热更新结果对象
 */
export interface PulseHotUpdateResult {
  shouldUpdate: boolean
  newData?: any
}

/**
 * Pulse 插件配置选项
 */
export interface PulsePluginOptions {
  name?: string
  priority?: number
  
  patch?(ctx: PulsePatchContext): PulsePatchResult | null | Promise<PulsePatchResult | null>
  
  onHotUpdate?(ctx: {
    file: string
    server: any
    currentData: any
    allPluginData?: Record<string, any>
  }): boolean | PulseHotUpdateResult | Promise<boolean | PulseHotUpdateResult>
  
  watchFiles?: string[] | ((options: PulsePluginOptions) => string[])
  
  debug?: boolean
}

/**
 * Pulse 客户端配置选项
 */
export interface PulseClientOptions {
  hmrEventName: string
}

/**
 * 发现的路径信息
 */
export interface DiscoveredPaths {
  siteDataId: string
  siteDataRequestPath: string
  dataModulePattern: RegExp
}
