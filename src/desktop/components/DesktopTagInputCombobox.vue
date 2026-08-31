<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { X, Tag as TagIcon, CornerDownLeft } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import { toast } from 'vue-sonner'
import versionList from '@/assets/data/versions.json' with { type: 'json' }
import { isValidAchievementRange, LEVEL_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN } from '@/utils/StrUtil'
import { useScores } from '@/store/datasources/scores'

export interface Tag {
  label: string
  value: string
  alias: string | null
  needDs?: boolean
}

export interface TagOption {
  matchEvery: boolean
  tags: Tag[]
}

const modelValue = defineModel<Tag[]>('tags', { default: () => [] })

const searchTerm = ref('')
const isDropdownOpen = ref(false)
const activeIndex = ref(-1)

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

onClickOutside(containerRef, () => {
  isDropdownOpen.value = false
  activeIndex.value = -1
})

const ScoreStore = useScores()

// 基础版本列表
const versionListForTag: Tag[] = versionList.map((v) => ({
  label: v.label_full,
  value: v.id,
  alias: v.alias
}))

// 评级列表
const RankingTag: { label: string; value: string; alias: string }[] = [
  { label: 'SSS+', value: 'SSSp', alias: '鸟加' },
  { label: 'SSS', value: 'SSS', alias: '鸟' },
  { label: 'SS+', value: 'SSp', alias: '99.5' },
  { label: 'SS', value: 'SS', alias: '99' },
  { label: 'S+', value: 'Sp', alias: '98' },
  { label: 'S', value: 'S', alias: '97' },
  { label: 'AAA', value: 'AAA', alias: '94' },
  { label: 'AA', value: 'AA', alias: '90' },
  { label: 'Clean', value: 'clean', alias: '80' }
]

const addRankingPrefix = (prefix: '绿' | '黄' | '红' | '紫' | '白'): Tag[] => {
  return RankingTag.map((tag) => ({
    label: `${prefix}${tag.label}`,
    value: `${prefix}_${tag.value}`,
    alias: tag.alias,
    needDs: true
  }))
}

// 快速预设标签
const quickPresetTags: { group: string; tags: Tag[] }[] = [
  {
    group: '常用定数',
    tags: [
      { label: '紫14+', value: '紫14+', alias: '紫14+' },
      { label: '紫14', value: '紫14', alias: '紫14' },
      { label: '紫13+', value: '紫13+', alias: '紫13+' },
      { label: '紫13', value: '紫13', alias: '紫13' },
    ]
  },
  {
    group: '达成率评级',
    tags: [
      { label: '紫谱SSS+', value: '紫_SSSp', alias: '鸟加', needDs: true },
      { label: '紫谱SSS', value: '紫_SSS', alias: '鸟', needDs: true },
      { label: '红谱SSS+', value: '红_SSSp', alias: '鸟加', needDs: true },
      { label: '白谱SSS+', value: '白_SSSp', alias: '鸟加', needDs: true }
    ]
  }
]

