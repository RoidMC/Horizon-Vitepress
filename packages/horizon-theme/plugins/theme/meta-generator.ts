import type { ThemePluginFactory } from '../types'
import { definePlugin } from '../types'
import { inBrowser } from 'vitepress'

const HORIZON_META = 'Horizon Theme - Created by RoidMC Studios'

const factory: ThemePluginFactory = () => {
  return {
    name: 'meta-generator',
    enhanceApp() {
      if (!inBrowser) return

      const meta = document.createElement('meta')
      meta.name = 'generator'
      meta.content = HORIZON_META
      document.head.appendChild(meta)
    }
  }
}

export const metaGenerator = definePlugin({
  key: 'metaGenerator',
  factory
})
