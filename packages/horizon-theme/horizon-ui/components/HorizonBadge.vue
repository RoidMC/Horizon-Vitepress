<script setup lang="ts">
interface Props {
  text?: string
  type?: 'info' | 'note' | 'warning' | 'danger' | 'caution' | 'important' | 'tip'
}
withDefaults(defineProps<Props>(), {
  type: 'tip'
})
</script>

<template>
  <span class="horizon-badge" :class="type">
    <slot>{{ text }}</slot>
  </span>
</template>