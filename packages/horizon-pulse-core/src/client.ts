import { shallowRef, type Ref } from 'vue'

/**
 * HMR 处理器接口
 */
export interface HmrHandler {
  dataRef: Ref<any>
  update(newData: any): void
  dispose(): void
}

let globalDataRef: Ref<any> | null = null
let hmrHandlers: Map<string, HmrHandler> = new Map()

/**
 * 创建 HMR 处理器
 * @param hmrEventName - HMR 事件名称
 * @param initialData - 初始数据
 * @returns HMR 处理器实例
 */
export function createHmrHandler(
  hmrEventName: string,
  initialData: any
): HmrHandler {
  if (hmrHandlers.has(hmrEventName)) {
    return hmrHandlers.get(hmrEventName)!
  }
  
  const dataRef = shallowRef(initialData)
  
  const handler: HmrHandler = {
    dataRef,
    
    update(newData: any) {
      const current = dataRef.value
      if (!current || !newData) return
      
      const isEnhancedData = newData.data !== undefined && newData.plugins !== undefined
      const actualData = isEnhancedData ? newData.data : newData
      const updatedPlugins = isEnhancedData ? newData.plugins : []
      
      const merged = deepMerge({ ...current }, actualData)
      dataRef.value = merged
      
      if (updatedPlugins.length > 0) {
        console.log(`[horizon-pulse] 🔥 HMR received - Updated plugins: [${updatedPlugins.join(', ')}]`)
        console.log('[horizon-pulse] ✅ Data updated')
      } else {
        console.log('[horizon-pulse] 🔥 HMR received')
        console.log('[horizon-pulse] ✅ Data updated')
      }
    },
    
    dispose() {
      hmrHandlers.delete(hmrEventName)
    }
  }
  
  if (import.meta.hot) {
    import.meta.hot.on(hmrEventName, (newData: any) => {
      handler.update(newData)
    })
  }
  
  hmrHandlers.set(hmrEventName, handler)
  
  return handler
}

/**
 * 获取全局数据引用
 * @returns 全局数据引用或 null
 */
export function getGlobalDataRef(): Ref<any> | null {
  return globalDataRef
}

/**
 * 设置全局数据引用
 * @param ref - 要设置的数据引用
 */
export function setGlobalDataRef(ref: Ref<any>): void {
  globalDataRef = ref
}

function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        target[key] = deepMerge({ ...target[key] }, source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
  return target
}
