import type { EnhanceAppContext } from 'vitepress'
import type { ThemePluginFactory } from '../types'
import type { FancyboxOptions } from '@fancyapps/ui/dist/fancybox/fancybox.d.ts'
import { definePlugin } from '../types'
import { inBrowser } from 'vitepress'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

export interface ImageViewerConfig {
    /**
     * Enable image viewer
     */
    enable?: boolean
    /**
     * Exclude image viewer from certain images
     */
    exclude?: string[]
    /**
     * Fancybox options
     */
    fancyboxOptions?: Partial<FancyboxOptions>
}

const defaultFancyboxOptions: Partial<FancyboxOptions> = {
    Hash: false, // Hash导航开了有BUG
    Carousel: {
        transition: 'slide',
        Toolbar: {
            display: {
                left: ["counter"],
                middle: [
                    "zoomIn",
                    "zoomOut",
                    "toggle1to1",
                    "rotateCCW",
                    "rotateCW",
                    "flipX",
                    "flipY",
                    "reset",
                ],
                right: ["autoplay", "thumbs", "close"],
            },
        },
    },
}

const defaultConfig: Required<Omit<ImageViewerConfig, 'fancyboxOptions'>> & { fancyboxOptions: Partial<FancyboxOptions> } = {
    enable: true,
    exclude: ['https://img.shields.io/'],
    fancyboxOptions: defaultFancyboxOptions
}

const buildExcludeSelector = (exclude: string[]): string => {
    return exclude.map(prefix => `:not([src^="${prefix}"])`).join('')
}

const bindFancybox = async (exclude: string[], options: Partial<FancyboxOptions> = defaultFancyboxOptions) => {
    const { Fancybox } = await import('@fancyapps/ui/dist/fancybox')
    const excludeSelector = buildExcludeSelector(exclude)
    const imgs = document.querySelectorAll(`.vp-doc img${excludeSelector}:not(.not)`)
    imgs.forEach((img: Element) => {
        const image = img as HTMLImageElement
        if (!image.hasAttribute('data-fancybox')) {
            image.setAttribute('data-fancybox', 'gallery')
        }
        if (!image.hasAttribute('alt') || image.getAttribute('alt') === '') {
            const heading = findNearestHeading(image)
            image.setAttribute('alt', heading)
        }
        const altString = image.getAttribute('alt') || ''
        image.setAttribute('data-caption', altString)
    })

    Fancybox.bind('[data-fancybox="gallery"]', options)
}

const destroyFancybox = async () => {
    const { Fancybox } = await import('@fancyapps/ui')
    Fancybox.destroy()
}

const findNearestHeading = (imgElement: HTMLImageElement | HTMLElement | null): string => {
    let currentElement = imgElement
    while (currentElement && currentElement !== document.body) {
        let previousSibling = currentElement.previousElementSibling
        while (previousSibling) {
            if (previousSibling.tagName.match(/^H[1-6]$/)) {
                return previousSibling.textContent?.replace(/\u200B/g, '').trim() || ''
            }
            previousSibling = previousSibling.previousElementSibling
        }
        currentElement = currentElement.parentElement
    }
    return ''
}

const factory: ThemePluginFactory<ImageViewerConfig> = (config) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const fancyboxOptions = { ...defaultFancyboxOptions, ...mergedConfig.fancyboxOptions }
    return {
        name: 'image-viewer',
        enhanceApp({ }: EnhanceAppContext) {
        },
        onBeforeRouteChange() {
            if (!inBrowser) return
            if (mergedConfig.enable) {
                destroyFancybox()
            }
        },
        onDomUpdated() {
            if (!inBrowser) return
            if (mergedConfig.enable) {
                bindFancybox(mergedConfig.exclude, fancyboxOptions)
            }
        }
    }
}

export const imgViewer = definePlugin({
    key: 'imgViewer',
    factory,
    defaultConfig,
    bindFancybox,
    destroyFancybox
})
