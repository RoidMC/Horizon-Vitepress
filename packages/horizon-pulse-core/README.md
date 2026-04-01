# @roidmc/horizon-pulse-core

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
    // Modify site data
    return {
      data: {
        ...ctx.originalData,
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
  { name: 'plugin1', /* ... */ },
  { name: 'plugin2', priority: 10, /* ... */ }
])
```

## API

### Functions

- `createPulsePlugin(options)` - Create a single pulse plugin
- `createMultiPulsePlugin(plugins)` - Create multiple pulse plugins
- `scanDirectory(dir, extensions)` - Scan directory for files
- `deepMerge(target, source)` - Deep merge objects

### Types

- `PulsePluginOptions` - Plugin configuration options
- `PulsePatchContext` - Patch context
- `PulsePatchResult` - Patch result
- `PulseHotUpdateResult` - Hot update result
- `PulseClientOptions` - Client options
- `DiscoveredPaths` - Discovered paths

## License

Mozilla Public License Version 2.0
