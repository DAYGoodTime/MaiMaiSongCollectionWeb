<!--
================================================================================
TODO (CollectionMetricStrip 待对接真实统计计算逻辑):
--------------------------------------------------------------------------------
1. [ ] 结合当前筛选后的歌曲列表动态计算平均达成率与拟合定数均值
2. [ ] 实时统计 SSS+/SSS 评级占比及 AP/FC 奖牌达成比例
3. [ ] 联动个人战绩历史，计算总游玩 PC 累计次数
================================================================================
-->

<script setup lang="ts">
interface MetricStats {
  avgAchievement?: string
  avgSubText?: string
  ssspCount?: string
  ssspSubText?: string
  sssCount?: string
  sssSubText?: string
  apCount?: string
  apSubText?: string
  playCount?: string
  playCountSubText?: string
}

interface Props {
  stats?: MetricStats
}

const props = withDefaults(defineProps<Props>(), {
  stats: () => ({
    avgAchievement: '0.0000%',
    avgSubText: '超均值 0/0',
    ssspCount: '0/0',
    ssspSubText: '占比 0%',
    sssCount: '0/0',
    sssSubText: '占比 0%',
    apCount: '0/0',
    apSubText: 'FC 0/0',
    playCount: '0 次',
    playCountSubText: '无数据'
  })
})
</script>

<template>
  <div
    class="w-full bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-2.5 sm:p-3 shadow-xs shrink-0 select-none transition-colors overflow-x-auto custom-scrollbar">
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-[620px] lg:min-w-0">
      <!-- 1. 平均达成率 -->
      <div class="flex flex-col gap-0.5 border-r border-slate-100 dark:border-slate-800/80 pr-2 last:border-none">
        <span class="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 font-medium">平均达成率</span>
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white font-mono">
            {{ props.stats.avgAchievement }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-[#94A3B8] dark:text-slate-500 truncate">
            {{ props.stats.avgSubText }}
          </span>
        </div>
      </div>

      <!-- 2. SSS+ (鸟加) -->
      <div class="flex flex-col gap-0.5 border-r border-slate-100 dark:border-slate-800/80 pr-2 last:border-none">
        <span class="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 font-medium">SSS+ (鸟加)</span>
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white font-mono">
            {{ props.stats.ssspCount }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-[#94A3B8] dark:text-slate-500 truncate">
            {{ props.stats.ssspSubText }}
          </span>
        </div>
      </div>

      <!-- 3. SSS (鸟) -->
      <div class="flex flex-col gap-0.5 border-r border-slate-100 dark:border-slate-800/80 pr-2 last:border-none">
        <span class="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 font-medium">SSS (鸟)</span>
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white font-mono">
            {{ props.stats.sssCount }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-[#94A3B8] dark:text-slate-500 truncate">
            {{ props.stats.sssSubText }}
          </span>
        </div>
      </div>

      <!-- 4. AP / AP+ -->
      <div class="flex flex-col gap-0.5 border-r border-slate-100 dark:border-slate-800/80 pr-2 last:border-none">
        <span class="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 font-medium">AP / AP+</span>
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white font-mono">
            {{ props.stats.apCount }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-[#94A3B8] dark:text-slate-500 truncate">
            {{ props.stats.apSubText }}
          </span>
        </div>
      </div>

      <!-- 5. 总游玩次数 -->
      <div class="flex flex-col gap-0.5">
        <span class="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 font-medium">总游玩次数</span>
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white font-mono">
            {{ props.stats.playCount }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-[#94A3B8] dark:text-slate-500 truncate">
            {{ props.stats.playCountSubText }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}
</style>
