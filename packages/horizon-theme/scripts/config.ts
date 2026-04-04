export const minPeerVersions: Record<string, string> = {
  vitepress: '>=2.0.0-alpha.17',
  vue: '>=3.5.0',
  typescript: '>=5.6.0'
}

export const minDepVersions: Record<string, string> = {
  '@11ty/gray-matter': '^2.0.1'
}

export interface DistPackageTemplate {
  name: string
  version: string
  type: string
  main: string
  module: string
  types: string
  repository: string
  engines?: Record<string, string>
  author: string | {}
  publishConfig?: Record<string, any>
  license?: string
  description?: string
  keywords?: string[]
  homepage?: string
  bugs?: string | { url: string }
  exports: Record<string, any>
  files: string[]
  peerDependencies?: Record<string, string>
}

export const distPackageTemplate: Omit<DistPackageTemplate, 'name' | 'version' | 'peerDependencies'> = {
  type: 'module',
  main: 'index.js',
  module: 'index.js',
  types: 'index.d.ts',
  repository: 'github:roidmc/horizon-vitepress',
  engines: {
    node: '>=22'
  },
  author: { "name": "chencu5958", "email": "hi@roidmc.com", "url": "https://github.com/chencu5958" },
  publishConfig: {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  },
  license: 'MPL-2.0',
  description: 'A modern VitePress theme with dynamic configuration and HMR support',
  keywords: ['vitepress', 'theme', 'vitepress-theme', 'documentation', 'pulse'],
  homepage: 'https://github.com/roidmc/horizon-vitepress#readme',
  bugs: 'https://github.com/roidmc/horizon-vitepress/issues',
  exports: {
    '.': { import: './index.js', types: './index.d.ts', style: './horizon-theme.css' },
    './config': { import: './config.js', types: './config.d.ts' },
    './style': './horizon-theme.css',
    './components/*': './components/*.js'
  },
  files: ['*']
}
