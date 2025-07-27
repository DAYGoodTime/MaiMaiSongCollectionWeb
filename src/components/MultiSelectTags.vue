<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Badge } from '@/components/shadcn/ui/badge'
import type { FilterProps } from '@/types/component';
import type { AcceptableValue } from 'reka-ui';

const props = defineProps<{
  options: FilterProps<any>[]
  selected: FilterProps<any>[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'selection-change', selected: FilterProps<any>[]): void
}>()

const selectValue = ref('')

function toggleOption(option: FilterProps<any>) {
  const newSelected = props.selected.includes(option)
    ? props.selected.filter(item => item !== option)
    : [...props.selected, option]
  emit('selection-change', newSelected)
}

function handleSelectChange(value: AcceptableValue) {
  if (value) {
    toggleOption(value as FilterProps<any>)
    selectValue.value = ''
  }
}

function removeOption(option: FilterProps<any>) {
  toggleOption(option)
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="props.selected.length > 0" class="flex flex-wrap gap-2">
      <template v-for="item in props.selected" :key="item">
        <Badge variant="secondary" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800">
          <slot name="selected-item" :item="item" :remove-option="removeOption">
            {{ item.label }}
          </slot>
          <button class="hover:bg-blue-200 rounded-full p-0.5" @click="removeOption(item)">
            <X :size="12" />
          </button>
        </Badge>
      </template>
    </div>
    <Select v-model="selectValue" @update:model-value="handleSelectChange">
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="props.placeholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in props.options.filter(opt => !props.selected.includes(opt))" :key="option.label"
          :value="option">
          <slot name="option-item" :option="option">
            {{ option.label }}
          </slot>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
