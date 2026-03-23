import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { builtinModules } from 'module'
import { scanComponents } from './scripts/scan-components'
import { postBuild } from './scripts/post-build'

const componentEntries = scanComponents('horizon-ui/components')

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['index.ts', 'config.ts', 'horizon-ui/**/*.vue', 'utils/**/*.ts', 'plugins/**/*.ts', 'env.d.ts'],
      outDir: 'dist',
      rollupTypes: true,
      compilerOptions: {
        skipLibCheck: true,
        noEmitOnError: false
      }
    }),
    {
      name: 'post-build',
      closeBundle: postBuild
    }
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'index.ts'),
        config: resolve(__dirname, 'config.ts'),
        ...componentEntries
      },
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'vue',
        'vitepress',
        'vitepress/theme',
        'vitepress/client',
        /^@siteData$/,
        /^@theme$/,
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ],
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    cssCodeSplit: false,
    minify: false
  }
})