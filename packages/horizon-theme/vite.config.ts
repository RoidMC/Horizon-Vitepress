import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve, basename, relative } from 'path'
import { builtinModules } from 'module'
import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, statSync } from 'fs'

// 自动扫描组件目录
function scanComponents(dir: string): Record<string, string> {
  const entries: Record<string, string> = {}
  const componentsDir = resolve(__dirname, dir)
  
  if (existsSync(componentsDir)) {
    const files = readdirSync(componentsDir)
    for (const file of files) {
      if (file.endsWith('.vue')) {
        const filePath = resolve(componentsDir, file)
        // 跳过空文件
        const content = readFileSync(filePath, 'utf-8').trim()
        if (!content) continue
        
        const name = file.replace('.vue', '')
        entries[`components/${name}`] = filePath
      }
    }
  }
  return entries
}

const componentEntries = scanComponents('horizon-ui/components')

const generateDistPackageJson = () => ({
  name: 'generate-dist-package-json',
  closeBundle() {
    const rootPkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
    
    const distDir = resolve(__dirname, 'dist')
    
    // 清理根目录多余的 d.ts 文件
    if (existsSync(distDir)) {
      const files = readdirSync(distDir)
      for (const file of files) {
        const filePath = resolve(distDir, file)
        if (!statSync(filePath).isFile()) continue
        
        // 删除根目录多余的 d.ts（只保留 index.d.ts 和 config.d.ts）
        if (file.endsWith('.d.ts') && !['index.d.ts', 'config.d.ts'].includes(file)) {
          unlinkSync(filePath)
        }
      }
    }
    
    // 转换 catalog: 为实际版本范围
    const peerDeps = { ...rootPkg.peerDependencies }
    for (const key of Object.keys(peerDeps)) {
      if (peerDeps[key] === 'catalog:') {
        peerDeps[key] = '>=1.0.0'
      }
    }
    
    const distPkg = {
      name: rootPkg.name,
      version: rootPkg.version,
      type: 'module',
      main: 'index.js',
      module: 'index.js',
      types: 'index.d.ts',
      exports: {
        '.': {
          import: './index.js',
          types: './index.d.ts',
          style: './horizon-theme.css'
        },
        './config': {
          import: './config.js',
          types: './config.d.ts'
        },
        './style': './horizon-theme.css',
        './components/*': './components/*.js'
      },
      files: ['*'],
      peerDependencies: peerDeps
    }
    
    writeFileSync(
      resolve(__dirname, 'dist/package.json'),
      JSON.stringify(distPkg, null, 2) + '\n'
    )
    console.log('✓ Generated dist/package.json for publishing')
  }
})

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['index.ts', 'config.ts', 'horizon-ui/**/*.vue'],
      outDir: 'dist',
      rollupTypes: true,
      compilerOptions: {
        skipLibCheck: true,
        noEmitOnError: false
      }
    }),
    generateDistPackageJson()
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