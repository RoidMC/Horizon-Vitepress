# @roidmc/horizon-theme

> Horizon Theme - A modern VitePress theme
> Powered By @roidmc/horizon-pulse-core for dynamic configuration and HMR support.

## Installation

```bash
npm install @roidmc/horizon-theme
# or
yarn add @roidmc/horizon-theme
# or
pnpm add @roidmc/horizon-theme
```

## Usage

### Theme Setup

```typescript
// .vitepress/theme/index.ts
import { h } from 'vue'
import type { Theme } from 'vitepress'
import horizonTheme from '@roidmc/horizon-theme'

export default {
  ...horizonTheme,
  // Optional: Customize Layout component
  Layout: () => {
    return h(horizonTheme.Layout, null, {})
  }
} satisfies Theme
```

### Configuration

```typescript
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { defineHorizonConfig } from '@roidmc/horizon-theme/config'

export default defineConfig(defineHorizonConfig({
  // i18n plugin
  i18n: {
    debug: false
  },

  // sidebar plugin
  sidebar: {
    debugPrint: false,
    collapsed: true,
    useTitleFromFileHeading: true
  },

  themeConfig: {
    // Theme features
    features: {
      // External link icon
      linkIcon: {
        enable: true,
        style: 'favicon'
      },
      // External link guard
      externalLinkGuard: {
        enable: true,
        whitelist: ['github.com']
      },
      // Image viewer (FancyBox)
      imgViewer: {
        enable: true
      }
    },

    footer: {
      message: 'Made with ❤️',
      copyright: '© Your Company',
      hallowText: 'YOUR COMPANY'
    }
  }
}))
```

## Features

### Theme Plugins

| Plugin | Description |
|--------|-------------|
| `linkIcon` | Add icon to external links |
| `externalLinkGuard` | Guard external links with confirmation dialog |
| `imgViewer` | Image viewer with FancyBox |
| `easterEgg` | Easter egg functionality |
| `metaGenerator` | Add meta generator tag |

### Site Plugins (via Pulse Core)

| Plugin | Description |
|--------|-------------|
| `i18n` | Internationalization with YAML support |
| `sidebar` | Auto-generated sidebar from file structure |

## Customization

### Styles

Coming soon...

### Components

Coming soon...

## Requirements

- VitePress `2.0.0-alpha.5` or higher
- Vue 3.x
- Node.js `22` or higher

---

2026 © [RoidMC Studios](https://www.roidmc.com) | [MPL-2.0 License](./LICENSE)
<!--
Ciallo～(∠・ω )⌒☆
-->
