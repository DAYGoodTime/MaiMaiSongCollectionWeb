<script setup lang="ts">
import { Button } from '@/components/shadcn/ui/button'
import type { FilterProps } from '@/types/component';
import { Check } from 'lucide-vue-next';

const props = defineProps<{
  options: FilterProps<any>[]
  selected: FilterProps<any>[]
}>()

const emit = defineEmits<{
  (e: 'selection-change', selected: FilterProps<any>[]): void
}>()

function isSelected(option: FilterProps<any>) {
  return props.selected.some(item => item.label === option.label);
}

function toggleOption(option: FilterProps<any>) {
  const newSelected = isSelected(option)
    ? props.selected.filter(item => item.label !== option.label)
    : [...props.selected, option]
  emit('selection-change', newSelected)
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <template v-for="option in props.options" :key="option.value">
      <slot :option="option" :selected="isSelected(option)" :toggle-option="toggleOption">
        <Button variant="outline" size="sm" :class="{
          'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:text-white': isSelected(option),
          'bg-white  border-gray-300 hover:bg-gray-100': !isSelected(option),
        }" @click="toggleOption(option)">
          <slot name="option-item" :option="option">
            <div class="flex justify-between items-center gap-1">
              <Check v-if="isSelected(option)" />
              <span>{{ option.label }}</span>
            </div>
          </slot>
        </Button>
      </slot>
    </template>
  </div>
</template>
