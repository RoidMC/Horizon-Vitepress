import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = resolve(__dirname, '../package.json')
const mode = process.argv[2]

const srcExports = {
  ".": "./index.ts",
  "./config": "./config.ts",
  "./components": "./components/*",
  "./style.scss": "./themes/style.scss",
  "./assets/*": "./assets/*"
}

const distExports = {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "style": "./dist/horizon-theme.css"
  },
  "./config": "./dist/config.js",
  "./style": "./dist/horizon-theme.css",
  "./components/*": "./dist/components/*.js",
  "./assets/*": "./assets/*"
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

if (mode === 'src') {
  pkg.main = 'index.ts'
  pkg.exports = srcExports
  console.log('✓ Switched to SOURCE mode (development)')
} else if (mode === 'dist') {
  pkg.main = 'dist/index.js'
  pkg.exports = distExports
  console.log('✓ Switched to DIST mode (production testing)')
} else {
  console.log('Usage: node scripts/switch-mode.js [src|dist]')
  process.exit(1)
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')