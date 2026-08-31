<script setup lang="ts">
import { ref, computed, watch, onMounted, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useDebounceFn } from '@vueuse/core'
import DesktopAppShell from '@/desktop/components/DesktopAppShell.vue'
import CollectionTopBar from '@/desktop/components/collection/CollectionTopBar.vue'
import CollectionMetricStrip from '@/desktop/components/collection/CollectionMetricStrip.vue'
import CollectionFilterBar, { type FilterState } from '@/desktop/components/collection/CollectionFilterBar.vue'
import CollectionScoreGrid from '@/desktop/components/collection/CollectionScoreGrid.vue'
import type { CollectionCardItem } from '@/desktop/components/collection/CollectionScoreCard.vue'
import AdvancedFilterDialog from '@/desktop/components/collection/modals/AdvancedFilterDialog.vue'
import DeepScoreAnalyticsDialog from '@/desktop/components/collection/modals/DeepScoreAnalyticsDialog.vue'
import SortingPopover, { type SortConfiguration } from '@/desktop/components/collection/modals/SortingPopover.vue'
import SongDetail from '@/desktop/components/SongDetail.vue'
import BatchImportDialog from '@/desktop/components/collection/modals/BatchImportDialog.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/shadcn/ui/dialog'
import { useCollectionStore } from '@/store/collections'
import { useScores } from '@/store/datasources/scores'
import { useSongStore } from '@/store/datasources/song'
import { useChartData } from '@/store/chartStats'
import { useScoreSearchWorker } from '@/utils/workerHelper'
import { createUnplayedScore, toFishStyleId, toLXNSStyleId, useCopyHelper, getSongDiffByScoreEx, exportFile } from '@/utils/functionUtil'
import { formatLevelValue, getChartLevel, getDxScoreRadio, getLevelValue, getTotalDxScore } from '@/utils/StrUtil'
import type { AdvanceFilterFilters, OrderBadge } from '@/types/component'
import type { ScoreExtend, SongType, MaiMaiSong } from '@/types/songs'
import type { Collection } from '@/store/collections'

const route = useRoute()
const router = useRouter()
const collectionStore = useCollectionStore()
const { getCollectionByLabel, removeFromCollection, pushScoreToCollection } = collectionStore
const { CurrentCollectionLabel, UserCollectionList } = storeToRefs(collectionStore)
const SongStore = useSongStore()
const ScoreStore = useScores()
const ChartDataStore = useChartData()
const { handelCopy } = useCopyHelper()

const emptyFilter = (): AdvanceFilterFilters => ({
  difficulty: [],
  musicCategories: [],
  version: [],
  mapCategories: [],
  difficultyRange: [1.0, 15.0],
  dxScore: [],
  fullCombo: [],
  fullSync: [],
  Type: [],
  showUnplayed: false
})

const AdvanceFilterForm = ref<AdvanceFilterFilters>(emptyFilter())
const searchValue = ref('')
const isLoadingPage = ref(true)

const noopOrder = computed<OrderBadge>(() => ({
  label: '',
  value: 'level',
  status_index: 0,
  isSupport: () => true
}))
const { searchResults, isLoading, updateIndex } = useScoreSearchWorker(searchValue, AdvanceFilterForm, noopOrder)

const filterState = ref<FilterState>({
  searchQuery: '',
  selectedDiff: 'ALL',
  levelRange: 'all',
  activeFilterCount: 0,
  sortField: 'level',
  sortOrder: 'desc'
})

const sortConfig = ref<SortConfiguration>({
  primaryField: 'level',
  primaryDirection: 'desc',
  secondaryField: 'achievement',
  secondaryDirection: 'desc',
  unplayedToBottom: true,
  preferFitConstant: false,
  pushSss: false
})

const isAdvFilterOpen = ref(false)
const isAnalyticsOpen = ref(false)
const isImportOpen = ref(false)
const isSortingOpen = ref(false)
const isDetailOpen = ref(false)
const detailSong = ref<MaiMaiSong | null>(null)
const detailChartType = ref<SongType>('dx')
const detailDiffIndex = ref<number>(3)

