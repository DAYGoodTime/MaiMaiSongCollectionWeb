<script setup lang="ts">
import { computed, type Directive } from 'vue'
import CoverImage from '@/components/CoverImage.vue'
import { getAchievementIcon, getFCFSIcon, getImageAssertUrl } from '@/utils/urlUtils'
import { conventFcFsStr, formatAchievement } from '@/utils/StrUtil'
import { useAppStore } from '@/store/appStore'
import { useCopyHelper } from '@/utils/functionUtil'

export interface CollectionCardItem {
  scoreId: string
  id: number
  displayId: number
  title: string
  artist: string
  diffName: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'Re:MASTER' | '宴'
  diffLevel: string
  chartType: 'dx' | 'standard' | 'utage'
  achievement?: number
  rateType?: string
  dxRating?: number
  playCount?: number
  fitLevel?: string
  fitDelta?: string
  fc?: string
  fs?: string
  dxStar?: number
  dxScore?: number
  totalDxScore?: number
  isPlayed?: boolean
}

interface Props {
  item: CollectionCardItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'click': [item: CollectionCardItem]
  'dblclick': [item: CollectionCardItem]
  'contextmenu': [event: MouseEvent, item: CollectionCardItem]
}>()

const appStore = useAppStore()
const { handelCopy } = useCopyHelper()

// 是否处于拟合定数展示模式
const isShowingFit = computed(() => appStore.showFitLevel && !!props.item.fitLevel)

// 定数位置展示的文本 (开启显示拟合定数后替换为拟合定数及其逆差)
const displayLevelText = computed(() => {
  if (appStore.showFitLevel && props.item.fitLevel) {
    return `${props.item.fitLevel}?${props.item.fitDelta ? `(${props.item.fitDelta})` : ''}`
  }
  return props.item.diffLevel
})

// 难度对应的卡片主体背景色
const diffStageStyle = computed(() => {
  switch (props.item.diffName) {
    case 'BASIC':
      return 'bg-BASIC text-white'
    case 'ADVANCED':
      return 'bg-ADVANCED text-white'
    case 'EXPERT':
      return 'bg-EXPERT text-white'
    case 'MASTER':
      return 'bg-MASTER text-white'
    case 'Re:MASTER':
      return 'bg-REMASTER text-white'
    case '宴':
      return 'bg-UTAGE text-white'
    default:
      return 'bg-MASTER text-white'
  }
})

const isUtage = computed(() => props.item.diffName === '宴' || props.item.chartType === 'utage')

// 使用 resource 下的 DX / SD 官方图标
const typeIconUrl = computed(() => {
  if (isUtage.value) return ''
  return getImageAssertUrl(props.item.chartType === 'dx' ? 'DX' : 'SD')
})

const rankIconUrl = computed(() => {
  if (!props.item.rateType) return ''
  return getAchievementIcon(props.item.rateType)
})

const fcIconUrl = computed(() => {
  if (!props.item.fc) return ''
  return getFCFSIcon(conventFcFsStr(props.item.fc))
})

const fsIconUrl = computed(() => {
  if (!props.item.fs) return ''
  return getFCFSIcon(conventFcFsStr(props.item.fs))
})

const dxIconUrl = computed(() => {
  if (!props.item.dxStar || props.item.dxStar <= 0) return ''
  return getImageAssertUrl(`UI_GAM_DXScoreIcon_${props.item.dxStar}`)
})

const dxScoreTooltip = computed(() => {
  if (props.item.dxScore !== undefined && props.item.totalDxScore && props.item.totalDxScore > 0) {
    const percent = ((props.item.dxScore / props.item.totalDxScore) * 100).toFixed(1)
    return `${props.item.dxScore} / ${props.item.totalDxScore} (${percent}%)`
  }
  if (props.item.dxStar && props.item.dxStar > 0) {
    return `DX Score: ${props.item.dxStar} 星`
  }
  return 'DX Score: 暂无数据'
})

const dxRatingTooltip = computed(() => {
  if (props.item.dxRating !== undefined) {
    return `DX Rating: +${props.item.dxRating}`
  }
  return ''
})

const formattedAchievement = computed(() => {
  if (props.item.achievement === undefined || props.item.achievement === null) return '暂未游玩'
  return `${formatAchievement(props.item.achievement)}%`
})

const fitDeltaClass = computed(() => {
  if (!props.item.fitDelta) return 'text-slate-500 dark:text-slate-400'
  if (props.item.fitDelta.startsWith('+')) return 'text-amber-500 dark:text-amber-400 font-semibold'
  return 'text-emerald-500 dark:text-emerald-400 font-semibold'
})

type ScrollEl = HTMLElement & { __clip?: HTMLElement }

const applyOverflow = (el: HTMLElement) => {
  const overflow = el.scrollWidth - (el.parentElement?.clientWidth ?? 0)
  if (overflow > 0) {
    el.style.setProperty('--scroll-dist', `-${overflow}px`)
    el.classList.add('is-overflowing')
  } else {
    el.style.removeProperty('--scroll-dist')
    el.classList.remove('is-overflowing')
  }
}

// ponytail: one RO for all cards; observe clip parent (inline-block title does not resize)
const titleRo = new ResizeObserver(entries => {
  for (const e of entries) {
    const title = (e.target as HTMLElement).querySelector('.scroll-text') as HTMLElement | null
    if (title) applyOverflow(title)
  }
})

const vOverflowScroll: Directive<ScrollEl> = {
  mounted(el) {
    applyOverflow(el)
    const clip = el.parentElement
    if (!clip) return
    el.__clip = clip
    titleRo.observe(clip)
  },
  updated: applyOverflow,
  unmounted(el) {
    if (el.__clip) titleRo.unobserve(el.__clip)
  },
}
</script>