// 动态联想匹配标签
const filteredTags = computed<Tag[]>(() => {
  const query = searchTerm.value.trim().toLowerCase()
  const currentLabels = new Set(modelValue.value.map((t) => t.label))
  const result: Tag[] = []

  if (!query) return []

  // 1. 定数完全匹配 (如 "紫14.8", "红13")
  if (LEVEL_MATCH_PATTEN.test(searchTerm.value)) {
    if (!currentLabels.has(searchTerm.value)) {
      return [{
        label: searchTerm.value,
        value: searchTerm.value,
        alias: searchTerm.value
      }]
    }
    return []
  }

  // 2. 定数区间匹配 (如 "14.0-14.8")
  if (LEVEL_RANGE_MATCH_PATTEN.test(searchTerm.value)) {
    const [start, end] = searchTerm.value.split('-')
    if (Number(start) < Number(end) && !currentLabels.has(searchTerm.value)) {
      return [{
        label: searchTerm.value,
        value: searchTerm.value,
        alias: searchTerm.value
      }]
    }
  }

  // 3. 难度前缀联想 (输入 "紫" / "红" / "黄" / "绿" / "白")
  const searchPrefix = searchTerm.value.substring(0, 1)
  if ('绿黄红紫白'.includes(searchPrefix) && searchPrefix.length > 0) {
    const rankingList = addRankingPrefix(searchPrefix as '绿' | '黄' | '红' | '紫' | '白')
    const subQuery = searchTerm.value.substring(1).trim().toLowerCase()

    if (subQuery) {
      rankingList.forEach((r) => {
        if (
          (r.label.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            (r.alias && r.alias.toLowerCase().includes(subQuery))) &&
          !currentLabels.has(r.label)
        ) {
          result.push(r)
        }
      })
    } else {
      rankingList.forEach((r) => {
        if (!currentLabels.has(r.label)) result.push(r)
      })
    }
  }

  // 4. 达成率范围匹配 (如 "100.4-100.4999")
  if (isValidAchievementRange(searchTerm.value) && !currentLabels.has(searchTerm.value)) {
    result.push({
      label: searchTerm.value,
      value: searchTerm.value,
      alias: searchTerm.value,
      needDs: true
    })
  }

  // 5. 版本匹配
  const matchedVersions = versionListForTag.filter(
    (v) =>
      (v.label.toLowerCase().includes(query) || (v.alias && v.alias.toLowerCase().includes(query))) &&
      !currentLabels.has(v.label)
  )
  matchedVersions.forEach((v) => result.push(v))

  return result
})

const addTag = (tag: Tag) => {
  if (tag.needDs && ScoreStore.getSelectableSource.length === 0) {
    toast.error('请在设置中添加成绩数据源后再使用成绩相关标签')
    return
  }

  if (!modelValue.value.some((t) => t.label === tag.label)) {
    modelValue.value = [...modelValue.value, tag]
  }

  searchTerm.value = ''
  activeIndex.value = -1
  inputRef.value?.focus()
}

const toggleTag = (tag: Tag) => {
  if (modelValue.value.some((t) => t.label === tag.label)) {
    removeTag(tag)
    return
  }
  addTag(tag)
}

// 移除标签
const removeTag = (tag: Tag) => {
  modelValue.value = modelValue.value.filter((t) => t.label !== tag.label)
}

// 清空全部标签
const clearAllTags = () => {
  modelValue.value = []
  searchTerm.value = ''
  activeIndex.value = -1
}

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    isDropdownOpen.value = true
    if (filteredTags.value.length > 0) {
      activeIndex.value = (activeIndex.value + 1) % filteredTags.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredTags.value.length > 0) {
      activeIndex.value = (activeIndex.value - 1 + filteredTags.value.length) % filteredTags.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0 && activeIndex.value < filteredTags.value.length) {
      addTag(filteredTags.value[activeIndex.value])
    } else if (filteredTags.value.length === 1) {
      addTag(filteredTags.value[0])
    } else if (searchTerm.value.trim()) {
      // 尝试自识别并添加
      const text = searchTerm.value.trim()
      if (LEVEL_MATCH_PATTEN.test(text) || LEVEL_RANGE_MATCH_PATTEN.test(text) || isValidAchievementRange(text)) {
        addTag({
          label: text,
          value: text,
          alias: text,
          needDs: isValidAchievementRange(text)
        })
      }
    }
  } else if (e.key === 'Backspace' && !searchTerm.value && modelValue.value.length > 0) {
    // 当输入框为空时按退格键删除最后一个标签
    modelValue.value = modelValue.value.slice(0, -1)
  } else if (e.key === 'Escape') {
    isDropdownOpen.value = false
    activeIndex.value = -1
  }
}

// 标签色彩分类样式
const getTagBadgeClass = (tag: Tag | string) => {
  const label = typeof tag === 'string' ? tag : tag.label
  const prefix = label.charAt(0)

  if (prefix === '紫') {
    return 'bg-purple-50 dark:bg-purple-950/40 text-[#9333EA] dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
  }
  if (prefix === '红') {
    return 'bg-red-50 dark:bg-red-950/40 text-[#DC2626] dark:text-red-400 border-red-200 dark:border-red-800/60'
  }
  if (prefix === '黄') {
    return 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
  }
  if (prefix === '绿') {
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
  }
  if (prefix === '白') {
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
  }
  if (label.includes('-') && !isNaN(Number(label.split('-')[0]))) {
    return 'bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
  }
  // 版本或其他标签
  return 'bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
}
</script>

