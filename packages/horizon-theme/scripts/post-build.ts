import { resolve } from 'path'
import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs'
import { minPeerVersions, minDepVersions, distPackageTemplate } from './config'

const distDir = resolve(__dirname, '../dist')

export function postBuild() {
  const types = collectPluginTypes()

  processDtsFile('index.d.ts', types)
  processDtsFile('config.d.ts', types)

  cleanupDtsFiles()
  cleanupJsComments()
  injectCssImport()
  copyStaticFiles()
  generatePackageJson()
}

interface CollectedTypes {
  pluginConfigs: string[]
  themePluginConfigs: string
  sitePluginConfigs: string
  utilsDefine: string
  siteDefine: string
  configNames: string[]
  siteTypeDefinitions: string[]
  fancyboxImport: string
}

function collectPluginTypes(): CollectedTypes {
  const pluginsDir = resolve(__dirname, '../plugins/theme')
  const pluginFiles = readdirSync(pluginsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts')

  const pluginConfigs: string[] = []
  const configNames: string[] = []

  for (const file of pluginFiles) {
    const content = readFileSync(resolve(pluginsDir, file), 'utf-8')
    const configMatch = content.match(/export interface\s+(\w+Config)\s*\{/)
    if (configMatch) {
      configNames.push(configMatch[1])
      const interfaceStr = extractInterface(content, configMatch[1])
      if (interfaceStr) pluginConfigs.push(interfaceStr)
    }
  }

  const themeIndexContent = readFileSync(resolve(pluginsDir, 'index.ts'), 'utf-8')
  const themePluginConfigs = extractMultilineInterface(themeIndexContent, 'ThemePluginConfigs')

  const sitePluginsDir = resolve(__dirname, '../plugins/site/i18n')
  let sitePluginConfigs = ''
  const i18nTypesPath = resolve(sitePluginsDir, 'types.ts')
  if (existsSync(i18nTypesPath)) {
    const i18nTypesContent = readFileSync(i18nTypesPath, 'utf-8')
    sitePluginConfigs = extractMultilineInterface(i18nTypesContent, 'I18nPluginConfig')
  }

  const utilsDefine = readFileSync(resolve(__dirname, '../utils/define/theme.ts'), 'utf-8')
    .replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"][^'"]*plugins\/theme[^'"]*['"];?\s*/g, '')

  const siteDefineRaw = readFileSync(resolve(__dirname, '../utils/define/site.ts'), 'utf-8')
  const siteDefine = `import type { UserConfig } from 'vitepress'\n` + 
    siteDefineRaw.replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?\s*/g, '')

  const siteTypeDefinitions: string[] = []
  const sidebarTypesPath = resolve(__dirname, '../plugins/site/sidebar/types.ts')
  if (existsSync(sidebarTypesPath)) {
    const sidebarContent = readFileSync(sidebarTypesPath, 'utf-8')
    const sidebarInterfaces = sidebarContent.match(/export\s+(interface|type)\s+(\w+)/g) || []
    for (const match of sidebarInterfaces) {
      const name = match.match(/export\s+(?:interface|type)\s+(\w+)/)?.[1]
      if (name) {
        const extracted = extractMultilineInterface(sidebarContent, name)
        if (extracted) siteTypeDefinitions.push(extracted)
      }
    }
  }
  const i18nTypesContent = readFileSync(resolve(sitePluginsDir, 'types.ts'), 'utf-8')
  const i18nInterfaces = i18nTypesContent.match(/export\s+interface\s+(\w+)/g) || []
  for (const match of i18nInterfaces) {
    const name = match.match(/export\s+interface\s+(\w+)/)?.[1]
    if (name && !siteTypeDefinitions.some(t => t.includes(` ${name} `)) && name !== 'I18nPluginConfig') {
      const extracted = extractMultilineInterface(i18nTypesContent, name)
      if (extracted) siteTypeDefinitions.push(extracted)
    }
  }

  const fancyboxImport = "import type { FancyboxOptions } from '@fancyapps/ui';\n"

  return {
    pluginConfigs,
    themePluginConfigs,
    sitePluginConfigs,
    utilsDefine,
    siteDefine,
    configNames,
    siteTypeDefinitions,
    fancyboxImport
  }
}

function processDtsFile(filename: string, types: CollectedTypes) {
  const filePath = resolve(distDir, filename)
  if (!existsSync(filePath)) return

  let content = readFileSync(filePath, 'utf-8')

  types.configNames.forEach(name => {
    content = removeInterface(content, name)
  })
  content = removeInterface(content, 'ThemePluginConfigs')

  content = cleanImports(content, filename === 'config.d.ts')
  content = fixFancyboxImport(content)

  const header = [
    types.fancyboxImport,
    ...types.pluginConfigs,
    '',
    types.utilsDefine,
    '',
    types.sitePluginConfigs,
    '',
    types.siteDefine,
    '',
    ...types.siteTypeDefinitions,
    '',
    types.themePluginConfigs,
    ''
  ].join('\n')

  writeFileSync(filePath, header + content)
  console.log(`✓ Inlined type definitions in ${filename}`)
}

function extractInterface(content: string, name: string): string {
  const regex = new RegExp(`export interface ${name}\\s*\\{[^}]*\\}`, 's')
  return content.match(regex)?.[0] || ''
}

function extractMultilineInterface(content: string, name: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inTarget = false
  let depth = 0

  for (const line of lines) {
    if (new RegExp(`^export\\s+interface\\s+${name}(?:\\s+extends\\s+[^{]+)?\\s*\\{`).test(line.trim())) {
      inTarget = true
      depth = 1
      result.push(line)
      continue
    }
    if (inTarget) {
      result.push(line)
      depth += (line.match(/\{/g) || []).length
      depth -= (line.match(/\}/g) || []).length
      if (depth <= 0) break
    }
  }
  return result.join('\n')
}

function removeInterface(content: string, name: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let skipDepth = 0
  let skipping = false

  for (const line of lines) {
    if (new RegExp(`^(export\\s+)?(declare\\s+)?interface\\s+${name}\\s*\\{`).test(line.trim())) {
      skipping = true
      skipDepth = 1
      continue
    }
    if (skipping) {
      skipDepth += (line.match(/\{/g) || []).length
      skipDepth -= (line.match(/\}/g) || []).length
      if (skipDepth <= 0) skipping = false
      continue
    }
    result.push(line)
  }
  return result.join('\n')
}

function cleanImports(content: string, isConfig: boolean): string {
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/utils\/define['"];?\s*/g, '')
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/utils\/define\/site['"];?\s*/g, '')
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/utils\/define\/theme['"];?\s*/g, '')
  content = content.replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"][^'"]*plugins\/theme[^'"]*['"];?\s*/g, '')
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*plugins\/site[^'"]*['"];?\s*/g, '')
  content = content.replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"][^'"]*plugins\/site[^'"]*['"];?\s*/g, '')
  content = content.replace(/import\s*(type\s+)?\{[^}]*FancyboxOptions[^}]*\}\s*from\s*['"][^'"]*@fancyapps[^'"]*['"];?\s*/g, '')
  if (isConfig) {
    content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/index['"];?\s*/g, '')
  }
  return content
}

function fixFancyboxImport(content: string): string {
  return content.replace(
    /import\s*\{\s*FancyboxOptions\s*\}\s*from\s*['"]@fancyapps\/ui\/dist\/fancybox\/fancybox\.d\.ts['"];?\s*/g,
    'import type { FancyboxOptions } from "@fancyapps/ui";\n'
  )
}

function cleanupDtsFiles() {
  if (!existsSync(distDir)) return
  const keepFiles = ['index.d.ts', 'config.d.ts']

  const processDir = (dir: string) => {
    for (const file of readdirSync(dir)) {
      const filePath = resolve(dir, file)
      if (statSync(filePath).isDirectory()) {
        processDir(filePath)
      } else if (file.endsWith('.d.ts') && !keepFiles.includes(file)) {
        unlinkSync(filePath)
      }
    }
  }
  processDir(distDir)
  console.log('✓ Cleaned up extra .d.ts files')
}

function cleanupJsComments() {
  if (!existsSync(distDir)) return

  const processDir = (dir: string) => {
    for (const file of readdirSync(dir)) {
      const filePath = resolve(dir, file)
      if (statSync(filePath).isDirectory()) {
        processDir(filePath)
      } else if (file.endsWith('.js')) {
        let content = readFileSync(filePath, 'utf-8')
        const cleaned = content
          .replace(/\/\/#region[^\n]*\n/g, '')
          .replace(/\/\/#endregion[^\n]*\n/g, '')
        if (cleaned !== content) writeFileSync(filePath, cleaned)
      }
    }
  }
  processDir(distDir)
  console.log('✓ Cleaned up JS comments')
}

function injectCssImport() {
  const indexJsPath = resolve(distDir, 'index.js')
  if (!existsSync(indexJsPath)) return

  let content = readFileSync(indexJsPath, 'utf-8')
  if (content.includes("import './horizon-theme.css'")) return

  content = content
    .replace(/import\s*['"]\.\/horizon-theme\.css['"];?\s*\n?/g, '')
    .replace(
      /(import\s+DefaultTheme\s+from\s*['"]vitepress\/theme['"];?\s*\n)/,
      "$1import './horizon-theme.css';\n"
    )

  writeFileSync(indexJsPath, content)
  console.log('✓ Injected CSS import after DefaultTheme')
}

function generatePackageJson() {
  const rootPkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'))

  const peerDeps = Object.fromEntries(
    Object.keys(minPeerVersions)
      .filter(key => rootPkg.peerDependencies[key])
      .map(key => [key, rootPkg.peerDependencies[key] === 'catalog:' ? minPeerVersions[key] : rootPkg.peerDependencies[key]])
  )

  const dependencies = Object.fromEntries(
    Object.keys(minDepVersions)
      .filter(key => rootPkg.dependencies[key])
      .map(key => [key, rootPkg.dependencies[key] === 'catalog:' ? minDepVersions[key] : rootPkg.dependencies[key]])
  )

  const distPkg = {
    ...distPackageTemplate,
    name: rootPkg.name,
    version: rootPkg.version,
    peerDependencies: peerDeps,
    dependencies
  }

  writeFileSync(resolve(distDir, 'package.json'), JSON.stringify(distPkg, null, 2) + '\n')
  console.log('✓ Generated dist/package.json for publishing')
}

function copyStaticFiles() {
  const files = ['README.md', 'LICENSE']
  for (const file of files) {
    const src = resolve(__dirname, '..', file)
    const dest = resolve(distDir, file)
    if (existsSync(src)) {
      copyFileSync(src, dest)
      console.log(`✓ Copied ${file} to dist`)
    }
  }
}
