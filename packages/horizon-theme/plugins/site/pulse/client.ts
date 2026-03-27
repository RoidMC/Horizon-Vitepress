import { shallowRef, type Ref } from 'vue'

export interface HmrHandler {
  dataRef: Ref<any>
  update(newData: any): void
  dispose(): void
}

let globalDataRef: Ref<any> | null = null
let hmrHandlers: Map<string, HmrHandler> = new Map()

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
      
      const merged = deepMerge({ ...current }, newData)
      dataRef.value = merged
      console.log('[horizon-pulse] 🔥 Data updated:', newData)
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

export function getGlobalDataRef(): Ref<any> | null {
  return globalDataRef
}

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
