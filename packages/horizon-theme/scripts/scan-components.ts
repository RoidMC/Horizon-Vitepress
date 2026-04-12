/**
 * SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 * SPDX-License-Identifier: MPL-2.0
 */

import { resolve } from 'path'
import { readFileSync, readdirSync } from 'fs'

export function scanComponents(dir: string): Record<string, string> {
  const entries: Record<string, string> = {}
  const componentsDir = resolve(__dirname, '..', dir)
  
  if (!readdirSync(componentsDir)) return entries
  
  const files = readdirSync(componentsDir)
  for (const file of files) {
    if (file.endsWith('.vue')) {
      const filePath = resolve(componentsDir, file)
      const content = readFileSync(filePath, 'utf-8').trim()
      if (!content) continue
      
      const name = file.replace('.vue', '')
      entries[`components/${name}`] = filePath
    }
  }
  return entries
}