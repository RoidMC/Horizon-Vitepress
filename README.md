# Horizon Vitepress

> The VitePress Enhanced Ecosystem - A Framework Built on VitePress

## The Story

Horizon started with a simple goal: **change the design of a wiki**. 

When we tried Starlight, we found it too difficult to customize. So we turned to VitePress. But soon we realized VitePress lacked the dynamic capabilities we needed. Instead of giving up, we built:

1. **PulseCore** - An AOP-based injection system that hijacks VitePress's `siteData` to enable true dynamic HMR
2. **Enhanced Plugins** - Sidebar, i18n, and theme plugins with runtime capabilities
3. **A Complete Framework** - What started as a theme became a full-featured framework

### What Makes Horizon Different?

| Feature | VitePress | Horizon |
|---------|-----------|---------|
| Config Changes | Restart required | **Instant HMR** |
| Sidebar | Manual config | **Auto-generated with YAML** |
| Plugin System | Static | **Dynamic with PulseCore** |
| i18n | Basic | **Enhanced with auto-detection** |

### The "Table Flip" Moment

Horizon doesn't just extend VitePress - it **breaks its limitations**:

- **Before**: Change config → restart → wait → see result
- **After**: Change config → instant update (milliseconds)

This is made possible by PulseCore's AOP injection, which is unique in the VitePress ecosystem.

## Packages

| Package | Description |
|---------|-------------|
| [@roidmc/horizon-pulse-core](./packages/horizon-pulse-core) | Plugin system & HMR solution - The core engine |
| [@roidmc/horizon-theme](./packages/horizon-theme) | Modern theme with i18n & sidebar - The framework |

## Features

### PulseCore
- AOP injection into VitePress internals
- Dynamic `siteData` hijacking
- True hot module replacement for config changes
- Plugin API for extending VitePress

### Sidebar Plugin
- Auto-generation from file structure
- YAML configuration (`.sidebar.yml`)
- Centralized child directory config (`children` field)
- Flatten, independent, and multi-locale support
- Docusaurus-like experience

### Theme Plugins
- Link icons with favicon support
- External link guard
- Customizable and extensible

## Quick Start

```ts
import { defineConfig } from 'vitepress'
import { defineHorizonConfig } from '@roidmc/horizon-theme/config'

export default defineConfig(
  defineHorizonConfig({
    title: 'My Docs',
    
    // Auto sidebar generation
    sidebar: {
      collapsed: true,
      useTitleFromFileHeading: true,
    },
    
    // Theme features
    features: {
      linkIcon: {
        enable: true,
        excludeDomains: ['github.com'],
      },
    },
  })
)
```

## Requirements

- VitePress `2.0.0-alpha.5`+
- Vue `3.x`
- Node.js `22`+

## License

2026 © [RoidMC Studios](https://www.roidmc.com) | [MPL-2.0 License](./LICENSE)

<!--
Ciallo～(∠・ω )⌒☆
-->
