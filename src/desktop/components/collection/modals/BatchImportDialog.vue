<script setup lang="ts">
import { ref, computed, watch, type Directive } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/shadcn/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/shadcn/ui/select'
import { useCollectionStore } from '@/store/collections'
import { useSongStore } from '@/store/datasources/song'
import { useScores } from '@/store/datasources/scores'
import LevelRangeSelector from '@/components/LevelRangeSelector.vue'
import { FolderDown } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { storeToRefs } from 'pinia'

interface Props {
  open: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<{
  'update:open': [val: boolean]
  imported: []
}>()

const collectionStore = useCollectionStore()
const SongStore = useSongStore()
const ScoreStore = useScores()
const { CurrentCollectionLabel, UserCollectionList } = storeToRefs(collectionStore)

const selectedDiffs = ref<number[]>([3, 4])
const levelRange = ref<[number, number]>([12.0, 15.0])
const selectedPresets = ref<string[]>([])
const targetCollection = ref('')
const importing = ref(false)

const LEVEL_PRESETS = [
  { label: '12', start: 12.0, end: 12.5 },
  { label: '12+', start: 12.6, end: 12.9 },
  { label: '13', start: 13.0, end: 13.5 },
  { label: '13+', start: 13.6, end: 13.9 },
  { label: '14', start: 14.0, end: 14.5 },
  { label: '14+', start: 14.6, end: 14.9 },
  { label: '15', start: 15.0, end: 15.5 }
] as const

const DIFF_LABELS = ['BAS', 'ADV', 'EXP', 'MAS', 'Re:MAS'] as const

const diffOptions = [
  { id: 0, label: 'BASIC', active: 'bg-[#22C55E] border-[#22C55E] text-white' },
  { id: 1, label: 'ADVANCED', active: 'bg-[#F59E0B] border-[#F59E0B] text-white' },
  { id: 2, label: 'EXPERT', active: 'bg-[#F43F5E] border-[#F43F5E] text-white' },
  { id: 3, label: 'MASTER', active: 'bg-[#9333EA] border-[#9333EA] text-white' },
  { id: 4, label: 'Re:MASTER', active: 'bg-[#C084FC] border-[#C084FC] text-white' },
  { id: -1, label: '宴', active: 'bg-cyan-600 border-cyan-600 text-white' }
]

const activeRanges = computed(() => {
  if (selectedPresets.value.length) {
    return LEVEL_PRESETS.filter(p => selectedPresets.value.includes(p.label)).map(p => [p.start, p.end] as [number, number])
  }
  return [levelRange.value]
})

const inRange = (lv: number) => activeRanges.value.some(([a, b]) => lv >= a && lv <= b)

type PreviewRow = { key: string; title: string; artist: string; diff: string; level: string }

const matches = computed(() => {
  const rows: PreviewRow[] = []
  const ids: string[] = []
  if (!selectedDiffs.value.length) return { rows, count: 0, ids }

  for (const song of SongStore.getSongList()) {
    for (const diff of [...song.difficulties.standard, ...song.difficulties.dx]) {
      if (!selectedDiffs.value.includes(diff.level_index) || !inRange(diff.level_value)) continue
      const key = `${song.id}_${diff.type}_${diff.level_index}`
      ids.push(key)
      if (rows.length < 80) {
        rows.push({
          key,
          title: song.title,
          artist: song.artist,
          diff: DIFF_LABELS[diff.level_index] ?? String(diff.level_index),
          level: String(diff.level_value)
        })
      }
    }
    if (selectedDiffs.value.includes(-1) && song.difficulties.utage) {
      for (const u of song.difficulties.utage) {
        if (!inRange(u.level_value)) continue
        const key = `${u.diff_id}_utage_${u.level_index}`
        ids.push(key)
        if (rows.length < 80) {
          rows.push({ key, title: song.title, artist: song.artist, diff: '宴', level: u.level })
        }
      }
    }
  }
  return { rows, count: ids.length, ids }
})

const toggleDiff = (id: number) => {
  selectedDiffs.value = selectedDiffs.value.includes(id)
    ? selectedDiffs.value.filter(d => d !== id)
    : [...selectedDiffs.value, id]
}

const togglePreset = (label: string) => {
  selectedPresets.value = selectedPresets.value.includes(label)
    ? selectedPresets.value.filter(p => p !== label)
    : [...selectedPresets.value, label]
}

watch(() => props.open, (open) => {
  if (!open) return
  targetCollection.value = CurrentCollectionLabel.value || UserCollectionList.value[0]?.label || ''
  selectedPresets.value = []
  levelRange.value = [12.0, 15.0]
})

const handleConfirm = () => {
  if (importing.value) return
  if (!targetCollection.value) {
    toast.error('请选择目标合集')
    return
  }
  if (!selectedDiffs.value.length) {
    toast.warning('请至少选择一个难度')
    return
  }
  const coll = UserCollectionList.value.find(c => c.label === targetCollection.value)
  if (!coll) {
    toast.error('未找到目标合集')
    return
  }
  importing.value = true
  const count = matches.value.count
  const label = targetCollection.value
  coll.list = new Set(matches.value.ids)
  toast.success(`已导入 ${count} 首谱面至「${label}」`)
  importing.value = false
  if (label === CurrentCollectionLabel.value) emit('imported')
  emit('update:open', false)
}

// 溢出滚动动画指令
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

const vOverflowScroll: Directive<HTMLElement> = {
  mounted(el) {
    applyOverflow(el)
    const ro = new ResizeObserver(() => applyOverflow(el))
    ro.observe(el)
    if (el.parentElement) ro.observe(el.parentElement)
    ;(el as any).__ro = ro
  },
  updated: applyOverflow,
  unmounted(el) {
    ;(el as any).__ro?.disconnect()
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-[94vw] sm:w-[580px] max-w-[580px] max-h-[85vh] overflow-y-auto p-4 sm:p-5 select-none bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-xl shadow-xl">
      <DialogHeader class="pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <FolderDown class="w-4 h-4" />
          </div>
          <div>
            <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
              批量导入至个人合集
            </DialogTitle>
            <DialogDescription class="text-xs text-[#64748B] dark:text-slate-400">
              按定数与难度筛选全曲库，导入将覆盖目标合集现有曲目
            </DialogDescription>
          </div>
        </div>
        <p v-if="ScoreStore.getSelectableSource.length === 0" class="text-[11px] text-red-600 font-bold pt-1">
          注意: 未添加查分器，导入成绩均为「未游玩」，默认不会显示。
        </p>
      </DialogHeader>

      <div class="space-y-3 py-2 text-xs min-w-0">
        <div class="space-y-1.5">
          <div class="font-bold text-[#475569] dark:text-slate-200">选择导入难度:</div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="d in diffOptions"
              :key="d.id"
              @click="toggleDiff(d.id)"
              class="px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer"
              :class="selectedDiffs.includes(d.id)
                ? d.active
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'">
              {{ d.label }}
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="font-bold text-[#475569] dark:text-slate-200">常见定数范围:</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in LEVEL_PRESETS"
              :key="p.label"
              @click="togglePreset(p.label)"
              class="px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer"
              :class="selectedPresets.includes(p.label)
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'">
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="space-y-1.5" :class="selectedPresets.length ? 'opacity-40 pointer-events-none' : ''">
          <div class="font-bold text-[#475569] dark:text-slate-200">
            自定义定数范围
            <span v-if="selectedPresets.length" class="font-normal text-slate-400">（已选常用范围，此项忽略）</span>
          </div>
          <LevelRangeSelector v-model="levelRange" />
        </div>

        <div class="space-y-1.5 min-w-0">
          <div class="font-bold text-[#475569] dark:text-slate-200">目标合集:</div>
          <Select v-model="targetCollection" :disabled="UserCollectionList.length === 0">
            <SelectTrigger class="w-full h-8 text-xs bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 rounded-md px-3 font-medium min-w-0 max-w-full">
              <SelectValue placeholder="请选择目标合集" class="truncate min-w-0 block" />
            </SelectTrigger>
            <SelectContent>
              <SelectLabel>我的合集列表</SelectLabel>
              <SelectItem v-for="coll in UserCollectionList" :key="coll.label" :value="coll.label" class="truncate max-w-full">
                📁 {{ coll.label }} ({{ coll.list.size }})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5 min-w-0 overflow-hidden">
          <div class="font-bold text-[10px] text-[#64748B] dark:text-slate-400">
            导入清单预览 (共 {{ matches.count }} 首谱面):
          </div>
          <div class="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-[11px]">
            <div
              v-for="(row, idx) in matches.rows"
              :key="row.key"
              class="flex items-center justify-between py-0.5 text-slate-700 dark:text-slate-300 gap-2 min-w-0">
              <div class="flex items-center min-w-0 flex-1 overflow-hidden">
                <span class="text-slate-400 font-mono text-[10px] mr-1 shrink-0">{{ idx + 1 }}.</span>
                <div class="overflow-hidden min-w-0 flex-1">
                  <div v-overflow-scroll class="scroll-text">
                    <span class="font-medium text-[#0F172A] dark:text-slate-200">{{ row.title }}</span>
                    <span class="text-slate-400 dark:text-slate-500 text-[10px] ml-1">({{ row.artist }})</span>
                  </div>
                </div>
              </div>
              <span class="text-[10px] text-slate-400 shrink-0 font-mono">{{ row.diff }} {{ row.level }}</span>
            </div>
            <div v-if="matches.count > matches.rows.length" class="text-slate-400 text-center py-1 text-[10px]">
              … 还有 {{ matches.count - matches.rows.length }} 首
            </div>
            <div v-if="matches.count === 0" class="text-center py-2 text-slate-400 text-xs">
              没有符合条件的谱面
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          @click="emit('update:open', false)"
          class="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer">
          取消
        </button>
        <button
          @click="handleConfirm"
          :disabled="importing || matches.count === 0 || !targetCollection"
          class="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer">
          {{ importing ? '导入中...' : '确认导入！' }}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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

.scroll-text {
  display: inline-block;
  white-space: nowrap;
}

.scroll-text.is-overflowing {
  animation: marquee 6s linear infinite;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
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
