<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GradeCalculator from './components/GradeCalculator.vue'
import MobileCalculator from './components/MobileCalculator.vue'

const isMobile = ref(window.innerWidth <= 768)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <main>
    <component :is="isMobile ? MobileCalculator : GradeCalculator" />
    <footer class="github-footer">
      <a href="https://github.com/hjxdio/hjxdio.github.io/issues/" target="_blank" rel="noopener">
        在 GitHub 上提交问题
      </a>
    </footer>
  </main>
</template>

<style>
body {
  background-color: #f5f7fa;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* 移动端 */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}

.github-footer {
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

.github-footer a {
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
}

.github-footer a:hover {
  color: #333;
  text-decoration: underline;
}

main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>