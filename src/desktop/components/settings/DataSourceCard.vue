<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from '@lucide/vue'

export interface StatItem {
  label: string
  value: string
  highlight?: boolean
}

interface Props {
  title: string
  isDefault?: boolean
  showDefaultOption?: boolean
  badgeText?: string
  badgeType?: 'default' | 'non-default' | 'none'
  stats?: StatItem[]
  syncButtonText?: string
  syncIcon?: string
  isSyncing?: boolean
  hasData?: boolean
  canExport?: boolean
  canDelete?: boolean
  customDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  isDefault: false,
  showDefaultOption: true,
  badgeType: 'none',
  stats: () => [],
  syncButtonText: '立即同步',
  isSyncing: false,
  hasData: true,
  canExport: true,
  canDelete: true
})

const emit = defineEmits<{
  setDefault: []
  export: []
  delete: []
  sync: []
}>()

const computedBadgeType = computed(() => {
  if (props.badgeType !== 'none') return props.badgeType
  if (props.isDefault) return 'default'
  if (props.showDefaultOption) return 'non-default'
  return 'none'
})

const computedBadgeText = computed(() => {
  if (props.badgeText) return props.badgeText
  if (props.isDefault) return '★ 默认数据源'
  if (props.showDefaultOption) return '非默认'
  return ''
})
</script>

<template>
  <div
    class="w-full bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-4 flex flex-col justify-between gap-2.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">

    <!-- 卡片头部 Header -->
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <slot name="icon" />
          <h3 class="text-[13px] font-bold text-[#0F172A] dark:text-white truncate">
            {{ props.title }}
          </h3>
        </div>

        <!-- 状态徽章 Badge -->
        <span v-if="computedBadgeType !== 'none'"
          class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors"
          :class="computedBadgeType === 'default'
            ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 border-[#93C5FD] dark:border-blue-800'
            : 'bg-[#F8FAFC] dark:bg-slate-800/80 text-[#64748B] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700'">
          {{ computedBadgeText }}
        </span>
      </div>

      <!-- 自定义描述（可选） -->
      <p v-if="props.customDescription" class="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
        {{ props.customDescription }}
      </p>

      <!-- 统计信息行 Stats Rows -->
      <div v-if="props.stats && props.stats.length > 0" class="space-y-1.5 pt-1">
        <div v-for="(item, idx) in props.stats" :key="idx"
          class="flex items-center justify-between text-[11px] leading-tight">
          <span class="text-[#64748B] dark:text-slate-400">{{ item.label }}</span>
          <span class="font-bold truncate max-w-[65%]"
            :class="item.highlight ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#0F172A] dark:text-slate-200'">
            {{ item.value }}
          </span>
        </div>
      </div>

      <!-- 自定义插槽内容 -->
      <slot />
    </div>

    <!-- 底部操作按钮栏 Action Buttons Row -->
    <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
      <div class="flex items-center gap-1.5 min-w-0">
        <!-- 设为默认 / 已默认 -->
        <button v-if="props.showDefaultOption" @click="!props.isDefault && emit('setDefault')"
          :disabled="props.isDefault || !props.hasData"
          class="h-8 px-2.5 rounded-md text-[11px] font-bold border transition-colors shrink-0 cursor-pointer"
          :class="props.isDefault
            ? 'bg-[#F1F5F9] dark:bg-slate-800 text-[#94A3B8] dark:text-slate-500 border-[#E2E8F0] dark:border-slate-700 cursor-default'
            : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:bg-slate-200'">
          {{ props.isDefault ? '已默认' : '设为默认' }}
        </button>

        <!-- 导出 -->
        <button v-if="props.canExport" @click="emit('export')" :disabled="!props.hasData"
          class="h-8 px-2.5 rounded-md text-[11px] font-bold border bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          title="导出数据备份">
          导出
        </button>

        <!-- 删除 -->
        <button v-if="props.canDelete" @click="emit('delete')" :disabled="!props.hasData"
          class="h-8 px-2.5 rounded-md text-[11px] font-bold border bg-[#FEF2F2] dark:bg-red-950/30 text-[#DC2626] dark:text-red-400 border-[#FECACA] dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/40 active:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          title="删除本地缓存数据">
          删除
        </button>
      </div>

      <!-- 立即同步 Primary Action -->
      <button @click="emit('sync')" :disabled="props.isSyncing"
        class="h-8 w-24 px-2.5 rounded-md text-[11px] font-bold bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ml-auto">
        <RefreshCw class="w-3.5 h-3.5 shrink-0" :class="{ 'animate-spin': props.isSyncing }" />
        <span class="truncate">{{ props.isSyncing ? '同步中...' : props.syncButtonText }}</span>
      </button>
    </div>

  </div>
</template>
