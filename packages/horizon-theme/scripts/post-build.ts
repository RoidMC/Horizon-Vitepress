import { resolve } from 'path'
import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, statSync } from 'fs'
import { minPeerVersions } from './config'

const distDir = resolve(__dirname, '../dist')

export function postBuild() {
  inlineTypeDefinitions()
  cleanupDtsFiles()
  cleanupJsComments()
  injectCssImport()
  generatePackageJson()
}

function inlineTypeDefinitions() {
  const utilsDefinePath = resolve(__dirname, '../utils/define/index.ts')
  const utilsDefineContent = readFileSync(utilsDefinePath, 'utf-8')
  
  const indexDtsPath = resolve(distDir, 'index.d.ts')
  if (existsSync(indexDtsPath)) {
    let indexDts = readFileSync(indexDtsPath, 'utf-8')
    indexDts = indexDts.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/utils\/define['"];?\s*/g, '')
    indexDts = indexDts.replace(/export\s*\{\s*HorizonFooter\s*\}\s*/g, '')
    indexDts = indexDts.replace(/export\s*\{\s*HorizonThemeConfig\s*\}\s*/g, '')
    indexDts = utilsDefineContent + '\n\n' + indexDts
    writeFileSync(indexDtsPath, indexDts)
    console.log('✓ Inlined type definitions in index.d.ts')
  }
  
  const configDtsPath = resolve(distDir, 'config.d.ts')
  if (existsSync(configDtsPath)) {
    let configDts = readFileSync(configDtsPath, 'utf-8')
    configDts = configDts.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/utils\/define['"];?\s*/g, '')
    configDts = configDts.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/index['"];?\s*/g, '')
    configDts = configDts.replace(/export\s*\{\s*HorizonFooter\s*\}\s*/g, '')
    configDts = configDts.replace(/export\s*\{\s*HorizonThemeConfig\s*\}\s*/g, '')
    configDts = utilsDefineContent + '\n\n' + configDts
    writeFileSync(configDtsPath, configDts)
    console.log('✓ Inlined type definitions in config.d.ts')
  }
}

function cleanupDtsFiles() {
  if (!existsSync(distDir)) return
  
  const files = readdirSync(distDir)
  for (const file of files) {
    const filePath = resolve(distDir, file)
    if (!statSync(filePath).isFile()) continue
    
    if (file.endsWith('.d.ts') && !['index.d.ts', 'config.d.ts'].includes(file)) {
      unlinkSync(filePath)
    }
  }
}

function cleanupJsComments() {
  if (!existsSync(distDir)) return
  
  const processDir = (dir: string) => {
    const files = readdirSync(dir)
    for (const file of files) {
      const filePath = resolve(dir, file)
      if (statSync(filePath).isDirectory()) {
        processDir(filePath)
        continue
      }
      
      if (file.endsWith('.js')) {
        let content = readFileSync(filePath, 'utf-8')
        const original = content
        content = content.replace(/\/\/#region[^\n]*\n/g, '')
        content = content.replace(/\/\/#endregion[^\n]*\n/g, '')
        if (content !== original) {
          writeFileSync(filePath, content)
        }
      }
    }
  }
  
  processDir(distDir)
  console.log('✓ Cleaned up JS comments')
}

function injectCssImport() {
  const indexJsPath = resolve(distDir, 'index.js')
  if (!existsSync(indexJsPath)) return
  
  let indexJs = readFileSync(indexJsPath, 'utf-8')
  if (indexJs.includes("import './horizon-theme.css'")) return
  
  // 移除开头的 CSS import（如果有）
  indexJs = indexJs.replace(/import\s*['"]\.\/horizon-theme\.css['"];?\s*\n?/g, '')
  
  // 在 DefaultTheme 导入之后插入 CSS import
  indexJs = indexJs.replace(
    /(import\s+DefaultTheme\s+from\s+['"]vitepress\/theme['"];?\s*\n)/,
    "$1import './horizon-theme.css';\n"
  )
  
  writeFileSync(indexJsPath, indexJs)
  console.log('✓ Injected CSS import after DefaultTheme')
}

function generatePackageJson() {
  const rootPkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'))
  
  const peerDeps: Record<string, string> = {}
  for (const key of Object.keys(minPeerVersions)) {
    if (rootPkg.peerDependencies[key]) {
      peerDeps[key] = rootPkg.peerDependencies[key] === 'catalog:' 
        ? minPeerVersions[key]
        : rootPkg.peerDependencies[key]
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
    resolve(distDir, 'package.json'),
    JSON.stringify(distPkg, null, 2) + '\n'
  )
  console.log('✓ Generated dist/package.json for publishing')
}