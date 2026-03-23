import { DefaultTheme } from 'vitepress/theme'
import type { LinkIconConfig } from '../../plugins/theme/link-icon'
import type { ExternalLinkGuardConfig } from '../../plugins/theme/external-link-guard'
import type { ImageViewerConfig } from '../../plugins/theme/img-viewer'

export interface HorizonFooter extends DefaultTheme.Footer {
  /**
   * The message to be displayed at the bottom of the footer.
   */
  message?: string
  /**
   * The copyright notice to be displayed at the bottom of the footer.
   */
  copyright?: string
  /**
   * The hallow text to be displayed at the bottom of the footer.
   */
  hallowText?: string
}

export interface HorizonFeatures {
  /**
   * External link icon configuration.
   */
  linkIcon?: LinkIconConfig
  /**
   * External link guard configuration.
   */
  externalLinkGuard?: ExternalLinkGuardConfig
  /**
   * Image viewer configuration.（FancyBox）
   */
  imgViewer?: ImageViewerConfig
}

export interface HorizonThemeData extends Omit<DefaultTheme.Config, 'footer'> {
  footer?: HorizonFooter
  /**
   * Horizon theme feature toggles.
   */
  features?: HorizonFeatures
}
