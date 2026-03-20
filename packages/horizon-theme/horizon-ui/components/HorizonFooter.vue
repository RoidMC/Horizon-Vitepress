<script setup lang="ts">
import { useData } from 'vitepress'
import { useLayout } from 'vitepress/theme'

const { theme, frontmatter } = useData()
const { hasSidebar } = useLayout()
</script>

<template>
    <footer v-if="theme.footer && frontmatter.footer !== false" class="horizon-footer"
        :class="{ 'has-sidebar': hasSidebar }">
        <div class="horizon-footer-container">
            <p v-if="theme.footer.message" class="horizon-footer-message" v-html="theme.footer.message"></p>
            <p v-if="theme.footer.copyright" class="horizon-footer-copyright" v-html="theme.footer.copyright"></p>
            <div class="horizon-footer-hallow-text" v-if="theme.footer.hallowText">
                <span class="bracket">[</span>
                <span class="text" v-html="theme.footer.hallowText"></span>
                <span class="bracket">]</span>
            </div>
        </div>
    </footer>
</template>