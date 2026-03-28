export interface PulsePatchContext {
  originalData: any
  code: string
  id: string
  previousData?: any
}

export interface PulsePatchResult {
  data?: any
  code?: string
}

export interface PulseHotUpdateResult {
  shouldUpdate: boolean
  newData?: any
}

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

export interface PulseClientOptions {
  hmrEventName: string
}

export interface DiscoveredPaths {
  siteDataId: string
  siteDataRequestPath: string
  dataModulePattern: RegExp
}
