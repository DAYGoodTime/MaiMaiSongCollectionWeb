<!--
TODO:
- 合集导出图片长图
- 云端同步状态指示
-->

<script setup lang="ts">
import { ref } from 'vue'
import { Folder, Plus, BarChart3, Download, Settings } from '@lucide/vue'
import CollectionManageDialog from './modals/CollectionManageDialog.vue'

interface Props {
  collectionName?: string
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  collectionName: '未选择合集',
  totalCount: 0
})

const emit = defineEmits<{
  'open-import': []
  'open-analytics': []
  'export-json': []
  'export-csv': []
}>()

const isManageDialogOpen = ref(false)
</script>

<template>
  <div class="flex items-center justify-between gap-3 w-full shrink-0 select-none">
    <!-- 左侧标题与面包屑 -->
    <div class="flex flex-col gap-0.5 min-w-0">
      <div class="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
        <span>合集管理</span>
        <span>/</span>
        <span class="text-[#334155] dark:text-slate-300 truncate">{{ props.collectionName }}</span>
      </div>

      <div class="flex items-center gap-2">
        <h1 class="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[#0F172A] dark:text-white truncate">
          {{ props.collectionName }}
        </h1>
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-[#BFDBFE] dark:border-blue-800/60 shrink-0">
          <Folder class="w-3 h-3" />
          <span>个人合集 · {{ props.totalCount }} 首</span>
        </span>
      </div>
    </div>

    <!-- 右侧操作按钮组 -->
    <div class="flex items-center gap-2 shrink-0">
      <button
        @click="isManageDialogOpen = true"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] shadow-xs transition-all cursor-pointer"
        title="管理合集">
        <Settings class="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
        <span>管理合集</span>
      </button>

      <button
        @click="emit('open-import')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] shadow-xs transition-all cursor-pointer">
        <Plus class="w-3.5 h-3.5" />
        <span>批量导入</span>
      </button>

      <button
        @click="emit('open-analytics')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] shadow-xs transition-all cursor-pointer">
        <BarChart3 class="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
        <span>统计看板</span>
      </button>

      <button
        @click="emit('export-json')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] shadow-xs transition-all cursor-pointer"
        title="导出全部合集 JSON">
        <Download class="w-3.5 h-3.5" />
        <span>导出 JSON</span>
      </button>

      <button
        @click="emit('export-csv')"
        class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] shadow-xs transition-all cursor-pointer"
        title="导出当前列表 CSV">
        <span>CSV</span>
      </button>
    </div>
  </div>

  <!-- 合集管理弹窗 -->
  <CollectionManageDialog v-model:open="isManageDialogOpen" />
</template>
