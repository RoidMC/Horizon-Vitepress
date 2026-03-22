import { DefaultTheme } from 'vitepress/theme'
import type { LinkIconConfig } from '../../plugins/theme/link-icon'

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
}

export interface HorizonThemeData extends Omit<DefaultTheme.Config, 'footer'> {
  footer?: HorizonFooter
  /**
   * Horizon theme feature toggles.
   */
  features?: HorizonFeatures
}
