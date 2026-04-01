import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs'
import { minPeerVersions, minDepVersions } from './config'

const distDir = resolve(__dirname, '../dist')
const srcDistDir = resolve(distDir, 'src')
const readmePath = resolve(__dirname, '../README.md')
const licensePath = resolve(__dirname, '../LICENSE')

export function postBuild() {
  moveFiles()
  cleanupDistSrc()
  copyLicenseAndReadme()
  generatePackageJson()
}

function moveFiles() {
  if (!existsSync(srcDistDir)) return
  
  const files = readdirSync(srcDistDir)
  
  for (const file of files) {
    const srcPath = resolve(srcDistDir, file)
    const destPath = resolve(distDir, file)
    
    if (statSync(srcPath).isFile()) {
      copyFileSync(srcPath, destPath)
    }
  }
  
  console.log('✓ Moved declaration files to dist root')
}

function cleanupDistSrc() {
  if (!existsSync(srcDistDir)) return
  
  try {
    rmSync(srcDistDir, { recursive: true, force: true })
    console.log('✓ Cleaned up dist/src')
  } catch (e) {
    console.log('✓ Cleaned up dist/src (force)')
  }
}

function copyLicenseAndReadme() {
  if (existsSync(readmePath)) {
    copyFileSync(readmePath, resolve(distDir, 'README.md'))
    console.log('✓ Copied README.md to dist')
  }
  
  if (existsSync(licensePath)) {
    copyFileSync(licensePath, resolve(distDir, 'LICENSE'))
    console.log('✓ Copied LICENSE to dist')
  }
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
    name: rootPkg.name,
    version: rootPkg.version,
    type: 'module',
    license: rootPkg.license,
    main: 'index.js',
    author: rootPkg.author,
    exports: {
      '.': './index.js',
      './client': './client.js'
    },
    peerDependencies: Object.keys(peerDeps).length > 0 ? peerDeps : undefined,
    dependencies: { ...rootPkg.dependencies, ...dependencies }
  }

  writeFileSync(resolve(distDir, 'package.json'), JSON.stringify(distPkg, null, 2) + '\n')
  console.log('✓ Generated dist/package.json for publishing')
}
