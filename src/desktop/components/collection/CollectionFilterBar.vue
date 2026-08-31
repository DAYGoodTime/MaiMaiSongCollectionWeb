<!--
================================================================================
TODO (CollectionFilterBar 待对接高级筛选与排序联动逻辑):
--------------------------------------------------------------------------------
1. [ ] 对接 FlexSearch 局部过滤以及防抖输入
2. [ ] 接入多选难度 Chip 组合筛选联动
3. [ ] 联动定数双向滑块过滤与预设区间
4. [ ] 联动多级复合排序算法 (主次排序规则及未游玩置底逻辑)
================================================================================
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  X,
  Zap,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ChevronDown
} from '@lucide/vue'
import { Switch } from '@/components/shadcn/ui/switch'
import { Label } from '@/components/shadcn/ui/label'
import { useAppStore } from '@/store/appStore'

export interface FilterState {
  searchQuery: string
  selectedDiff: string // 'ALL' | 'EXP' | 'MAS' | 'Re:MAS' | '宴'
  levelRange: string // 'all' | '14.0-14.9' | etc.
  activeFilterCount: number
  sortField: string // 'level' | 'achievement' | 'rating' | 'fit' | 'dxScore' | 'playCount'
  sortOrder: 'asc' | 'desc'
}

interface Props {
  modelValue: FilterState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [val: FilterState]
  'open-adv-filter': []
  'open-sort-modal': []
}>()

const appStore = useAppStore()

const diffOptions = [
  { id: 'ALL', label: '全部' },
  { id: 'EXP', label: 'EXP', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60' },
  { id: 'MAS', label: 'MAS', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60' },
  { id: 'Re:MAS', label: 'Re:MAS', color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800/60' },
  { id: '宴', label: '宴', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60' }
]

const levelOptions = [
  { id: 'all', label: '定数: 全部' },
  { id: '14.6-14.9', label: '定数: 14+' },
  { id: '14.0-14.5', label: '定数: 14' },
  { id: '13.6-13.9', label: '定数: 13+' },
  { id: '13.0-13.5', label: '定数: 13' },
  { id: '12.6-12.9', label: '定数: 12+' },
  { id: '12.0-12.5', label: '定数: 12' }
]

const sortFieldLabels: Record<string, string> = {
  level: '定数 (Level)',
  achievement: '达成率 (Ach)',
  rating: 'DX Rating',
  fit: '拟合定数 (Fit)',
  dxScore: 'DX 分数',
  playCount: '游玩次数'
}

const isLevelMenuOpen = ref(false)

const currentSortLabel = computed(() => {
  return sortFieldLabels[props.modelValue.sortField] || '定数 (Level)'
})

const updateSearch = (query: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    searchQuery: query
  })
}

const selectDiff = (diff: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    selectedDiff: diff
  })
}

const selectLevel = (level: string) => {
  isLevelMenuOpen.value = false
  emit('update:modelValue', {
    ...props.modelValue,
    levelRange: level
  })
}

const toggleSortOrder = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    sortOrder: props.modelValue.sortOrder === 'desc' ? 'asc' : 'desc'
  })
}
</script>

<template>
  <div
    class="w-full bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-2.5 shadow-xs shrink-0 select-none transition-colors">
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
      <!-- 左侧筛选组 (搜索 + 难度 Chips + 定数下拉 + 高级筛选) -->
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <!-- 搜索输入框 -->
        <div
          class="relative flex items-center bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 rounded-md px-2.5 py-1.5 gap-1.5 w-full sm:w-56 lg:w-60 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
          <Search class="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <input :value="props.modelValue.searchQuery" @input="updateSearch(($event.target as HTMLInputElement).value)"
            type="text" placeholder="搜索曲名 / 谱师 / ID..."
            class="w-full bg-transparent border-none outline-none text-xs text-[#0F172A] dark:text-white placeholder:text-slate-400" />
          <button v-if="props.modelValue.searchQuery" @click="updateSearch('')"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- 难度分段 Chips -->
        <div class="flex items-center gap-1">
          <button v-for="diff in diffOptions" :key="diff.id" @click="selectDiff(diff.id)"
            class="px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border" :class="[
              props.modelValue.selectedDiff === diff.id
                ? (diff.id === 'ALL'
                  ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] border-transparent shadow-xs'
                  : (diff.color || 'bg-[#2563EB] text-white border-transparent'))
                : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
            ]">
            {{ diff.label }}
          </button>
        </div>

        <!-- 定数快捷下拉菜单 -->
        <div class="relative">
          <button @click="isLevelMenuOpen = !isLevelMenuOpen"
            class="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <span>{{levelOptions.find(o => o.id === props.modelValue.levelRange)?.label || '定数: 全部'}}</span>
            <ChevronDown class="w-3 h-3 text-slate-400" />
          </button>

          <!-- 下拉浮层 -->
          <div v-if="isLevelMenuOpen"
            class="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-700 rounded-md shadow-lg py-1 z-30 space-y-0.5">
            <button v-for="opt in levelOptions" :key="opt.id" @click="selectLevel(opt.id)"
              class="w-full text-left px-2.5 py-1.5 text-xs text-[#334155] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
              :class="{ 'font-bold text-[#2563EB] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30': props.modelValue.levelRange === opt.id }">
              <span>{{ opt.label }}</span>
              <span v-if="props.modelValue.levelRange === opt.id" class="text-xs text-[#2563EB]">✓</span>
            </button>
          </div>
        </div>

        <!-- 高级筛选按钮 -->
        <button @click="emit('open-adv-filter')"
          class="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-800/60 text-[#2563EB] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
          <Zap class="w-3 h-3" />
          <span>高级筛选</span>
          <span v-if="props.modelValue.activeFilterCount > 0"
            class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#2563EB] text-white shrink-0">
            {{ props.modelValue.activeFilterCount }}
          </span>
        </button>

        <!-- 显示拟合定数 开关 -->
        <div
          class="flex items-center gap-1.5 px-2 py-1 rounded bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#CBD5E1] dark:border-slate-700 h-[26px]">
          <Switch id="show-fit-level-switch" :model-value="appStore.showFitLevel"
            @update:model-value="(val: boolean) => appStore.showFitLevel = val"
            class="scale-75 origin-center cursor-pointer" />
          <Label for="show-fit-level-switch"
            class="text-[11px] font-medium text-[#334155] dark:text-slate-200 cursor-pointer select-none whitespace-nowrap">
            显示拟合定数
          </Label>
        </div>
      </div>

      <!-- 右侧排序组 -->
      <div class="flex items-center gap-1.5 self-end lg:self-auto shrink-0">
        <!-- 排序字段选择 (点击可呼出排序配置面板) -->
        <button @click="emit('open-sort-modal')"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#CBD5E1] dark:border-slate-700 text-[#1E293B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="点击配置主次排序方式与规则">
          <ArrowUpDown class="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
          <span>{{ currentSortLabel }}</span>
          <span class="text-[9px] text-[#94A3B8]">▾</span>
        </button>

        <!-- 升序/降序切换 -->
        <button @click="toggleSortOrder"
          class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-800/60 text-[#2563EB] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          :title="props.modelValue.sortOrder === 'desc' ? '当前降序 (高到低)' : '当前升序 (低到高)'">
          <ArrowDown v-if="props.modelValue.sortOrder === 'desc'" class="w-3.5 h-3.5" />
          <ArrowUp v-else class="w-3.5 h-3.5" />
          <span>{{ props.modelValue.sortOrder === 'desc' ? '降序' : '升序' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
