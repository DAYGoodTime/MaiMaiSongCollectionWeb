<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="w-[94vw] sm:w-[560px] max-w-[560px] max-h-[85vh] overflow-y-auto p-4 sm:p-5 select-none bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-xl shadow-xl">
      
      <!-- ============================================================== -->
      <!-- 头部：标题与描述 (Header)                                        -->
      <!-- ============================================================== -->
      <DialogHeader class="pb-2 border-b border-slate-100 dark:border-slate-800">
        <DialogTitle class="text-[15px] font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
          <span>📥</span>
          <span>批量导入至个人合集</span>
        </DialogTitle>
        <DialogDescription class="text-[11px] text-[#64748B] dark:text-slate-400">
          已从搜索结果中准备 {{ list.length }} 首符合条件的歌曲
        </DialogDescription>
        <p v-if="maxLimit && list.length >= maxLimit" class="text-[11px] text-rose-500 font-medium pt-0.5">
          ⚠️ 注意：当前歌曲数量超过建议值 ({{ maxLimit }})，这也许并非期望导入，请检查筛选条件是否合适。
        </p>
      </DialogHeader>

      <!-- 表单主体 -->
      <div class="space-y-4 py-1 text-xs min-w-0">
        <!-- ============================================================== -->
        <!-- 难度级别多选 (Diff Section)                                     -->
        <!-- ============================================================== -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-[#475569] dark:text-slate-300">
            选择导入难度级别:
          </label>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="diff in diffOptions"
              :key="diff.value"
              type="button"
              @click="toggleDiff(diff.value)"
              class="px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer border shadow-2xs"
              :class="selectedDiffs.includes(diff.value) ? diff.activeClass : 'bg-[#F1F5F9] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
              <span v-if="selectedDiffs.includes(diff.value)" class="mr-0.5">✓</span>
              <span>{{ diff.label }}</span>
            </button>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- 目标合集选择 (Target Section)                                   -->
        <!-- ============================================================== -->
        <div class="space-y-2 min-w-0">
          <label class="block text-xs font-bold text-[#475569] dark:text-slate-300">
            目标合集 <span class="text-[10px] font-normal text-[#64748B] dark:text-slate-400">(将覆盖原有合集中的曲目)</span>:
          </label>
          
          <Select v-model="selectedCollection" :disabled="UserCollectionList.length === 0">
            <SelectTrigger class="w-full h-8 text-xs bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 rounded-md px-3 font-medium min-w-0 max-w-full">
              <SelectValue placeholder="请选择需要导入的目标合集" class="truncate min-w-0 block" />
            </SelectTrigger>
            <SelectContent>
              <SelectLabel>我的合集列表</SelectLabel>
              <SelectItem v-for="coll in UserCollectionList" :key="coll.label" :value="coll.label" class="truncate max-w-full">
                📁 {{ coll.label }} ({{ coll.list ? coll.list.size : 0 }})
              </SelectItem>
              <SelectItem v-if="UserCollectionList.length === 0" value="empty" disabled>
                暂无可用合集，请在侧边栏新建
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- ============================================================== -->
        <!-- 导入清单预览 (Preview List Box)                                 -->
        <!-- ============================================================== -->
        <div class="bg-[#F8FAFC] dark:bg-slate-900/50 rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-2.5 space-y-1.5 min-w-0 overflow-hidden">
          <div class="text-[10px] font-bold text-[#64748B] dark:text-slate-400">
            导入清单预览 (共 {{ list.length }} 首):
          </div>
          <div class="max-h-32 overflow-y-auto pr-1 space-y-1 custom-scrollbar text-[11px]">
            <div
              v-for="(song, idx) in list"
              :key="song.id || idx"
              class="flex items-center justify-between py-0.5 text-slate-700 dark:text-slate-300 gap-2 min-w-0">
              <div class="flex items-center min-w-0 flex-1 overflow-hidden">
                <span class="text-slate-400 font-mono text-[10px] mr-1 shrink-0">{{ idx + 1 }}.</span>
                <div class="overflow-hidden min-w-0 flex-1">
                  <div v-overflow-scroll class="scroll-text">
                    <span class="font-medium text-[#0F172A] dark:text-slate-200">{{ song.title }}</span>
                    <span class="text-slate-400 dark:text-slate-500 text-[10px] ml-1">({{ song.artist }})</span>
                  </div>
                </div>
              </div>
              <span class="text-[10px] text-slate-400 shrink-0 font-mono">BPM {{ song.bpm }}</span>
            </div>
            <div v-if="list.length === 0" class="text-center py-2 text-slate-400 text-xs">
              暂无符合条件的搜索结果
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- 底部操作按钮 (Dialog Actions)                                   -->
      <!-- ============================================================== -->
      <DialogFooter class="flex flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          @click="open = false"
          class="px-4 py-1.5 rounded-md text-xs font-medium text-[#64748B] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
          取消
        </button>

        <button
          type="button"
          :disabled="isImporting || list.length === 0 || !selectedCollection"
          @click="handleImport"
          class="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs">
          {{ isImporting ? '导入中...' : '确认导入！' }}
        </button>
      </DialogFooter>

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, type Directive } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shadcn/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/shadcn/ui/select'
import type { MaiMaiSong } from '@/types/songs'
import type { TagOption } from '@/types/component'
import { storeToRefs } from 'pinia'
import { useCollectionStore } from '@/store/collections'
import { useScores } from '@/store/datasources/scores'
import { filterDiffByTag } from '@/utils/functionUtil'
import { toast } from 'vue-sonner'

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

