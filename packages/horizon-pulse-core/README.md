# @roidmc/horizon-pulse-core

> ⚠️ **Alpha Release**: API may change. Used in production by Horizon Theme.

Horizon Pulse Core - A powerful plugin system for VitePress.

## Installation

```bash
npm install @roidmc/horizon-pulse-core
# or
yarn add @roidmc/horizon-pulse-core
# or
pnpm add @roidmc/horizon-pulse-core
```

## Usage

### Basic Usage

```typescript
import { createPulsePlugin } from '@roidmc/horizon-pulse-core'

const myPlugin = createPulsePlugin({
  name: 'my-plugin',
  patch(ctx) {
    // ctx.code contains the original siteData expression
    // ctx.id is the module id
    // ctx.previousData contains data from previous plugins (if any)
    
    return {
      data: {
        customField: 'value'
      }
    }
  }
})
```

### Multiple Plugins

```typescript
import { createMultiPulsePlugin } from '@roidmc/horizon-pulse-core'

const plugins = createMultiPulsePlugin([
  { name: 'plugin1', priority: 10, patch: (ctx) => { /* ... */ } },
  { name: 'plugin2', priority: 20, patch: (ctx) => { /* ... */ } }
])
```

### Hot Module Replacement (HMR)

```typescript
const myPlugin = createPulsePlugin({
  name: 'my-plugin',
  watchFiles: ['./config/data.json'],
  onHotUpdate(ctx) {
    if (ctx.file.endsWith('.json')) {
      // Reload and return new data
      return {
        shouldUpdate: true,
        newData: { /* ... */ }
      }
    }
    return false
  }
})
```

## API

### Functions

- `createPulsePlugin(options)` - Create a single pulse plugin
- `createMultiPulsePlugin(plugins)` - Create multiple pulse plugins
- `scanDirectory(dir, extensions)` - Scan directory for files
- `deepMerge(target, source)` - Deep merge objects
- `detectAdapter()` - Detect VitePress version adapter
- `getFallbackAdapter()` - Get fallback adapter

### Types

- `PulsePluginOptions` - Plugin configuration options
- `PulsePatchContext` - Patch context (code, id, previousData)
- `PulsePatchResult` - Patch result (data, code)
- `PulseHotUpdateResult` - Hot update result (shouldUpdate, newData)
- `PulseClientOptions` - Client options
- `DiscoveredPaths` - Discovered paths
- `VitePressAdapter` - VitePress version adapter

## Version Compatibility

Pulse Core uses an adapter system to maintain compatibility across VitePress versions:

```typescript
interface VitePressAdapter {
  minVersion: string              // Minimum supported version
  maxVersion: string | null       // Maximum supported version (null = no limit)
  detectStrategies: Array<() => boolean>  // Multiple detection strategies
  discoverPaths(config): DiscoveredPaths
}
```

**Supported VitePress versions:** `2.0.0-alpha.1` to `2.0.0-alpha.17` (and future 2.x releases)

When VitePress updates and breaks compatibility:
1. A new adapter is added with the appropriate version range
2. Detection strategies ensure the correct adapter is used
3. Fallback adapter provides basic functionality

---

2026 © [RoidMC Studios](https://www.roidmc.com) | [MPL-2.0 License](./LICENSE)
<!--
Ciallo～(∠・ω )⌒☆
-->