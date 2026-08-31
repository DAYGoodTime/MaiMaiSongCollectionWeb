<script setup lang="ts">
import DesktopAppSidebar from '@/desktop/components/DesktopAppSidebar.vue'

interface Props {
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()
</script>

<template>
  <DesktopAppSidebar
    :collapsed="props.collapsed"
    @update:collapsed="emit('update:collapsed', $event)"
  />
</template>
