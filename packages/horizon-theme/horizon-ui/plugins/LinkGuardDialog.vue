<!--
Plugins组件不会注册给Vitepress，仅提供给内部的插件使用
-->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  message?: string
  confirmText?: string
  cancelText?: string
}>()

const visible = ref(false)
const targetUrl = ref('')

const displayMessage = props.message || 'You are about to leave this site. Are you sure you want to continue?'
const displayConfirmText = props.confirmText || 'Continue'
const displayCancelText = props.cancelText || 'Cancel'

const open = (url: string) => {
  targetUrl.value = url
  visible.value = true
}

const confirm = () => {
  if (targetUrl.value) {
    window.open(targetUrl.value, '_blank')
  }
  close()
}

const close = () => {
  visible.value = false
  targetUrl.value = ''
}

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="horizon-link-guard-overlay" @click.self="close">
        <div class="horizon-link-guard-dialog">
          <p class="horizon-link-guard-message">{{ displayMessage }}</p>
          <div class="horizon-link-guard-url" v-if="targetUrl">
            <code>{{ targetUrl }}</code>
          </div>
          <div class="horizon-link-guard-actions">
            <button class="horizon-link-guard-btn cancel" @click="close">
              {{ displayCancelText }}
            </button>
            <button class="horizon-link-guard-btn confirm" @click="confirm">
              {{ displayConfirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.horizon-link-guard {
  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  }

  &-dialog {
    background: var(--vp-c-bg);
    border-radius: 12px;
    padding: 24px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      bottom: 0.5rem;
      left: 0.5rem;
      opacity: 0.2;
      width: 4rem;
      height: 4rem;
      background-color: var(--horizon-plugin-theme-link-guard-dialog-icon-color);
      mask-image: var(--horizon-plugin-theme-link-guard-dialog-icon);
      --mask-image: var(--horizon-plugin-theme-link-guard-dialog-icon);
      mask-size: contain;
      z-index: -1;
    }
  }

  &-message {
    color: var(--vp-c-text-1);
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 16px;
  }

  &-url {
    background: var(--vp-c-bg-soft);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 20px;
    overflow-x: auto;

    code {
      font-size: 1rem;
      color: var(--vp-c-text-2);
      word-break: break-a
    }
  }

  &-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  &-btn {
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;

    &.cancel {
      background: var(--vp-c-bg-soft);
      color: var(--vp-c-text-1);

      &:hover {
        background: var(--vp-c-brand-2);
      }
    }

    &.confirm {
      background: var(--vp-c-brand-1);
      color: var(--vp-c-text-1);

      &:hover {
        background: var(--vp-c-brand-2);
      }
    }
  }
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-active .horizon-link-guard-dialog,
.fade-leave-active .horizon-link-guard-dialog {
  transition: transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .horizon-link-guard-dialog,
.fade-leave-to .horizon-link-guard-dialog {
  transform: scale(0.95);
}
</style>
