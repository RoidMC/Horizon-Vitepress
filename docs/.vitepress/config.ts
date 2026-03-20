import { defineConfig } from 'vitepress'
import { horizonViteConfig } from 'horizon-theme/config'

export default defineConfig({
  srcDir: "content",
  ...horizonViteConfig,
  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN', // 可选，将作为 `lang` 属性添加到 `html` 标签中
      link: '/zh-CN' // 默认 /zh-CN/ -- 显示在导航栏翻译菜单上，可以是外部的
    }
  },

  markdown: {
    container: {
      infoLabel: "INFO",      // 默认 "INFO"
      noteLabel: "NOTE",      // 默认 "NOTE"
      tipLabel: "TIP",       // 默认 "TIP"
      warningLabel: "WARNING",   // 默认 "WARNING"
      dangerLabel: "DANGER",    // 默认 "DANGER"
      importantLabel: "IMPORTANT",    // 默认 "IMPORTANT"
      cautionLabel: "CAUTION",   // 默认 "CAUTION"
      detailsLabel: "Details",    // 默认 "Details"
    }
  },

  title: "Horizon Theme - VitePress",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    search: {
      provider: 'local'
    },

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    editLink: {
      pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Made with ❤️',
      copyright: '© RoidMC Studios | Horizon Theme',
      hallowText: 'ROIDMC STUDIOS'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
