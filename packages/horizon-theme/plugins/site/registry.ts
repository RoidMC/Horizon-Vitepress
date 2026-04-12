/**
 * SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 * SPDX-License-Identifier: MPL-2.0
 */

import type { SitePluginRegistryItem } from '../types'
import { i18nPlugin } from './i18n/plugin'
import { sidebarPlugin } from './sidebar/plugin'

export const sitePluginRegistry: SitePluginRegistryItem[] = [
  i18nPlugin,
  sidebarPlugin
]