<template>
  <div class="relative w-full" ref="containerRef">
    <!-- 主输入框与 Chip 容器 -->
    <div @click="inputRef?.focus()"
      class="flex flex-wrap items-center gap-1.5 p-2 min-h-[38px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 rounded-md transition-all focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] cursor-text">

      <!-- 已选标签 Chips -->
      <template v-for="tag in modelValue" :key="tag.label">
        <span
          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all animate-in fade-in zoom-in-95 duration-100 shrink-0"
          :class="getTagBadgeClass(tag)">
          <span class="max-w-[130px] truncate">{{ tag.label }}</span>
          <button type="button" @click.stop="removeTag(tag)"
            class="hover:opacity-75 focus:outline-none cursor-pointer flex items-center justify-center p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            title="移除此标签">
            <X class="w-2.5 h-2.5" />
          </button>
        </span>
      </template>

      <!-- 搜索输入与快捷交互 -->
      <div class="flex-1 flex items-center min-w-[100px] gap-1">
        <input ref="inputRef" v-model="searchTerm" type="text"
          :placeholder="modelValue.length === 0 ? '输入标签 (如: 紫14.8 / 鸟加 / BUDDiES)...' : '继续添加...'"
          class="w-full bg-transparent border-none outline-none text-xs text-[#0F172A] dark:text-white placeholder:text-slate-400 placeholder:text-[11px]"
          @focus="isDropdownOpen = true" @keydown="handleKeyDown" />
      </div>

      <!-- 右侧清空与指示器 -->
      <div class="flex items-center gap-1 shrink-0">
        <button v-if="modelValue.length > 0" type="button" @click.stop="clearAllTags"
          class="text-[10px] font-medium text-slate-400 hover:text-red-500 transition-colors px-1 cursor-pointer"
          title="清空已选标签">
          清空
        </button>
        <button type="button" @click.stop="isDropdownOpen = !isDropdownOpen"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-0.5"
          title="展开标签选择">
          <TagIcon class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- 下拉联想与推荐面板 (Desktop Styled Dropdown Popover) -->
    <div v-show="isDropdownOpen"
      class="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 text-xs">

      <!-- 联想过滤结果列表 -->
      <div v-if="searchTerm.trim()" class="max-h-56 overflow-y-auto custom-scrollbar p-1">
        <div v-if="filteredTags.length === 0" class="py-4 text-center text-slate-400 text-xs px-2">
          <div>无直接匹配标签</div>
          <div class="text-[10px] text-slate-400 mt-0.5">可按回车尝试添加: "{{ searchTerm }}"</div>
        </div>

        <div v-else class="space-y-0.5">
          <button v-for="(tag, idx) in filteredTags" :key="tag.label" type="button" @click="addTag(tag)"
            class="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer"
            :class="idx === activeIndex
              ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'">
            <div class="flex items-center gap-2 min-w-0">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border" :class="getTagBadgeClass(tag)">
                {{ tag.label }}
              </span>
              <span v-if="tag.alias" class="text-[10px] text-slate-400 truncate">
                ({{ tag.alias }})
              </span>
            </div>
            <CornerDownLeft class="w-3 h-3 opacity-40 shrink-0" />
          </button>
        </div>
      </div>

      <!-- 无搜索输入时的分类预设与快速推荐 -->
      <div v-else class="max-h-64 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
        <div v-for="section in quickPresetTags" :key="section.group" class="space-y-1.5">
          <div class="text-[10px] font-bold text-[#64748B] dark:text-slate-400 px-0.5">
            {{ section.group }}
          </div>
          <div class="flex flex-wrap gap-1">
            <template v-for="tag in section.tags" :key="tag.label">
              <button type="button" @click="toggleTag(tag)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer"
                :class="[
                  getTagBadgeClass(tag),
                  modelValue.some(t => t.label === tag.label)
                    ? 'ring-1 ring-current'
                    : 'hover:scale-105 active:scale-95 opacity-80'
                ]">
                <span>{{ tag.label }}</span>
                <span v-if="tag.alias && tag.alias !== tag.label" class="text-[9px] opacity-75">
                  · {{ tag.alias }}
                </span>
              </button>
            </template>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 自定义细滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
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
