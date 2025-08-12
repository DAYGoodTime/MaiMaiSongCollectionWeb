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
  <Button data-sidebar="trigger" variant="ghost" :class="cn('md:h-9 md:w-9 h-12 w-12 p-0', props.class)"
    @click="toggleSidebar">
    <PanelLeft class="!w-7 !h-7" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
