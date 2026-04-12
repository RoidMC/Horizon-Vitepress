/**
 *  SPDX-FileCopyrightText: 2026 chencu5958 <hi@roidmc.com> @ RoidMC Studios
 *  SPDX-License-Identifier: MPL-2.0
 */

import type { ThemePluginRegistryItem } from '../../types'
import { i18nHotReload } from './i18n-hot-reload'

export { i18nHotReload }

export const sitePlugins: ThemePluginRegistryItem[] = [
  i18nHotReload
]
