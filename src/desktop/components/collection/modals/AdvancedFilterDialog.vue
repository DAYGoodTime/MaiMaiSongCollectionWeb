<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shadcn/ui/dialog'
import { Zap, RotateCcw } from '@lucide/vue'
import MultiSelectComboboxTags from '@/components/MultiSelectComboboxTags.vue'
import type { AdvanceFilterFilters, FilterProps, RangeAble } from '@/types/component'
import SongGenreList from '@/assets/data/song_genres.json' with { type: 'json' }
import SongVersionList from '@/assets/data/versions.json' with { type: 'json' }
import SongMapList from '@/assets/data/song_maps.json' with { type: 'json' }
interface AdvancedFilterValues {
  diffs: string[]
  minLevel: number
  maxLevel: number
  genres: string[]
  maps: string[]
  version: string
  dxStars: number[]
  fcTypes: string[]
  fsTypes: string[]
  chartTypes: string[]
  includeUnplayed: boolean
}

interface Props {
  open: boolean
  filters?: AdvanceFilterFilters
  totalMatched?: number
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  totalMatched: 0
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'apply': [filters: AdvanceFilterFilters]
  'reset': []
}>()

const DIFF_CHIPS = [
  { id: 'BASIC', label: 'BASIC', value: 0, color: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'ADVANCED', label: 'ADVANCED', value: 1, color: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'EXPERT', label: 'EXPERT', value: 2, color: 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/40' },
  { id: 'MASTER', label: 'MASTER', value: 3, color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  { id: 'Re:MASTER', label: 'Re:MASTER', value: 4, color: 'border-fuchsia-500 text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40' },
  { id: '宴', label: 'U•TA•GE', value: -1, color: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/40' }
] as const

const FC_MAP = [
  { label: 'AP+', value: 'app' },
  { label: 'AP', value: 'ap' },
  { label: 'FC+', value: 'fcp' },
  { label: 'FC', value: 'fc' }
] as const

const FS_MAP = [
  { label: 'FDX+', value: 'fsdp' },
  { label: 'FDX', value: 'fsd' },
  { label: 'FS+', value: 'fsp' },
  { label: 'FS', value: 'fs' },
  { label: 'Sync', value: 'sync' }
] as const

const STAR_RANGES: { star: number, min: number, max: number }[] = [
  { star: 0, min: 0, max: 0.85 },
  { star: 1, min: 0.85, max: 0.9 },
  { star: 2, min: 0.9, max: 0.93 },
  { star: 3, min: 0.93, max: 0.95 },
  { star: 4, min: 0.95, max: 0.97 },
  { star: 5, min: 0.97, max: 2 }
]

const emptyUi = (): AdvancedFilterValues => ({
  diffs: [],
  minLevel: 1.0,
  maxLevel: 15.0,
  genres: [],
  maps: [],
  version: '',
  dxStars: [],
  fcTypes: [],
  fsTypes: [],
  chartTypes: [],
  includeUnplayed: false
})

const ui = ref<AdvancedFilterValues>(emptyUi())

const fromAdvance = (f?: AdvanceFilterFilters): AdvancedFilterValues => {
  if (!f) return emptyUi()
  const diffs = f.difficulty.map(d => DIFF_CHIPS.find(c => c.value === d.value)?.id).filter(Boolean) as string[]
  const dxStars = f.dxScore.map(s => STAR_RANGES.find(r => r.min === s.value.min)?.star).filter((n): n is number => n !== undefined)
  return {
    diffs,
    minLevel: f.difficultyRange[0],
    maxLevel: f.difficultyRange[1],
    genres: f.musicCategories.map(g => g.value),
    maps: f.mapCategories.map(m => m.value),
    version: f.version[0]?.value ?? '',
    dxStars,
    fcTypes: f.fullCombo.map(x => x.value),
    fsTypes: f.fullSync.map(x => x.value),
    chartTypes: f.Type.map(x => x.value),
    includeUnplayed: f.showUnplayed
  }
}

const toAdvance = (v: AdvancedFilterValues): AdvanceFilterFilters => {
  const difficulty: FilterProps<number>[] = v.diffs.flatMap(id => {
    const chip = DIFF_CHIPS.find(c => c.id === id)
    return chip ? [{ label: chip.label, value: chip.value }] : []
  })
  const musicCategories: FilterProps<string>[] = SongGenreList.filter(g => v.genres.includes(g.value))
  const mapCategories: FilterProps<string>[] = SongMapList.filter(m => v.maps.includes(m.value))
  const version: FilterProps<string>[] = v.version
    ? SongVersionList.filter(x => x.id === v.version).map(x => ({ label: x.label_full, value: x.id }))
    : []
  const dxScore: FilterProps<RangeAble<number>>[] = v.dxStars.flatMap(star => {
    const r = STAR_RANGES.find(s => s.star === star)
    return r ? [{ label: `${star}星`, value: { min: r.min, max: r.max } }] : []
  })
  const fullCombo: FilterProps<string>[] = v.fcTypes.flatMap(val => {
    const m = FC_MAP.find(x => x.value === val)
    return m ? [{ label: m.label, value: m.value }] : []
  })
  const fullSync: FilterProps<string>[] = v.fsTypes.flatMap(val => {
    const m = FS_MAP.find(x => x.value === val)
    return m ? [{ label: m.label, value: m.value }] : []
  })
  const Type: FilterProps<string>[] = v.chartTypes.map(t => ({
    label: t === 'dx' ? 'DX' : t === 'standard' ? '标准' : '宴会场',
    value: t
  }))
  return {
    difficulty,
    musicCategories,
    version,
    mapCategories,
    difficultyRange: [v.minLevel, v.maxLevel],
    dxScore,
    fullCombo,
    fullSync,
    Type,
    showUnplayed: v.includeUnplayed
  }
}

watch(() => props.open, (open) => {
  if (open) ui.value = fromAdvance(props.filters)
})

const activeConditionsCount = computed(() => {
  let count = 0
  if (ui.value.diffs.length) count++
  if (ui.value.minLevel > 1.0 || ui.value.maxLevel < 15.0) count++
  if (ui.value.genres.length) count++
  if (ui.value.maps.length) count++
  if (ui.value.version) count++
  if (ui.value.dxStars.length) count++
  if (ui.value.fcTypes.length) count++
  if (ui.value.fsTypes.length) count++
  if (ui.value.chartTypes.length) count++
  if (ui.value.includeUnplayed) count++
  return count
})

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter(d => d !== id) : [...list, id]

const toggleDiff = (id: string) => { ui.value.diffs = toggle(ui.value.diffs, id) }
const toggleGenre = (g: string) => { ui.value.genres = toggle(ui.value.genres, g) }
const selectedMaps = computed(() => SongMapList.filter(m => ui.value.maps.includes(m.value)))
const onMapChange = (selected: FilterProps<string>[]) => {
  ui.value.maps = selected.map(s => s.value)
}
const toggleFc = (fc: string) => { ui.value.fcTypes = toggle(ui.value.fcTypes, fc) }
const toggleFs = (fs: string) => { ui.value.fsTypes = toggle(ui.value.fsTypes, fs) }
const toggleChartType = (type: string) => { ui.value.chartTypes = toggle(ui.value.chartTypes, type) }
const toggleDxStar = (star: number) => {
  ui.value.dxStars = ui.value.dxStars.includes(star)
    ? ui.value.dxStars.filter(s => s !== star)
    : [...ui.value.dxStars, star]
}

const setPresetLevel = (min: number, max: number) => {
  ui.value.minLevel = min
  ui.value.maxLevel = max
}

const handleReset = () => {
  ui.value = emptyUi()
  emit('reset')
}

const handleApply = () => {
  emit('apply', toAdvance(ui.value))
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-4 sm:p-5 select-none bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-xl shadow-xl">
      <DialogHeader class="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <Zap class="w-4 h-4" />
          </div>
          <DialogTitle class="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
            高级筛选与多维检索
          </DialogTitle>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800/60 text-[#2563EB] dark:text-blue-400">
            已选 {{ activeConditionsCount }} 项条件
          </span>
        </div>
      </DialogHeader>

      <div class="space-y-3 py-2 text-xs">
        <div class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[#334155] dark:text-slate-200">🎯 难度等级 & 谱面定数</span>
            <span class="text-[10px] text-[#94A3B8]">点击快速多选难度 / 滑块选择定数</span>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="chip in DIFF_CHIPS"
              :key="chip.id"
              @click="toggleDiff(chip.id)"
              class="px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer"
              :class="ui.diffs.includes(chip.id) ? chip.color : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'">
              {{ chip.label }}
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <span class="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">定数范围:</span>
            <div class="flex items-center gap-1.5">
              <input v-model.number="ui.minLevel" type="number" step="0.1" min="1" max="15"
                class="w-14 px-2 py-0.5 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md" />
              <span class="text-slate-400">—</span>
              <input v-model.number="ui.maxLevel" type="number" step="0.1" min="1" max="15"
                class="w-14 px-2 py-0.5 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md" />
            </div>
            <div class="flex items-center gap-1 ml-auto">
              <button @click="setPresetLevel(14.0, 14.9)" class="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">14.0 ~ 14.9</button>
              <button @click="setPresetLevel(14.7, 15.0)" class="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">14+ (14.7+)</button>
              <button @click="setPresetLevel(13.0, 13.9)" class="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">13.0 ~ 13.9</button>
            </div>
          </div>
        </div>

        <div class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 space-y-2">
          <div class="font-bold text-[#334155] dark:text-slate-200">🎵 乐曲分类、版本与区域</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="g in SongGenreList"
              :key="g.value"
              @click="toggleGenre(g.value)"
              class="px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer"
              :class="ui.genres.includes(g.value)
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-600 dark:text-purple-400 font-bold'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'">
              {{ g.label }}
            </button>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <span class="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">所属版本:</span>
            <select v-model="ui.version"
              class="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-[#0F172A] dark:text-slate-200">
              <option value="">全部版本</option>
              <option v-for="v in SongVersionList" :key="v.id" :value="v.id">{{ v.label_full }}</option>
            </select>
          </div>
          <div class="pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <span class="text-[11px] text-[#64748B] dark:text-slate-400 font-medium block mb-1.5">所属区域 (Map):</span>
            <MultiSelectComboboxTags
              :options="SongMapList"
              :selected="selectedMaps"
              placeholder="搜索并选择归属区域"
              @selection-change="onMapChange"
            />
          </div>
        </div>

        <div class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 space-y-2.5">
          <div class="font-bold text-[#334155] dark:text-slate-200">🏆 成绩评级、DX Score 与连击同步</div>
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">DX Score:</span>
            <button
              v-for="star in [0, 1, 2, 3, 4, 5]"
              :key="star"
              @click="toggleDxStar(star)"
              class="px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer"
              :class="ui.dxStars.includes(star)
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-600 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'">
              {{ star === 5 ? '5星 ★★★★★' : `${star}星` }}
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">FC:</span>
              <button
                v-for="fc in FC_MAP"
                :key="fc.value"
                @click="toggleFc(fc.value)"
                class="px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer"
                :class="ui.fcTypes.includes(fc.value)
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'">
                {{ fc.label }}
              </button>
            </div>
            <div class="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">Sync:</span>
              <button
                v-for="fs in FS_MAP"
                :key="fs.value"
                @click="toggleFs(fs.value)"
                class="px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer"
                :class="ui.fsTypes.includes(fs.value)
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'">
                {{ fs.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="font-bold text-[#334155] dark:text-slate-200">⚙️ 谱面类型:</span>
            <button @click="toggleChartType('dx')" class="px-2.5 py-0.5 rounded text-[11px] font-bold border cursor-pointer"
              :class="ui.chartTypes.includes('dx') ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500'">DX 谱面</button>
            <button @click="toggleChartType('standard')" class="px-2.5 py-0.5 rounded text-[11px] font-bold border cursor-pointer"
              :class="ui.chartTypes.includes('standard') ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500'">标准谱面</button>
            <button @click="toggleChartType('utage')" class="px-2.5 py-0.5 rounded text-[11px] font-bold border cursor-pointer"
              :class="ui.chartTypes.includes('utage') ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-white border-slate-200 text-slate-500'">宴会场</button>
          </div>
          <label class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
            <input v-model="ui.includeUnplayed" type="checkbox" class="rounded text-[#2563EB]" />
            <span class="text-[11px]">包含未游玩谱面</span>
          </label>
        </div>
      </div>

      <DialogFooter class="flex flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button @click="handleReset"
          class="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <RotateCcw class="w-3.5 h-3.5" />
          <span>重置所有筛选条件</span>
        </button>
        <div class="flex items-center gap-2">
          <button @click="emit('update:open', false)"
            class="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer">
            取消
          </button>
          <button @click="handleApply"
            class="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xs transition-colors cursor-pointer">
            应用筛选 ({{ props.totalMatched }} 条结果)
          </button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
