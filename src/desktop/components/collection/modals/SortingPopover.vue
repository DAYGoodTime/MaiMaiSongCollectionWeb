<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shadcn/ui/dialog'
import { ArrowUpDown, RotateCcw, Check } from '@lucide/vue'

export interface SortConfiguration {
  primaryField: string
  primaryDirection: 'asc' | 'desc'
  secondaryField: string
  secondaryDirection: 'asc' | 'desc'
  unplayedToBottom: boolean
  preferFitConstant: boolean
  pushSss?: boolean
}

interface Props {
  open: boolean
  currentConfig?: Partial<SortConfiguration>
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<{
  'update:open': [val: boolean]
  'apply': [config: SortConfiguration]
}>()

const defaultConfig: SortConfiguration = {
  primaryField: 'achievement',
  primaryDirection: 'desc',
  secondaryField: 'level',
  secondaryDirection: 'desc',
  unplayedToBottom: true,
  preferFitConstant: false,
  pushSss: false
}

const sortConfig = ref<SortConfiguration>({ ...defaultConfig, ...props.currentConfig })

watch(() => [props.open, props.currentConfig], () => {
  if (props.open) sortConfig.value = { ...defaultConfig, ...props.currentConfig }
})

const primaryOptions = [
  { id: 'level', label: '谱面定数', desc: '按官方/拟合定数高低排序' },
  { id: 'achievement', label: '达成率 (Achievement)', desc: '按历史最高达成率排序' },
  { id: 'rating', label: '单曲 DX Rating', desc: '按成绩 Rating 贡献值排序' },
  { id: 'fit', label: '拟合定数 ', desc: '按水鱼拟合计算定数排序' },
  { id: 'fitDelta', label: '拟合定数差 (Fit Delta)', desc: '按拟合定数与标称定数差值排序' },
  { id: 'dxScore', label: 'DX 分数 (DX Score)', desc: 'DX Score 百分比占比' },
  { id: 'playCount', label: '游玩次数 (Play Count)', desc: '按历史游玩次数排序' }
]

const secondaryOptions = [
  { id: 'achievement', label: '达成率 (Achievement)' },
  { id: 'level', label: '谱面定数 (Level)' },
  { id: 'rating', label: '单曲 DX Rating' },
  { id: 'title', label: '曲名拼音/首字母' }
]

// const applyPreset = (preset: string) => {
//   sortConfig.value.pushSss = preset === 'push-sss'
//   if (preset === 'level-desc') {
//     sortConfig.value.primaryField = 'level'
//     sortConfig.value.primaryDirection = 'desc'
//     sortConfig.value.secondaryField = 'achievement'
//     sortConfig.value.secondaryDirection = 'desc'
//     sortConfig.value.unplayedToBottom = true
//   } else if (preset === 'push-sss') {
//     sortConfig.value.primaryField = 'achievement'
//     sortConfig.value.primaryDirection = 'desc'
//     sortConfig.value.secondaryField = 'level'
//     sortConfig.value.secondaryDirection = 'desc'
//     sortConfig.value.unplayedToBottom = true
//   } else if (preset === 'rating-desc') {
//     sortConfig.value.primaryField = 'rating'
//     sortConfig.value.primaryDirection = 'desc'
//     sortConfig.value.secondaryField = 'level'
//     sortConfig.value.secondaryDirection = 'desc'
//   } else if (preset === 'fit-delta') {
//     sortConfig.value.primaryField = 'fitDelta'
//     sortConfig.value.primaryDirection = 'desc'
//     sortConfig.value.secondaryField = 'level'
//     sortConfig.value.secondaryDirection = 'desc'
//   }
// }

const handleReset = () => {
  sortConfig.value = { ...defaultConfig }
}

const handleApply = () => {
  emit('apply', { ...sortConfig.value })
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="sm:max-w-[680px] max-h-[85vh] overflow-y-auto p-4 sm:p-5 select-none bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-xl shadow-xl">
      <!-- 头部 -->
      <DialogHeader class="pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <ArrowUpDown class="w-4 h-4" />
          </div>
          <div>
            <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
              曲目与成绩排序设置
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-3 py-2 text-xs">
        <!-- 快捷预设条 (Quick Preset Bar) 暂定 -->
        <!-- <div
          class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-2.5 flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] font-bold text-[#64748B] dark:text-slate-400">快捷预设:</span>
        </div> -->

        <!-- 左右两列排序配置 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- 左列: 主排序字段 -->
          <div
            class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[#334155] dark:text-slate-200">1. 第一主排序规则</span>
              <button @click="sortConfig.primaryDirection = sortConfig.primaryDirection === 'desc' ? 'asc' : 'desc'"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-[#BFDBFE] dark:border-blue-800/60 cursor-pointer">
                {{ sortConfig.primaryDirection === 'desc' ? '↓ 降序 (从大到小)' : '↑ 升序 (从小到大)' }}
              </button>
            </div>

            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              <div v-for="opt in primaryOptions" :key="opt.id" @click="sortConfig.primaryField = opt.id"
                class="w-full flex items-center justify-between p-2 rounded-md border cursor-pointer transition-all"
                :class="sortConfig.primaryField === opt.id
                  ? 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#3B82F6] dark:border-blue-500 text-[#1D4ED8] dark:text-blue-300 font-bold'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:bg-slate-50'">
                <div class="min-w-0 pr-1">
                  <div class="text-[11px] truncate">{{ opt.label }}</div>
                  <div class="text-[9px] text-slate-400 font-normal truncate">{{ opt.desc }}</div>
                </div>
                <Check v-if="sortConfig.primaryField === opt.id"
                  class="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
              </div>
            </div>
          </div>

          <!-- 右列: 次级排序与规则 -->
          <div
            class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 flex flex-col justify-between gap-3">
            <div class="space-y-2">
              <span class="font-bold text-[#334155] dark:text-slate-200">2. 次级并列排序规则</span>
              <select v-model="sortConfig.secondaryField"
                class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-[#0F172A] dark:text-white">
                <option v-for="sec in secondaryOptions" :key="sec.id" :value="sec.id">{{ sec.label }}</option>
              </select>
            </div>

            <!-- 特殊排序开关 -->
            <div
              class="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md p-2.5 space-y-2">
              <span class="font-bold text-[11px] text-[#475569] dark:text-slate-300">特殊排序规则:</span>
              <label class="flex items-center gap-2 cursor-pointer text-[#334155] dark:text-slate-300 text-[11px]">
                <input v-model="sortConfig.unplayedToBottom" type="checkbox" class="rounded text-[#2563EB]" />
                <span>未游玩曲目强制置底</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-[#334155] dark:text-slate-300 text-[11px]">
                <input v-model="sortConfig.preferFitConstant" type="checkbox" class="rounded text-[#2563EB]" />
                <span>优先按拟合定数计算难度排序</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <DialogFooter
        class="flex flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button @click="handleReset"
          class="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <RotateCcw class="w-3.5 h-3.5" />
          <span>恢复默认排序</span>
        </button>

        <div class="flex items-center gap-2">
          <button @click="emit('update:open', false)"
            class="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer">
            取消
          </button>
          <button @click="handleApply"
            class="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xs transition-colors cursor-pointer">
            应用排序设置
          </button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
