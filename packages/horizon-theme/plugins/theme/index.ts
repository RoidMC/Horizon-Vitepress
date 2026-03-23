import type { ThemePluginRegistryItem } from '../types'
export { definePlugin } from '../types'
// 自定义插件
import { linkIcon, type LinkIconConfig } from './link-icon'
import { externalLinkGuard, type ExternalLinkGuardConfig } from './external-link-guard'
import { imgViewer, type ImageViewerConfig } from './img-viewer'
import { easterEgg, type EasterEggConfig } from './easter-egg'

/**
 * 导出插件对象（供外部直接访问插件功能）
 */
export { linkIcon, externalLinkGuard, imgViewer, easterEgg }
/**
 * 导出配置类型（供外部类型引用）
 */
export type { LinkIconConfig, ExternalLinkGuardConfig, ImageViewerConfig, EasterEggConfig }
export type { ThemePluginRegistryItem }

/**
 * 插件注册表
 * 运行时遍历此数组，自动注册所有插件
 */
export const themePluginRegistry = [
  linkIcon,
  externalLinkGuard,
  imgViewer,
  easterEgg
] as const

/**
 * 用户配置类型
 * 在 vitepress config 的 features 中使用
 */
export interface ThemePluginConfigs {
  /**
   * External link icon configuration.
   */
  linkIcon?: LinkIconConfig
  /**
   * External link guard configuration.
   */
  externalLinkGuard?: ExternalLinkGuardConfig
  /**
   * Image viewer configuration. (FancyBox)
   */
  imgViewer?: ImageViewerConfig
  /**
   * Easter egg configuration.
   */
  easterEgg?: EasterEggConfig
}
