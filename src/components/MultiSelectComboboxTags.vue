<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Search, ChevronDown } from 'lucide-vue-next'
import { Combobox, ComboboxAnchor, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from '@/components/shadcn/ui/combobox'
import { Badge } from '@/components/shadcn/ui/badge'
import type { FilterProps } from '@/types/component';
import type { AcceptableValue } from 'reka-ui';
import { cn } from '@/lib/utils';
import { toPy } from '@/utils/StrUtil';

const props = defineProps<{
  options: FilterProps<any>[]
  selected: FilterProps<any>[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'selection-change', selected: FilterProps<any>[]): void
}>()

const selectValue = ref('')
const searchValue = ref('')

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

const filteredOptions = computed(() => {
  return props.options.filter(opt =>
    !props.selected.includes(opt) && toPy(opt.value).includes(toPy(searchValue.value))
  )
})
</script>

<template>
  <div class="space-y-2">
    <div v-if="props.selected.length > 0" class="flex flex-wrap gap-2">
      <template v-for="item in props.selected" :key="item">
        <Badge variant="secondary" class="inline-flex items-center gap-1 px-2 py-1 bg-border font-normal">
          <slot name="selected-item" :item="item" :remove-option="removeOption">
            {{ item.label }}
          </slot>
          <button class="hover:opacity-70 rounded-full p-0.5" @click="removeOption(item)">
            <X :size="12" />
          </button>
        </Badge>
      </template>
    </div>
    <Combobox class="w-full" v-model="selectValue" by="label" @update:model-value="handleSelectChange"
      :ignore-filter="true">
      <ComboboxAnchor as-child class="w-full">
        <ComboboxTrigger as-child>
          <button :class="cn(
            'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start',
            'w-full'
          )">
            <span class="text-muted-foreground">{{ props.placeholder }}</span>
            <ChevronDown class="w-4 h-4 opacity-50 shrink-0" />
          </button>
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxList class="max-h-96 w-full" side="bottom">
        <div class="relative w-full max-w-sm items-center">
          <ComboboxInput class="pl-9 focus-visible:ring-0 border-0 border-b rounded-none h-10" placeholder="选择区域..."
            v-model:model-value="searchValue" />
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
            <Search class="size-4 text-muted-foreground" />
          </span>
        </div>

        <ComboboxEmpty>
          <div class="text-center text-sm text-muted-foreground">没有符合的区域</div>
        </ComboboxEmpty>

        <ComboboxGroup>
          <ComboboxItem v-for="option in filteredOptions" :key="option.value" :value="option">
            <slot name="option-item" :option="option">
              {{ option.label }}
            </slot>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </Combobox>
  </div>
</template>
