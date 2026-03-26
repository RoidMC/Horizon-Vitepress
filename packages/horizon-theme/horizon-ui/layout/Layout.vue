<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, provide, computed } from 'vue'
import NotFound from './NotFound.vue'
import LinkGuardDialog from '../plugins/LinkGuardDialog.vue'
import { defaultConfig as linkGuardDefaultConfig } from '../../plugins/theme/external-link-guard'

const { isDark, page, theme } = useData()

const linkGuardConfig = computed(() => ({
  enable: theme.value.features?.externalLinkGuard?.enable ?? linkGuardDefaultConfig.enable,
  whitelist: theme.value.features?.externalLinkGuard?.whitelist ?? linkGuardDefaultConfig.whitelist,
  message: theme.value.features?.externalLinkGuard?.message ?? linkGuardDefaultConfig.message,
  confirmText: theme.value.features?.externalLinkGuard?.confirmText ?? linkGuardDefaultConfig.confirmText,
  cancelText: theme.value.features?.externalLinkGuard?.cancelText ?? linkGuardDefaultConfig.cancelText
}))

const enableTransitions = () =>
  'startViewTransition' in document &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value
    return
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )}px at ${x}px ${y}px)`
  ]

  await document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  }).ready

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 300,
      easing: 'ease-in',
      fill: 'forwards',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
    }
  )
})
</script>

<template>
  <!-- <NotFound v-if="page.isNotFound" /> -->
  <DefaultTheme.Layout class="horizon-layout" />
  <LinkGuardDialog v-if="linkGuardConfig.enable" :config="linkGuardConfig" />
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}
</style>