const CHIP_TO_DIFF: Record<string, number> = { EXP: 2, MAS: 3, 'Re:MAS': 4, '宴': -1 }
const DIFF_NAMES = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER'] as const

const currentCollectionName = computed(() => CurrentCollectionLabel.value || (route.query.label as string) || '未选择合集')

const otherCollections = computed(() => UserCollectionList.value.filter(c => c.label !== CurrentCollectionLabel.value))

watch(() => filterState.value.searchQuery, useDebounceFn((q: string) => {
  searchValue.value = q
}, 200))

const applyDiffChip = (diff: string) => {
  if (diff === 'ALL') {
    AdvanceFilterForm.value.difficulty = []
    return
  }
  const value = CHIP_TO_DIFF[diff]
  const labels: Record<number, string> = { 2: 'EXPERT', 3: 'MASTER', 4: 'Re:MASTER' }
  AdvanceFilterForm.value.difficulty = [{ label: diff === '宴' ? 'U•TA•GE' : (labels[value] ?? diff), value }]
}

const applyLevelRange = (tag: string) => {
  const [start, end] = tag.split('-')
  const levelStart = Number(start)
  const levelEnd = Number(end)
  AdvanceFilterForm.value.difficultyRange =
    Number.isFinite(levelStart) && Number.isFinite(levelEnd) ? [levelStart, levelEnd] : [1.0, 15.0]
}

const onFilterBarUpdate = (val: FilterState) => {
  const prev = filterState.value
  filterState.value = val
  if (val.selectedDiff !== prev.selectedDiff) applyDiffChip(val.selectedDiff)
  if (val.levelRange !== prev.levelRange) applyLevelRange(val.levelRange)
  if (val.sortField !== prev.sortField || val.sortOrder !== prev.sortOrder) {
    sortConfig.value.primaryField = val.sortField
    sortConfig.value.primaryDirection = val.sortOrder
  }
}

const handleApplyAdvFilter = (filters: AdvanceFilterFilters) => {
  AdvanceFilterForm.value = filters
  if (filters.difficulty.length === 1) {
    const v = filters.difficulty[0].value
    filterState.value.selectedDiff = v === 2 ? 'EXP' : v === 3 ? 'MAS' : v === 4 ? 'Re:MAS' : v === -1 ? '宴' : 'ALL'
  } else {
    filterState.value.selectedDiff = 'ALL'
  }
  const [min, max] = filters.difficultyRange
  filterState.value.levelRange = min <= 1 && max >= 15 ? 'all' : `${min.toFixed(1)}-${max.toFixed(1)}`
}

const handleApplySort = (config: SortConfiguration) => {
  sortConfig.value = { ...config }
  filterState.value.sortField = config.primaryField
  filterState.value.sortOrder = config.primaryDirection
}

const activeFilterCount = computed(() => {
  const f = AdvanceFilterForm.value
  let n = 0
  if (f.difficulty.length) n++
  if (f.musicCategories.length) n++
  if (f.version.length) n++
  if (f.mapCategories.length) n++
  if (f.difficultyRange[0] > 1 || f.difficultyRange[1] < 15) n++
  if (f.dxScore.length) n++
  if (f.fullCombo.length) n++
  if (f.fullSync.length) n++
  if (f.Type.length) n++
  if (f.showUnplayed) n++
  return n
})
watch(activeFilterCount, n => { filterState.value.activeFilterCount = n })

const fieldValue = (ex: ScoreExtend, field: string) => {
  switch (field) {
    case 'level':
      return sortConfig.value.preferFitConstant && ex.chart_data ? getChartLevel(ex) : getLevelValue(ex)
    case 'achievement':
      return ex.score.achievements ?? 0
    case 'rating':
      return ex.score.dx_rating ?? 0
    case 'fit':
      return getChartLevel(ex)
    case 'fitDelta':
      return getChartLevel(ex) - getLevelValue(ex)
    case 'dxScore':
      return getDxScoreRadio(ex)
    case 'playCount':
      return ex.score.play_count ?? 0
    default:
      return 0
  }
}

