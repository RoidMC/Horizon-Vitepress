<script setup lang="ts">
interface Props {
  tag?: string
  size?: 'small' | 'medium' | 'big'
  theme?: 'brand' | 'alt' | 'sponsor'
  text?: string
  href?: string
  target?: string
  rel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  theme: 'brand'
})

const isExternal = props.href?.startsWith('http')
</script>

<template>
  <component
    :is="tag || (href ? 'a' : 'button')"
    class="horizon-button"
    :class="[size, theme]"
    :href="href"
    :target="target ?? (isExternal ? '_blank' : undefined)"
    :rel="rel ?? (isExternal ? 'noreferrer' : undefined)"
  >
    <slot><span class="horizon-button-text">{{ text }}</span></slot>
  </component>
</template>
