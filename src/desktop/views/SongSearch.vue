<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { X, Search, ChevronDown, SlidersHorizontal } from '@lucide/vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { refDebounced } from '@vueuse/core'
import type { SongType, MaiMaiSong } from '@/types/songs'
import SongDetail from '@/desktop/components/SongDetail.vue'
import ImportFromResultDialog from '@/desktop/components/ImportFromResultDialog.vue'
import DesktopAppShell from '@/desktop/components/DesktopAppShell.vue'
import TagInputCombobox from '@/desktop/components/DesktopTagInputCombobox.vue'
import { Slider } from '@/components/shadcn/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/ui/collapsible'
import CoverImage from '@/components/CoverImage.vue'
import { useSongStore } from '@/store/datasources/song'
import { useSongSearchWorker } from '@/utils/workerHelper'
import type { SearchOptions, TagOption } from '@/types/component'
import songGenres from '@/assets/data/song_genres.json' with { type: 'json' }
import versionList from '@/assets/data/versions.json' with { type: 'json' }
import { isAllFinal } from '@/utils/StrUtil'

const songStore = useSongStore()
const mobileActiveTab = ref<'search' | 'detail'>('search')
const isMobile = ref(false)

const updateResponsiveState = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  updateResponsiveState()
  window.addEventListener('resize', updateResponsiveState)
})

const selectedChartType = ref<SongType>('dx')
const selectedDiffIndex = ref<number>(3)

const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 150)
const tagOption = ref<TagOption>({
  matchEvery: true,
  tags: []
})
const bpmFilterEnabled = ref(false)
const bpmRange = ref<number[]>([100, 240])

const selectedGenres = ref<string[]>([])
const selectedVersions = ref<string[]>([])
const isFiltersExpanded = ref(false)

const activeFilterBadgeCount = computed(() => {
  let count = 0
  if (bpmFilterEnabled.value) count++
  if (selectedGenres.value.length) count += selectedGenres.value.length
  if (selectedVersions.value.length) count += selectedVersions.value.length
  return count
})

const searchOptions = computed<SearchOptions>(() => ({
  tagOption: tagOption.value,
  bpm: {
    enable: bpmFilterEnabled.value,
    range: bpmRange.value
  }
}))

const { searchResults, isLoading } = useSongSearchWorker(debouncedQuery, searchOptions)

const toggleGenre = (value: string) => {
  const i = selectedGenres.value.indexOf(value)
  selectedGenres.value = i === -1
    ? [...selectedGenres.value, value]
    : selectedGenres.value.filter(g => g !== value)
}

const toggleVersion = (value: string) => {
  const i = selectedVersions.value.indexOf(value)
  selectedVersions.value = i === -1
    ? [...selectedVersions.value, value]
    : selectedVersions.value.filter(v => v !== value)
}

// ponytail: genre/version stay local; lift into SearchOptions if mobile search needs them
const displaySongList = computed<MaiMaiSong[]>(() => {
  let list = searchResults.value
  if (selectedGenres.value.length) {
    const set = new Set(selectedGenres.value)
    list = list.filter(s => set.has(s.genre))
  }
  if (selectedVersions.value.length) {
    const set = new Set(selectedVersions.value)
    const hasAllFinale = set.has('ALL FiNALE')
    list = list.filter(s => set.has(s.version) || (hasAllFinale && isAllFinal(s.version)))
  }
  return list
})

const selectedSongId = ref<number | null>(null)

const selectedSong = computed<MaiMaiSong | null>(() => {
  const list = displaySongList.value
  if (!list || list.length === 0) {
    if (selectedSongId.value !== null) {
      const found = songStore.getSong(selectedSongId.value)
      if (found) return found
    }
    return null
  }
  if (selectedSongId.value !== null) {
    const found = list.find(s => s.id === selectedSongId.value)
    if (found) return found
  }
  return list[0] || null
})

const isImportDialogOpen = ref(false)

const handleSelectSong = (songId: number) => {
  selectedSongId.value = songId
  if (isMobile.value) {
    mobileActiveTab.value = 'detail'
  }
}