const cmp = (a: number, b: number, dir: 'asc' | 'desc') => dir === 'desc' ? b - a : a - b

const sortedResults = computed(() => {
  const cfg = sortConfig.value
  const list = [...searchResults.value]
  list.sort((a, b) => {
    if (cfg.unplayedToBottom) {
      const ap = a.score.is_played === false ? 1 : 0
      const bp = b.score.is_played === false ? 1 : 0
      if (ap !== bp) return ap - bp
    }
    if (cfg.pushSss) {
      const as = (a.score.achievements ?? 0) >= 100.5 ? 1 : 0
      const bs = (b.score.achievements ?? 0) >= 100.5 ? 1 : 0
      if (as !== bs) return as - bs
    }
    let c = cmp(fieldValue(a, cfg.primaryField), fieldValue(b, cfg.primaryField), cfg.primaryDirection)
    if (c !== 0) return c
    if (cfg.secondaryField === 'title') {
      c = a.song.title.localeCompare(b.song.title, 'zh')
      return cfg.secondaryDirection === 'desc' ? -c : c
    }
    c = cmp(fieldValue(a, cfg.secondaryField), fieldValue(b, cfg.secondaryField), cfg.secondaryDirection)
    if (c !== 0) return c
    return a.score.id - b.score.id
  })
  return list
})

const dxStarFromRatio = (ratio: number) => {
  if (ratio >= 0.97) return 5
  if (ratio >= 0.95) return 4
  if (ratio >= 0.93) return 3
  if (ratio >= 0.9) return 2
  if (ratio >= 0.85) return 1
  return 0
}