interface DiffOption {
  label: string
  value: number
  activeClass: string
}

const props = withDefaults(
  defineProps<{
    list: MaiMaiSong[]
    tagOption?: TagOption
    maxLimit?: number
  }>(),
  {
    list: () => [],
    maxLimit: 100
  }
)

const open = defineModel<boolean>('open', { default: false })

const diffOptions: DiffOption[] = [
  { label: 'BAS', value: 0, activeClass: 'bg-[#22C55E] border-[#22C55E] text-white' },
  { label: 'ADV', value: 1, activeClass: 'bg-[#F59E0B] border-[#F59E0B] text-white' },
  { label: 'EXP', value: 2, activeClass: 'bg-[#F43F5E] border-[#F43F5E] text-white' },
  { label: 'MAS', value: 3, activeClass: 'bg-[#9333EA] border-[#9333EA] text-white' },
  { label: 'Re:MAS', value: 4, activeClass: 'bg-[#C084FC] border-[#C084FC] text-white' },
  { label: '宴', value: -1, activeClass: 'bg-cyan-600 border-cyan-600 text-white' }
]

// 默认勾选 MASTER 与 Re:MASTER
const selectedDiffs = ref<number[]>([3, 4])

const toggleDiff = (val: number) => {
  if (selectedDiffs.value.includes(val)) {
    selectedDiffs.value = selectedDiffs.value.filter(v => v !== val)
  } else {
    selectedDiffs.value.push(val)
  }
}

// 合集状态
const collectionStore = useCollectionStore()
const { UserCollectionList } = storeToRefs(collectionStore)
const ScoreStore = useScores()

const selectedCollection = ref<string>('')
const isImporting = ref(false)

// 执行导入
const handleImport = () => {
  if (!selectedCollection.value) {
    toast.warning('请选择需要导入的目标合集', { position: 'top-center' })
    return
  }

  const targetColl = UserCollectionList.value.find(c => c.label === selectedCollection.value)
  if (!targetColl) {
    toast.error('未找到目标合集', { position: 'top-center' })
    return
  }

  if (selectedDiffs.value.length === 0) {
    toast.warning('请至少选择一个导入难度级别', { position: 'top-center' })
    return
  }

  isImporting.value = true

  try {
    const targetLevels = selectedDiffs.value
    const diffList: string[] = []

    for (const song of props.list) {
      // 标准谱和 DX 谱
      const diffs = [
        ...(song.difficulties?.standard || []),
        ...(song.difficulties?.dx || [])
      ]

      const filteredDiffs = diffs.filter(diff => {
        const matchesLevel = targetLevels.includes(diff.level_index)
        if (!matchesLevel) return false
        if (props.tagOption) {
          const score = ScoreStore.getScoreByUni(song.id, diff.type, diff.level_index)
          return filterDiffByTag(props.tagOption, diff, score)
        }
        return true
      })

      for (const diff of filteredDiffs) {
        const diff_id = 'diff_id' in diff ? diff.diff_id : song.id
        diffList.push(`${diff_id}_${diff.type}_${diff.level_index}`)
      }

      // 宴会场谱面（若勾选了宴 -1）
      if (targetLevels.includes(-1) && song.difficulties?.utage) {
        for (const uDiff of song.difficulties.utage) {
          const diff_id = 'diff_id' in uDiff ? uDiff.diff_id : song.id
          diffList.push(`${diff_id}_utage_${uDiff.level_index}`)
        }
      }
    }

    targetColl.list = new Set<string>(diffList)
    toast.success(`导入成功，共向「${selectedCollection.value}」导入 ${diffList.length} 条谱面成绩！`, {
      position: 'top-center'
    })
    open.value = false
  } catch (err) {
    toast.error('导入合集时发生错误', { position: 'top-center' })
    console.error(err)
  } finally {
    isImporting.value = false
  }
}
</script>

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