const listParentRef = ref<HTMLElement | null>(null)
const rowVirtualizer = useVirtualizer(computed(() => ({
  count: displaySongList.value.length,
  getScrollElement: () => listParentRef.value,
  estimateSize: () => 56,
  overscan: 8,
  gap: 6,
})))
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

watch(displaySongList, () => {
  listParentRef.value?.scrollTo({ top: 0 })
})
</script>

<template>
  <DesktopAppShell>
    <!-- ============================================================== -->
    <!-- 移动端顶部导航栏 (Mobile Top Bar - < md)                       -->
    <!-- ============================================================== -->
    <template #mobile-header>
      <header
        class="md:hidden flex items-center justify-between px-3 py-2 border-b border-[#E2E8F0] dark:border-[#26354D] bg-white dark:bg-[#111827] shrink-0">
        <div class="flex items-center gap-2">
          <div
            class="w-6 h-6 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            ♫
          </div>
          <span class="font-bold text-xs tracking-tight text-[#0F172A] dark:text-white">SongCollections</span>
        </div>

        <!-- 移动端视图切换 Tabs -->
        <div
          class="flex items-center bg-[#F1F5F9] dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <button @click="mobileActiveTab = 'search'"
            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
            :class="mobileActiveTab === 'search'
              ? 'bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'">
            <span>🔍</span>
            <span>搜索曲目</span>
          </button>

          <button @click="mobileActiveTab = 'detail'"
            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
            :class="mobileActiveTab === 'detail'
              ? 'bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'">
            <span>💿</span>
            <span>谱面详情</span>
          </button>
        </div>
      </header>
    </template>

    <!-- ============================================================== -->
    <!-- 中右侧双栏工作区 (Responsive Workspace)                       -->
    <!-- ============================================================== -->
    <main class="flex-1 flex h-full min-w-0 gap-2.5 p-2.5 sm:gap-3 sm:p-3 lg:gap-4 lg:p-4 overflow-hidden">

      <!-- ============================================================ -->
      <!-- 搜索与筛选列 (Search & Filter Column - 弹性伸缩)              -->
      <!-- ============================================================ -->
      <section v-show="!isMobile || mobileActiveTab === 'search'"
        class="w-full md:w-[280px] lg:w-[330px] xl:w-[380px] 2xl:w-[420px] md:shrink-0 h-full flex flex-col gap-2.5 sm:gap-3 min-h-0 transition-all duration-200">

        <!-- 搜索控制卡片 (Search Controls Card) -->
        <div
          class="bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-3 sm:p-3.5 shadow-xs space-y-2.5 sm:space-y-3 shrink-0 transition-colors">

          <!-- 卡片头部标题与导入按钮 -->
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#0F172A] dark:text-white truncate">
              <span>🔍</span>
              <span class="truncate">歌曲与谱面搜索</span>
            </div>
            <button @click="isImportDialogOpen = true"
              class="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer shrink-0">
              <span>导入至合集 →</span>
            </button>
          </div>

          <!-- 搜索输入框 -->
          <div
            class="relative flex items-center bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 rounded-md px-2.5 py-1.5 sm:py-2 gap-2 transition-colors focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]">
            <Search class="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <input v-model="searchQuery" type="text" placeholder="标题 / 曲师 / 谱师 / 别名 / 拼音"
              class="w-full bg-transparent border-none outline-none text-xs sm:text-[13px] font-bold text-[#0F172A] dark:text-white placeholder:text-slate-400 placeholder:font-normal" />
            <button v-if="searchQuery" @click="searchQuery = ''"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 组合标签筛选区 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-bold text-[#475569] dark:text-slate-300">组合标签:</span>
              <button @click="tagOption.matchEvery = !tagOption.matchEvery"
                class="flex items-center gap-1 text-[10px] text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer">
                <span>{{ tagOption.matchEvery ? '✓ 满足所有标签' : '满足部分标签' }}</span>
              </button>
            </div>

            <!-- 标签输入框与联想下拉 -->
            <TagInputCombobox v-model:tags="tagOption.tags" />
          </div>

          <!-- 组合标签以下可折叠筛选区 (BPM / 类别 / 版本) -->
          <Collapsible v-model:open="isFiltersExpanded" class="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <CollapsibleTrigger as-child>
              <button type="button"
                class="w-full flex items-center justify-between px-1 py-1 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                <div class="flex items-center gap-1.5 min-w-0">
                  <SlidersHorizontal class="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
                  <span class="truncate">更多筛选 (BPM / 类别 / 版本)</span>
                  <span v-if="activeFilterBadgeCount > 0"
                    class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-[#BFDBFE] dark:border-blue-800/60 shrink-0">
                    {{ activeFilterBadgeCount }}
                  </span>
                </div>
                <div class="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 ml-1">
                  <span>{{ isFiltersExpanded ? '收起' : '展开' }}</span>
                  <ChevronDown class="w-3.5 h-3.5 transition-transform duration-200"
                    :class="{ 'rotate-180': isFiltersExpanded }" />
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent class="space-y-2.5 pt-1">
              <!-- BPM 筛选与范围设置 -->
              <div
                class="bg-[#F8FAFC] dark:bg-slate-900/50 rounded-md p-2 sm:p-2.5 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div class="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <div class="flex items-center gap-1.5 font-bold text-[#334155] dark:text-slate-300 truncate mr-1">
                    <span>BPM 范围:</span>
                    <span
                      :class="bpmFilterEnabled ? 'text-[#2563EB] dark:text-blue-400 font-extrabold' : 'text-slate-400 font-normal'">
                      {{ bpmRange[0] }} ~ {{ bpmRange[1] }}
                    </span>
                  </div>
                  <button type="button" @click="bpmFilterEnabled = !bpmFilterEnabled"
                    class="font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer shrink-0"
                    :class="bpmFilterEnabled ? 'text-[#22C55E] dark:text-emerald-400' : 'text-slate-400'">
                    [{{ bpmFilterEnabled ? '开启' : '关闭' }}]
                  </button>
                </div>

                <!-- BPM 双向滑块与微调输入 -->
                <div v-show="bpmFilterEnabled" class="space-y-2 pt-1">
                  <div class="px-1 py-0.5">
                    <Slider v-model="bpmRange" :min="50" :max="350" :step="1" :show-min-max="false"
                      class="w-full cursor-pointer" />
                  </div>

                  <div class="flex items-center justify-between gap-1 text-[10px]">
                    <div class="flex items-center gap-1">
                      <span class="text-slate-400">Min</span>
                      <input type="number" v-model.number="bpmRange[0]" :min="1" :max="bpmRange[1]"
                        class="w-12 px-1 py-0.5 text-center font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 text-[10px]" />
                    </div>

                    <div class="flex items-center gap-1">
                      <button type="button" @click="bpmRange = [120, 200]"
                        class="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] transition-colors cursor-pointer">
                        120-200
                      </button>
                      <button type="button" @click="bpmRange = [200, 320]"
                        class="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] transition-colors cursor-pointer">
                        200+
                      </button>
                    </div>

                    <div class="flex items-center gap-1">
                      <span class="text-slate-400">Max</span>
                      <input type="number" v-model.number="bpmRange[1]" :min="bpmRange[0]" :max="400"
                        class="w-12 px-1 py-0.5 text-center font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 text-[10px]" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 类别筛选 -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-[#475569] dark:text-slate-300">类别:</span>
                  <button v-if="selectedGenres.length" type="button" @click="selectedGenres = []"
                    class="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer">
                    取消全部
                  </button>
                </div>
                <div class="flex flex-wrap gap-1">
                  <button v-for="g in songGenres" :key="g.value" type="button" @click="toggleGenre(g.value)"
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer"
                    :class="selectedGenres.includes(g.value)
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border-[#BFDBFE] dark:border-blue-800/60'
                      : 'bg-[#F8FAFC] dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'">
                    {{ g.label }}
                  </button>
                </div>
              </div>

              <!-- 版本筛选 -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-[#475569] dark:text-slate-300">版本:</span>
                  <button v-if="selectedVersions.length" type="button" @click="selectedVersions = []"
                    class="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer">
                    取消全部
                  </button>
                </div>
                <div class="flex flex-wrap gap-1">
                  <button v-for="v in versionList" :key="v.id" type="button" @click="toggleVersion(v.id)"
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer"
                    :class="selectedVersions.includes(v.id)
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border-[#BFDBFE] dark:border-blue-800/60'
                      : 'bg-[#F8FAFC] dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'">
                    {{ v.label_full }}
                  </button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <!-- 搜索匹配曲目列表卡片 (Search Results List Card) -->
        <div
          class="bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-2.5 sm:p-3 shadow-xs flex-1 flex flex-col min-h-0 transition-colors">
          <div
            class="text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-2 px-1 flex items-center justify-between">
            <span>匹配曲目 (共 {{ displaySongList.length }} 首):</span>
          </div>

          <!-- 滚动列表容器 -->
          <div ref="listParentRef" class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-10 text-slate-400 text-xs">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2563EB] mb-2"></div>
              <span>检索曲目中...</span>
            </div>

            <div v-else-if="displaySongList.length === 0"
              class="flex flex-col items-center justify-center py-10 text-slate-400 text-xs text-center px-3">
              <span class="text-2xl mb-1.5">🔍</span>
              <span class="font-bold text-slate-600 dark:text-slate-300">未找到匹配的歌曲</span>
              <span class="text-[10px] text-slate-400 mt-1">请尝试修改搜索词或放宽标签/BPM筛选</span>
            </div>

            <div v-else :style="{ height: `${totalSize}px`, position: 'relative', width: '100%' }">
              <div v-for="row in virtualRows" :key="displaySongList[row.index]?.id ?? row.index"
                @click="handleSelectSong(displaySongList[row.index].id)" :style="{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${row.size}px`,
                  transform: `translateY(${row.start}px)`,
                }" class="flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer"
                :class="selectedSong?.id === displaySongList[row.index].id
                  ? 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#3B82F6] dark:border-blue-500 shadow-xs'
                  : 'bg-[#F8FAFC] dark:bg-slate-900/40 border-[#E2E8F0] dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60'">
                <div class="flex items-center gap-2 min-w-0 pr-2">
                  <CoverImage :id="displaySongList[row.index].id" :alt="displaySongList[row.index].title"
                    class="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800" />
                  <div class="min-w-0">
                    <div class="text-xs sm:text-[13px] font-bold truncate leading-snug"
                      :class="selectedSong?.id === displaySongList[row.index].id ? 'text-[#1D4ED8] dark:text-blue-400' : 'text-[#0F172A] dark:text-slate-100'">
                      {{ displaySongList[row.index].title }}
                    </div>
                    <div
                      class="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 truncate leading-tight mt-0.5">
                      {{ displaySongList[row.index].artist }} · BPM {{ displaySongList[row.index].bpm }}
                    </div>
                  </div>
                </div>

                <div class="shrink-0 flex items-center">
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 max-w-[100px] truncate text-center"
                    :title="displaySongList[row.index].version">
                    {{ displaySongList[row.index].version }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ============================================================ -->
      <!-- 歌曲详情工作区 (Song Detail Workspace 组件 - 响应式宽度)      -->
      <!-- ============================================================ -->
      <SongDetail v-show="!isMobile || mobileActiveTab === 'detail'" :song="selectedSong"
        v-model:selected-type="selectedChartType" v-model:selected-diff-index="selectedDiffIndex"
        :show-mobile-back="isMobile" @back="mobileActiveTab = 'search'" class="flex-1 min-w-0" />

    </main>

    <!-- 批量导入至合集弹窗 -->
    <ImportFromResultDialog v-model:open="isImportDialogOpen" :list="displaySongList" />
  </DesktopAppShell>
</template>

<style scoped>
/* 自定义细滚动条 */
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
