<script setup lang="ts">
import { nextTick, type HTMLAttributes } from 'vue'
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from './utils'
import { MdFab } from '@material/web/fab/fab.js'
import { useAppStore } from '@/store/appStore';

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
const appStore = useAppStore();
const handelTriggerToggle = () => {
  appStore.ComboboxOpen = false;
  nextTick(() => {
    toggleSidebar()
  })
}
</script>

<template>
  <md-fab data-sidebar="trigger" @click="handelTriggerToggle" :class="props.class">
    <PanelLeft slot="icon" class="!h-7 !w-7" />
    <span class="sr-only">menu</span>
  </md-fab>
</template>