<template>
  <div data-component="CollectionScoreCard" :data-score-id="props.item.scoreId"
    @click="emit('click', props.item)" @dblclick="emit('dblclick', props.item)"
    @contextmenu="emit('contextmenu', $event, props.item)"
    class="score-card group flex flex-col bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xs hover:shadow-lg hover:border-primary/50 dark:hover:border-blue-500/70 transition-all duration-200 overflow-hidden cursor-pointer select-none">

    <!-- 1. 上半部分：成绩舞台 (Performance Stage) -->
    <div class="flex items-center gap-2 px-1.5 pt-0.5 pb-1 transition-colors" :class="diffStageStyle">
      <!-- 封面图 -->
      <div
        class="w-[50px] h-[50px] sm:w-[52px] sm:h-[52px] rounded-[6px] overflow-hidden bg-black/25 shrink-0 flex items-center justify-center border border-white/40 dark:border-white/25 shadow-xs relative">
        <CoverImage :id="props.item.id" :alt="props.item.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      </div>

      <!-- 右侧内容列 (Content Column) -->
      <div class="flex-1 min-w-0 flex flex-col justify-between gap-0.5 py-0.5">
        <!-- 顶栏：曲名与官方 Type 图标 (Top Line) -->
        <div class="flex items-center justify-between gap-1 min-w-0">
          <div class="overflow-hidden min-w-0 flex-1">
            <div v-overflow-scroll
              class="scroll-text font-bold text-white tracking-tight leading-snug drop-shadow-xs cursor-pointer hover:underline"
              :title="props.item.title"
              @click.stop="handelCopy(props.item.title, '已成功复制曲名到剪贴板')">
              {{ props.item.title }}
            </div>
          </div>

          <!-- Type 图标（来自 resource/DX.png 或 resource/SD.png） -->
          <img v-if="typeIconUrl" :src="typeIconUrl" alt="Type"
            class="h-3.5 sm:h-4 w-auto object-contain shrink-0 drop-shadow-xs" />
          <span v-else-if="isUtage"
            class="px-1.5 py-0.5 rounded-[4px] bg-white/25 text-white text-[9.5px] font-bold shrink-0 shadow-xs">
            宴
          </span>
        </div>

        <!-- 底栏：达成率与评级图章 (Score Line) -->
        <div class="flex items-center justify-between gap-1">
          <span v-if="props.item.isPlayed !== false && props.item.achievement !== undefined"
            class="font-bold text-2xl leading-none text-white tracking-tight drop-shadow-xs">
            {{ formattedAchievement }}
          </span>
          <span v-else class="text-[15.5px] sm:text-[16px] font-bold text-white/90 leading-none drop-shadow-xs">
            暂未游玩
          </span>

          <img v-if="rankIconUrl && props.item.isPlayed !== false" :src="rankIconUrl" alt="Rank"
            class="h-[36px] w-auto object-contain shrink-0 drop-shadow-xs" loading="lazy" />
        </div>
      </div>
    </div>

    <!-- 2. 下半部分：元数据条 (Metadata Strip) -->
    <div
      class="flex items-center justify-between px-2.5 py-1 min-h-[36px] bg-white dark:bg-[#0F172A] border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
      <!-- 左侧：Track ID / 定数 (或拟合定数，含DX Rating Tooltip) / 游玩次数 -->
      <div class="flex items-center gap-1.5 min-w-0 text-[11px] sm:text-[11.5px] truncate">
        <!-- Track ID -->
        <span class="font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
          #{{ props.item.displayId }}
        </span>

        <span
          class="font-mono shrink-0"
          :class="isShowingFit ? fitDeltaClass : (props.item.isPlayed !== false && props.item.dxRating !== undefined ? 'font-bold text-slate-700 dark:text-slate-200' : 'font-medium text-slate-600 dark:text-slate-300')"
          :data-tip="dxRatingTooltip || undefined">
          {{ displayLevelText }}
        </span>

        <!-- 游玩状态下的补充元数据 (PC) -->
        <template v-if="props.item.isPlayed !== false">
          <span v-if="props.item.playCount !== undefined"
            class="font-mono font-medium text-slate-500 dark:text-slate-400 shrink-0">
            pc:{{ props.item.playCount }}
          </span>
        </template>
      </div>

      <!-- 右侧：勋章与星星组 (FC / FS / DX Stars / Unplayed Tag) -->
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <template v-if="props.item.isPlayed !== false">
          <img v-if="fcIconUrl" :src="fcIconUrl" alt="FC" class="w-6 h-6 sm:w-6.5 sm:h-6.5 object-contain"
            loading="lazy" />
          <img v-if="fsIconUrl" :src="fsIconUrl" alt="FS" class="w-6 h-6 sm:w-6.5 sm:h-6.5 object-contain"
            loading="lazy" />
          <img v-if="dxIconUrl" :src="dxIconUrl" alt="DX Score" :data-tip="dxScoreTooltip"
            class="h-5 sm:h-5.5 w-auto object-contain"
            loading="lazy" />
        </template>
        <template v-else>
          <span
            class="px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            UNPLAYED
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(0);
  }

  70% {
    transform: translateX(var(--scroll-dist, 0px));
  }

  90% {
    transform: translateX(var(--scroll-dist, 0px));
  }

  90.001% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(0);
  }
}

.score-card {
  content-visibility: auto;
  contain-intrinsic-size: auto 96px;
}

.scroll-text {
  display: inline-block;
  white-space: nowrap;
}

.scroll-text.is-overflowing {
  animation: marquee 5s linear infinite;
}
</style>
