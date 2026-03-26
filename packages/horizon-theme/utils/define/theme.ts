import { DefaultTheme } from 'vitepress/theme'
import type { ThemePluginConfigs } from '../../plugins/theme'

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

export type HorizonFeatures = ThemePluginConfigs

export interface HorizonThemeData extends Omit<DefaultTheme.Config, 'footer'> {
  footer?: HorizonFooter
  /**
   * Horizon theme feature toggles.
   */
  features?: HorizonFeatures
}
