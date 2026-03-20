<script setup lang="ts">
import { withBase } from 'vitepress'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

<template>
  <div class="not-found">
    <div class="not-found-bg">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
    <div class="content">
      <p class="code">{{ theme.notFound?.code ?? '404' }}</p>
      <h1 class="title">{{ theme.notFound?.title ?? 'PAGE NOT FOUND' }}</h1>
      <div class="divider"></div>
      <blockquote class="quote">
        {{
          theme.notFound?.quote ??
          '但如果你不改变方向，又一直望着同一个方向的话，你最终可能去到你正在前进的地方。'
        }}
      </blockquote>
      <div class="action">
        <a
          class="link"
          :href="withBase(theme.notFound?.link ?? '/')"
          :aria-label="theme.notFound?.linkLabel ?? 'go to home'"
        >
          {{ theme.notFound?.linkText ?? '带我回家' }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  position: relative;
  min-height: calc(100vh - var(--vp-nav-height));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.not-found-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--vp-c-brand-1) 0%, var(--vp-c-brand-2) 100%);
  opacity: 0.1;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  animation: float 10s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.15;
  }
}

.content {
  position: relative;
  z-index: 1;
  padding: 64px 24px 96px;
  text-align: center;
}

@media (min-width: 768px) {
  .content {
    padding: 96px 32px 168px;
  }
}

.code {
  line-height: 64px;
  font-size: 64px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title {
  padding-top: 12px;
  letter-spacing: 2px;
  line-height: 20px;
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.divider {
  margin: 24px auto 18px;
  width: 64px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--vp-c-brand-1), transparent);
}

.quote {
  margin: 0 auto;
  max-width: 320px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.action {
  padding-top: 20px;
}

.link {
  display: inline-block;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 16px;
  padding: 3px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  transition: all 0.25s ease;
  text-decoration: none;
}

.link:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}
</style>
