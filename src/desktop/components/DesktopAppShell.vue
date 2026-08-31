<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DesktopAppSidebar from './DesktopAppSidebar.vue'

interface Props {
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: undefined
})

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

const internalCollapsed = ref(false)

const isCollapsed = computed({
  get: () => (props.collapsed !== undefined ? props.collapsed : internalCollapsed.value),
  set: (val: boolean) => {
    internalCollapsed.value = val
    emit('update:collapsed', val)
  }
})

const updateResponsiveState = () => {
  const width = window.innerWidth
  if (width < 1024) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  updateResponsiveState()
  window.addEventListener('resize', updateResponsiveState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateResponsiveState)
})
</script>

<template>
  <div
    class="desktop-app-shell flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-[#F8FAFC] font-sans antialiased select-none">

    <!-- 移动端顶部 Header 插槽 (可选) -->
    <slot name="mobile-header" />

    <!-- 桌面端左侧通用侧边栏 -->
    <DesktopAppSidebar v-model:collapsed="isCollapsed" />

    <!-- 页面主体工作区插槽 -->
    <slot />
  </div>
</template>
