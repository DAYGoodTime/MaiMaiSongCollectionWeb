<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/shadcn/ui/dialog'
import { BarChart3, Trophy, Medal, Sparkles } from '@lucide/vue'

interface AnalyticsData {
  totalCharts: number
  avgAchievement: string
  totalPlayCount: number
  rankDistribution: {
    label: string
    count: number
    percentage: number
    color: string
  }[]
  apfcDistribution: {
    label: string
    count: number
    percentage: number
    color: string
  }[]
  syncDistribution: {
    label: string
    count: number
    percentage: number
    color: string
  }[]
  dxStarsDistribution: {
    label: string
    count: number
    percentage: number
    color: string
  }[]
}

interface Props {
  open: boolean
  data?: AnalyticsData
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  data: () => ({
    totalCharts: 0,
    avgAchievement: '0.0000%',
    totalPlayCount: 0,
    rankDistribution: [],
    apfcDistribution: [],
    syncDistribution: [],
    dxStarsDistribution: []
  })
})

const emit = defineEmits<{
  'update:open': [val: boolean]
}>()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="sm:max-w-[720px] max-h-[85vh] overflow-y-auto p-4 sm:p-5 select-none bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-xl shadow-xl">
      <!-- 头部 -->
      <DialogHeader class="pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <BarChart3 class="w-4 h-4" />
          </div>
          <div>
            <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
              全量成绩深度统计看板
            </DialogTitle>
            <DialogDescription class="text-xs text-[#64748B] dark:text-slate-400">
              共统计 {{ props.data.totalCharts }} 张谱面 · 平均达成率 {{ props.data.avgAchievement }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-3.5 py-2 text-xs">
        <!-- 顶部核心双指标卡片 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-lg p-3">
            <span class="text-[11px] font-bold text-[#2563EB] dark:text-blue-400">平均达成率</span>
            <div class="text-xl font-bold font-mono text-[#1E40AF] dark:text-blue-200 mt-1">
              {{ props.data.avgAchievement }}
            </div>
          </div>

          <div
            class="bg-[#F0FDF4] dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-lg p-3">
            <span class="text-[11px] font-bold text-[#16A34A] dark:text-emerald-400">总累计游玩次数</span>
            <div class="text-xl font-bold font-mono text-[#166534] dark:text-emerald-200 mt-1">
              {{ props.data.totalPlayCount }} 次
            </div>
          </div>
        </div>

        <!-- 评级阶梯分布 -->
        <div
          class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 space-y-2.5">
          <div class="flex items-center gap-1.5 font-bold text-[#334155] dark:text-slate-200">
            <Trophy class="w-3.5 h-3.5 text-amber-500" />
            <span>达成率评级阶梯分布</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="rank in props.data.rankDistribution" :key="rank.label"
              class="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-md p-2 space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-medium text-[#475569] dark:text-slate-300">{{ rank.label }}</span>
                <span class="font-mono font-bold text-[#0F172A] dark:text-white">
                  {{ rank.count }} 首 ({{ rank.percentage }}%)
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300" :class="rank.color"
                  :style="{ width: `${rank.percentage}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 奖牌与星级三栏统计 (AP/FC, Sync, DX Stars) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <!-- 1. AP / FC 全连 -->
          <div
            class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-2.5 space-y-2">
            <div class="flex items-center gap-1 font-bold text-[11px] text-[#334155] dark:text-slate-200">
              <Medal class="w-3 h-3 text-amber-500" />
              <span>AP / FC 全连统计</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="item in props.data.apfcDistribution" :key="item.label" class="space-y-0.5">
                <div class="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>{{ item.label }}</span>
                  <span class="font-mono font-bold">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
                <div class="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" :class="item.color" :style="{ width: `${item.percentage}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. FS / FDX 同步 -->
          <div
            class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-2.5 space-y-2">
            <div class="flex items-center gap-1 font-bold text-[11px] text-[#334155] dark:text-slate-200">
              <Sparkles class="w-3 h-3 text-blue-500" />
              <span>FS / FDX 同步统计</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="item in props.data.syncDistribution" :key="item.label" class="space-y-0.5">
                <div class="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>{{ item.label }}</span>
                  <span class="font-mono font-bold">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
                <div class="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" :class="item.color" :style="{ width: `${item.percentage}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. DX 分星级分布 -->
          <div
            class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-2.5 space-y-2">
            <div class="flex items-center gap-1 font-bold text-[11px] text-[#334155] dark:text-slate-200">
              <Trophy class="w-3 h-3 text-yellow-500" />
              <span>DX 分星级分布</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="item in props.data.dxStarsDistribution" :key="item.label" class="space-y-0.5">
                <div class="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>{{ item.label }}</span>
                  <span class="font-mono font-bold">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
                <div class="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" :class="item.color" :style="{ width: `${item.percentage}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
