import { defineConfig } from 'vitepress'
import { defineHorizonConfig } from 'horizon-theme/config'
import { uniIconsPlugin, uniIconsMarkdown } from '@roidmc/vitepress-uni-icons'

export default defineConfig(defineHorizonConfig({
  srcDir: "content",
  locales: {
    root: {
      label: 'English',
      lang: 'en-US'
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN'
    }
  },

  markdown: {
    config(md) {
      uniIconsMarkdown(md)
    },
    container: {
      infoLabel: "INFO",
      noteLabel: "NOTE",
      tipLabel: "TIP",
      warningLabel: "WARNING",
      dangerLabel: "DANGER",
      importantLabel: "IMPORTANT",
      cautionLabel: "CAUTION",
      detailsLabel: "Details",
    }
  },

  vite: {
    plugins: [
      uniIconsPlugin() as any,
    ],
  },

  title: "Horizon Theme - VitePress",
  description: "A VitePress Site",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    search: {
      provider: 'local'
    },

    features: {
      linkIcon: {
        enable: true,
        style: 'favicon'
      },
      externalLinkGuard: {
        enable: true,
        whitelist: ['github.com']
      },
      imgViewer:{
        enable: true
      }
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
}))
