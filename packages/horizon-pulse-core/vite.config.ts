import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite' 
import { resolve } from 'path'
import { builtinModules } from 'module'
import { postBuild } from './scripts/post-build'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts', 'env.d.ts'],
      outDirs: ['dist'],
      bundleTypes: false,
      cleanVueFileName: true,
      staticImport: true,
      copyDtsFiles: false,
      compilerOptions: {
        skipLibCheck: true,
        noEmitOnError: false,
        declarationMap: false
      }
    }),
    {
      name: 'post-build',
      closeBundle: postBuild
    }
  ],
  build: {
    sourcemap: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        client: resolve(__dirname, 'src/client.ts')
      },
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'vue',
        /^vite/,
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ],
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    minify: false
  }
})
