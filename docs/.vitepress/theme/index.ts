import { h } from 'vue'
import type { Theme } from 'vitepress'
import horizonTheme from 'horizon-theme'
import 'virtual:group-icons.css'

export default {
  ...horizonTheme,
  Layout: () => {
    return h(horizonTheme.Layout, null, {})
  }
} satisfies Theme