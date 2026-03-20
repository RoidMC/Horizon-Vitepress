import { fileURLToPath } from 'node:url'

export const horizonViteConfig = {
  vite: {
    resolve: {
      alias: [
        {
          find: /.*\/VPButton\.vue$/,
          replacement: fileURLToPath(new URL('./horizon-ui/components/HorizonButton.vue', import.meta.url))
        },
        {
          find: /.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(new URL('./horizon-ui/components/HorizonFooter.vue', import.meta.url))
        },
        {
          find: /.*\/VPBadge\.vue$/,
          replacement: fileURLToPath(new URL('./horizon-ui/components/HorizonBadge.vue', import.meta.url))
        }
      ]
    }
  }
}