const formatFitDelta = (value: number) => {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '+0.00'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`
}

const toCardItem = (ex: ScoreExtend): CollectionCardItem => {
  const { score, song, score_id, chart_data } = ex
  const isUtage = score.type === 'utage'
  const diff = getSongDiffByScoreEx(ex)
  const official = getLevelValue(ex)
  const fit = chart_data ? Number(chart_data.fit_diff) : undefined
  const totalDx = getTotalDxScore(diff)
  const ratio = totalDx > 0 ? score.dx_score / totalDx : 0
  let title = song.title
  if (isUtage && diff && 'kanji' in diff) {
    title = `[${diff.kanji}] ${diff.is_buddy ? '[双]' : ''} ${song.title}`
  }
  const played = score.is_played === undefined ? true : score.is_played
  return {
    scoreId: score_id,
    id: song.id,
    displayId: isUtage ? (score.diff_id ?? song.id) : ScoreStore.showCurrentStyleId(song.id, score.type),
    title,
    artist: song.artist,
    diffName: isUtage ? '宴' : (DIFF_NAMES[score.level_index] ?? 'MASTER'),
    diffLevel: formatLevelValue(official),
    chartType: score.type,
    achievement: played ? score.achievements : undefined,
    rateType: score.rate_type || undefined,
    dxRating: score.dx_rating,
    playCount: ScoreStore.isSupportPlayCount ? score.play_count : undefined,
    fitLevel: fit != null && Number.isFinite(fit) ? fit.toFixed(2) : undefined,
    fitDelta: fit != null && Number.isFinite(fit) ? formatFitDelta(fit - official) : undefined,
    fc: score.fc || '',
    fs: score.fs || '',
    dxStar: played ? dxStarFromRatio(ratio) : 0,
    dxScore: score.dx_score,
    totalDxScore: totalDx,
    isPlayed: played
  }
}

const cardItems = computed(() => sortedResults.value.map(toCardItem))

const computedMetrics = computed(() => {
  const items = sortedResults.value
  const total = items.length
  if (total === 0) {
    return {
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
    }
  }
  const played = items.filter(i => i.score.is_played !== false)
  const avg = played.length
    ? played.reduce((acc, curr) => acc + (curr.score.achievements || 0), 0) / played.length
    : 0
  const sssp = items.filter(i => i.score.rate_type === 'sssp').length
  const sss = items.filter(i => i.score.rate_type === 'sss' || i.score.rate_type === 'sssp').length
  const ap = items.filter(i => i.score.fc === 'ap' || i.score.fc === 'app').length
  const fc = items.filter(i => i.score.fc).length
  const totalPc = items.reduce((acc, curr) => acc + (curr.score.play_count || 0), 0)
  const aboveAvg = played.filter(i => (i.score.achievements || 0) >= avg).length
  return {
    avgAchievement: `${avg.toFixed(4)}%`,
    avgSubText: `超均值 ${aboveAvg}/${total}`,
    ssspCount: `${sssp}/${total}`,
    ssspSubText: `占比 ${((sssp / total) * 100).toFixed(1)}%`,
    sssCount: `${sss}/${total}`,
    sssSubText: `占比 ${((sss / total) * 100).toFixed(1)}%`,
    apCount: `${ap}/${total}`,
    apSubText: `FC/FC+ ${fc}/${total}`,
    playCount: `${totalPc} 次`,
    playCountSubText: ScoreStore.isSupportPlayCount ? `已游玩 ${played.length}/${total}` : '数据源不支持 PC'
  }
})

const pct = (count: number, total: number) => total === 0 ? 0 : Number(((count / total) * 100).toFixed(1))

const analyticsData = computed(() => {
  const list = sortedResults.value
  const total = list.length
  const played = list.filter(i => i.score.is_played !== false)
  const avg = played.length
    ? played.reduce((acc, curr) => acc + (curr.score.achievements || 0), 0) / played.length
    : 0
  const totalPlayCount = list.reduce((acc, curr) => acc + (curr.score.play_count || 0), 0)
  const countWhere = (fn: (ex: ScoreExtend) => boolean) => list.filter(fn).length
  const bucket = (label: string, color: string, fn: (ex: ScoreExtend) => boolean) => {
    const count = countWhere(fn)
    return { label, count, percentage: pct(count, total), color }
  }
  return {
    totalCharts: total,
    avgAchievement: `${avg.toFixed(4)}%`,
    totalPlayCount,
    rankDistribution: [
      bucket('SSS+ (100.5%+)', 'bg-amber-500', s => s.score.achievements >= 100.5),
      bucket('SSS (100.0% ~ 100.49%)', 'bg-yellow-500', s => s.score.achievements >= 100 && s.score.achievements < 100.5),
      bucket('SS+ (99.5% ~ 99.99%)', 'bg-purple-500', s => s.score.achievements >= 99.5 && s.score.achievements < 100),
      bucket('SS (99.0% ~ 99.49%)', 'bg-blue-500', s => s.score.achievements >= 99 && s.score.achievements < 99.5),
      bucket('S+ / S (97.0% ~ 98.99%)', 'bg-emerald-500', s => s.score.achievements >= 97 && s.score.achievements < 99),
      bucket('AAA 及以下 (<97.0%)', 'bg-slate-400', s => s.score.achievements < 97)
    ],
    apfcDistribution: [
      bucket('AP+ (All Perfect+)', 'bg-amber-500', s => s.score.fc === 'app'),
      bucket('AP (All Perfect)', 'bg-yellow-500', s => s.score.fc === 'ap'),
      bucket('FC+ (Full Combo+)', 'bg-emerald-500', s => s.score.fc === 'fcp'),
      bucket('FC (Full Combo)', 'bg-teal-500', s => s.score.fc === 'fc')
    ],
    syncDistribution: [
      bucket('FDX+ (Full DX+)', 'bg-amber-500', s => s.score.fs === 'fsdp'),
      bucket('FDX (Full DX)', 'bg-purple-500', s => s.score.fs === 'fsd'),
      bucket('FS+ (Full Sync+)', 'bg-blue-500', s => s.score.fs === 'fsp'),
      bucket('FS (Full Sync)', 'bg-cyan-500', s => s.score.fs === 'fs'),
      bucket('Sync / Clear', 'bg-slate-400', s => s.score.fs === 'sync')
    ],
    dxStarsDistribution: [
      bucket('5星 ★★★★★ (97%+)', 'bg-amber-500', s => dxStarFromRatio(getDxScoreRadio(s)) === 5),
      bucket('4星 ★★★★ (95%+)', 'bg-yellow-500', s => dxStarFromRatio(getDxScoreRadio(s)) === 4),
      bucket('3星 ★★★ (93%+)', 'bg-purple-500', s => dxStarFromRatio(getDxScoreRadio(s)) === 3),
      bucket('2星 ★★ (90%+)', 'bg-blue-500', s => dxStarFromRatio(getDxScoreRadio(s)) === 2),
      bucket('1星 ★ (85%+)', 'bg-emerald-500', s => dxStarFromRatio(getDxScoreRadio(s)) === 1),
      bucket('0星 (<85%)', 'bg-slate-400', s => dxStarFromRatio(getDxScoreRadio(s)) === 0)
    ]
  }
})

const buildScoreList = (coll: Collection): ScoreExtend[] => {
  const result: ScoreExtend[] = []
  for (const level_str of coll.list) {
    if (!level_str) continue
    const [diff_id_str, song_type, level_index_str] = level_str.split('_')
    if (!diff_id_str || !song_type || !level_index_str) continue
    const diff_id = Number(diff_id_str)
    const song_id = toLXNSStyleId(diff_id)
    const song = SongStore.getSong(song_id) || SongStore.getSong(diff_id)
    if (!song) continue
    const level_index = Number(level_index_str)
    const lookupId = song_type === 'utage' ? diff_id : song_id
    let score = ScoreStore.getScoreByUni(lookupId, song_type as SongType, level_index)
    if (!score) {
      score = createUnplayedScore(lookupId, song, song_type as SongType, level_index)
    }
    const fish_song_id = toFishStyleId(diff_id, score.type)
    result.push({
      score,
      song: toRaw(song),
      score_id: level_str,
      chart_data: toRaw(ChartDataStore.getDiffChartData(fish_song_id, score.level_index))
    })
  }
  return result
}

const initScoreList = () => {
  isLoadingPage.value = true
  const label = (route.query.label as string) || CurrentCollectionLabel.value || UserCollectionList.value[0]?.label
  if (!label) {
    CurrentCollectionLabel.value = ''
    updateIndex([])
    isLoadingPage.value = false
    return
  }
  if (!route.query.label) {
    router.replace({ name: 'DesktopCollection', query: { label } })
    isLoadingPage.value = false
    return
  }
  const coll = getCollectionByLabel(label)
  if (!coll) {
    toast.error('合集不存在')
    CurrentCollectionLabel.value = ''
    updateIndex([])
    isLoadingPage.value = false
    return
  }
  CurrentCollectionLabel.value = coll.label
  updateIndex(buildScoreList(coll))
  isLoadingPage.value = false
}

const handleCardDblClick = (item: CollectionCardItem) => {
  const ex = sortedResults.value.find(s => s.score_id === item.scoreId)
  if (!ex) {
    const song = SongStore.getSong(item.id)
    if (!song) {
      toast.error('未找到曲目信息')
      return
    }
    detailSong.value = song
    detailChartType.value = item.chartType
    const diffIdx = item.diffName === '宴' ? 0 : DIFF_NAMES.indexOf(item.diffName as any)
    detailDiffIndex.value = diffIdx >= 0 ? diffIdx : 3
    isDetailOpen.value = true
    return
  }
  detailSong.value = ex.song
  detailChartType.value = ex.score.type
  detailDiffIndex.value = ex.score.level_index
  isDetailOpen.value = true
}

const handleRemoveItem = (item: CollectionCardItem) => {
  if (removeFromCollection(item.scoreId)) {
    initScoreList()
    toast.success(`已将「${item.title}」从合集中移除`)
  } else {
    toast.error('删除失败')
  }
}

const handleAddToOtherCollection = (collLabel: string, item: CollectionCardItem) => {
  if (pushScoreToCollection(collLabel, item.scoreId)) {
    toast.success(`已成功添加「${item.title}」至合集「${collLabel}」`)
  } else {
    toast.error(`添加失败，已存在于合集「${collLabel}」中`)
  }
}

const handleCopyTitle = (item: CollectionCardItem) => {
  handelCopy(item.title, '已成功复制歌曲名到剪切板中')
}

const handleCopyId = (item: CollectionCardItem) => {
  handelCopy(String(item.displayId), '已成功复制歌曲 ID 到剪切板中')
}

const handleExportJson = () => {
  collectionStore.exportCollectionData()
}

const handleExportCsv = () => {
  const rows = ['id,title,type,level_index,level,achievement,dx_rating,fc,fs']
  for (const ex of sortedResults.value) {
    rows.push([
      ex.score.id,
      `"${ex.song.title.replace(/"/g, '""')}"`,
      ex.score.type,
      ex.score.level_index,
      getLevelValue(ex),
      ex.score.achievements,
      ex.score.dx_rating,
      ex.score.fc ?? '',
      ex.score.fs ?? ''
    ].join(','))
  }
  exportFile(rows.join('\n'), `${currentCollectionName.value}-scores.csv`, 'text/csv')
}

