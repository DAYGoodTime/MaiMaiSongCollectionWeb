<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from './utils'
import { MdFab } from '@material/web/fab/fab.js'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <md-fab data-sidebar="trigger" @click="toggleSidebar" :class="props.class">
    <PanelLeft slot="icon" class="!h-7 !w-7" />
    <span class="sr-only">menu</span>
  </md-fab>
</template>
