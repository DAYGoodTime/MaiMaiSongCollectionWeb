<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { X, ChevronDown, Check } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import type { FilterProps } from '@/types/component'
import { toPy } from '@/utils/StrUtil'

interface Props {
  options: FilterProps<any>[]
  selected?: FilterProps<any>[]
  placeholder?: string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  selected: () => [],
  placeholder: '搜索并选择区域...',
  emptyText: '没有找到匹配的区域'
})

const emit = defineEmits<{
  'update:selected': [selected: FilterProps<any>[]]
  'selection-change': [selected: FilterProps<any>[]]
}>()

const searchTerm = ref('')
const isDropdownOpen = ref(false)
const activeIndex = ref(-1)

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

onClickOutside(containerRef, () => {
  isDropdownOpen.value = false
  activeIndex.value = -1
})

const isSelected = (opt: FilterProps<any>) => {
  return props.selected.some(item => item.value === opt.value)
}

const filteredOptions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  const unselectedOptions = props.options.filter(opt => !isSelected(opt))
  if (!query) return unselectedOptions

  const queryPy = toPy(query).toLowerCase()
  return unselectedOptions.filter(opt => {
    const label = opt.label.toLowerCase()
    const value = String(opt.value).toLowerCase()
    return (
      label.includes(query) ||
      value.includes(query) ||
      toPy(label).toLowerCase().includes(queryPy)
    )
  })
})

const toggleOption = (option: FilterProps<any>) => {
  const exists = isSelected(option)
  const newSelected = exists
    ? props.selected.filter(item => item.value !== option.value)
    : [...props.selected, option]
  emit('update:selected', newSelected)
  emit('selection-change', newSelected)
}

const selectOption = (option: FilterProps<any>) => {
  if (!isSelected(option)) {
    toggleOption(option)
  }
  searchTerm.value = ''
  activeIndex.value = -1
  inputRef.value?.focus()
}

const removeOption = (option: FilterProps<any>) => {
  const newSelected = props.selected.filter(item => item.value !== option.value)
  emit('update:selected', newSelected)
  emit('selection-change', newSelected)
}

const clearAll = () => {
  emit('update:selected', [])
  emit('selection-change', [])
  searchTerm.value = ''
  activeIndex.value = -1
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    isDropdownOpen.value = true
    if (filteredOptions.value.length > 0) {
      activeIndex.value = (activeIndex.value + 1) % filteredOptions.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredOptions.value.length > 0) {
      activeIndex.value = (activeIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0 && activeIndex.value < filteredOptions.value.length) {
      selectOption(filteredOptions.value[activeIndex.value])
    } else if (filteredOptions.value.length === 1) {
      selectOption(filteredOptions.value[0])
    }
  } else if (e.key === 'Backspace' && !searchTerm.value && props.selected.length > 0) {
    removeOption(props.selected[props.selected.length - 1])
  } else if (e.key === 'Escape') {
    isDropdownOpen.value = false
    activeIndex.value = -1
  }
}
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- 主输入框与已选 Tag 容器 -->
    <div
      @click="inputRef?.focus()"
      class="flex flex-wrap items-center gap-1.5 p-1.5 min-h-[34px] bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-md transition-all focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] cursor-text"
    >
      <!-- 已选区域 Tag Chips -->
      <template v-for="item in props.selected" :key="item.value">
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border border-[#BFDBFE] dark:border-blue-800/60 transition-all animate-in fade-in zoom-in-95 duration-100 shrink-0"
        >
          <span class="max-w-[200px] truncate">{{ item.label }}</span>
          <button
            type="button"
            @click.stop="removeOption(item)"
            class="hover:opacity-75 focus:outline-none cursor-pointer flex items-center justify-center p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900"
            title="移除"
          >
            <X class="w-3 h-3" />
          </button>
        </span>
      </template>

      <!-- 搜索输入框 -->
      <div class="flex-1 flex items-center min-w-[90px] gap-1">
        <input
          ref="inputRef"
          v-model="searchTerm"
          type="text"
          :placeholder="props.selected.length === 0 ? props.placeholder : '搜索添加更多...'"
          class="w-full bg-transparent border-none outline-none text-xs text-[#0F172A] dark:text-white placeholder:text-slate-400 placeholder:text-[11px]"
          @focus="isDropdownOpen = true"
          @keydown="handleKeyDown"
        />
      </div>

      <!-- 右侧快捷操作 -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="props.selected.length > 0"
          type="button"
          @click.stop="clearAll"
          class="text-[10px] font-medium text-slate-400 hover:text-red-500 transition-colors px-1 cursor-pointer"
          title="清空所有选择"
        >
          清空
        </button>
        <button
          type="button"
          @click.stop="isDropdownOpen = !isDropdownOpen"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-150 cursor-pointer p-0.5"
          :class="{ 'rotate-180': isDropdownOpen }"
          title="展开选项列表"
        >
          <ChevronDown class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 下拉选项列表面板 -->
    <div
      v-show="isDropdownOpen"
      class="absolute z-50 left-0 right-0 top-[calc(100%+4px)] max-h-52 overflow-y-auto custom-scrollbar bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-[#26354D] rounded-lg shadow-xl p-1 animate-in fade-in slide-in-from-top-1 duration-150 text-xs"
    >
      <div v-if="filteredOptions.length === 0" class="py-3 text-center text-slate-400 text-xs">
        {{ props.emptyText }}
      </div>
      <div v-else class="space-y-0.5">
        <button
          v-for="(option, idx) in filteredOptions"
          :key="option.value"
          type="button"
          @click="selectOption(option)"
          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer"
          :class="idx === activeIndex
            ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 font-bold'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'"
        >
          <span class="truncate">{{ option.label }}</span>
          <Check v-if="isSelected(option)" class="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>
