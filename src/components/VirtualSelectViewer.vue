<script setup lang="ts" generic="T">
import { ref, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { Button } from '@/components/shadcn/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/ui/popover'
import { ChevronsUpDown } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  items: T[]
  placeholder?: string
  itemHeight?: number
  containerHeight?: number
}>(), {
  placeholder: '查看列表',
  itemHeight: 40, // Default height for each item
  containerHeight: 300, // Default height for the scrollable container
})

const parentRef = ref<HTMLElement | null>(null)
const open = ref(false)

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.items.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => props.itemHeight,
    overscan: 5,
  }))
)

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="outline" role="combobox" :aria-expanded="open" class="w-full justify-between">
        {{ props.placeholder }}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-96 p-0">
      <div ref="parentRef" :style="{ height: `${props.containerHeight}px`, overflow: 'auto' }" class="relative">
        <div :style="{ height: `${totalSize}px` }" class="relative w-full">
          <div v-for="row in virtualRows" :key="row.index" :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${row.size}px`,
            transform: `translateY(${row.start}px)`,
          }" class="p-1">
            <slot name="item" :item="props.items[row.index]" :index="row.index" />
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
