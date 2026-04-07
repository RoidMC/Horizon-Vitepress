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

### Custom Layout and enhanceApp

If you customize the `enhanceApp` function, you must call the theme's `enhanceApp` to ensure all theme plugins work correctly:

```typescript
// .vitepress/theme/index.ts
import { h } from 'vue'
import type { Theme } from 'vitepress'
import horizonTheme from '@roidmc/horizon-theme'

export default {
  ...horizonTheme,
  Layout: () => {
    return h(horizonTheme.Layout, null, {})
  },
  async enhanceApp(ctx) {
    // IMPORTANT: Call the theme's enhanceApp first to initialize plugins
    if (horizonTheme.enhanceApp) {
      await horizonTheme.enhanceApp(ctx)
    }

    // Then your custom logic
    const { app, router } = ctx
    app.component('YourCustomComponent', YourCustomComponent)
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

### Plugin Enablement

**Site Plugins** use selective registration - they are only enabled when their configuration key is present in `defineHorizonConfig()`:

| Plugin | Config Key | Description |
|--------|-----------|-------------|
| `i18n` | `i18n: {}` | Internationalization with YAML support |
| `sidebar` | `sidebar: {}` | Auto-generated sidebar from file structure |

Example - to enable only the sidebar plugin:
```typescript
export default defineHorizonConfig({
  sidebar: {}  // Sidebar enabled, i18n disabled
})
```

**Theme Plugins** are always enabled when configured in `themeConfig.features`:

| Plugin | Config Key | Description |
|--------|-----------|-------------|
| `linkIcon` | `features.linkIcon` | Add icon to external links |
| `externalLinkGuard` | `features.externalLinkGuard` | Guard external links with confirmation dialog |
| `imgViewer` | `features.imgViewer` | Image viewer with FancyBox |
| `easterEgg` | `features.easterEgg` | Easter egg functionality |
| `metaGenerator` | `features.metaGenerator` | Add meta generator tag |

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