watch(() => route.query.label, initScoreList)
watch(() => ScoreStore.selectedSource, initScoreList)
watch(() => ChartDataStore.hasChartData, (v) => { if (v) initScoreList() })
onMounted(initScoreList)
</script>

<template>
  <DesktopAppShell>
    <main class="flex-1 flex flex-col h-full min-w-0 gap-2.5 sm:gap-3 p-2.5 sm:p-3 lg:p-4 overflow-hidden select-none">
      <CollectionTopBar :collection-name="currentCollectionName" :total-count="cardItems.length"
        @open-import="isImportOpen = true" @open-analytics="isAnalyticsOpen = true" @export-json="handleExportJson"
        @export-csv="handleExportCsv" />

      <CollectionMetricStrip :stats="computedMetrics" />

      <CollectionFilterBar :model-value="filterState" @update:model-value="onFilterBarUpdate"
        @open-adv-filter="isAdvFilterOpen = true" @open-sort-modal="isSortingOpen = true" />

      <CollectionScoreGrid :items="cardItems" :loading="isLoadingPage || isLoading"
        :other-collections="otherCollections" @open-detail="handleCardDblClick" @remove-item="handleRemoveItem"
        @add-to-collection="handleAddToOtherCollection" @copy-title="handleCopyTitle" @copy-id="handleCopyId" />
    </main>

    <AdvancedFilterDialog v-model:open="isAdvFilterOpen" :filters="AdvanceFilterForm" :total-matched="cardItems.length"
      @apply="handleApplyAdvFilter" />

    <DeepScoreAnalyticsDialog v-model:open="isAnalyticsOpen" :data="analyticsData" />

    <BatchImportDialog v-model:open="isImportOpen" @imported="initScoreList" />

    <SortingPopover v-model:open="isSortingOpen" :current-config="sortConfig" @apply="handleApplySort" />

    <Dialog v-model:open="isDetailOpen">
      <DialogContent class="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-3 sm:p-5 bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-xl shadow-xl flex flex-col">
        <DialogHeader class="sr-only">
          <DialogTitle>歌曲详情</DialogTitle>
          <DialogDescription>{{ detailSong?.title }}</DialogDescription>
        </DialogHeader>
        <SongDetail
          v-if="detailSong"
          :song="detailSong"
          :initial-diff-index="detailDiffIndex"
          v-model:selected-type="detailChartType"
          v-model:selected-diff-index="detailDiffIndex"
        />
      </DialogContent>
    </Dialog>
  </DesktopAppShell>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>
