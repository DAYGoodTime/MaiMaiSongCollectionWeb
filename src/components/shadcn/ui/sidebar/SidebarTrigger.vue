<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PanelLeft } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/shadcn/ui/button'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button data-sidebar="trigger" variant="ghost" size="icon" :class="cn('md:h-7 md:w-7 h-9 w-9', props.class)"
    @click="toggleSidebar">
    <PanelLeft class="" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
