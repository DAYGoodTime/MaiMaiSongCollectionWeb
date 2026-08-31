<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleOff, Info, Copy, Hash, FolderPlus, Trash2 } from '@lucide/vue'
import CollectionScoreCard, { type CollectionCardItem } from './CollectionScoreCard.vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/shadcn/ui/context-menu'

interface CollectionItem {
  label: string
}

interface Props {
  items: CollectionCardItem[]
  loading?: boolean
  otherCollections?: CollectionItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  otherCollections: () => []
})

const emit = defineEmits<{
  'select-card': [item: CollectionCardItem]
  'open-detail': [item: CollectionCardItem]
  'remove-item': [item: CollectionCardItem]
  'add-to-collection': [collLabel: string, item: CollectionCardItem]
  'copy-title': [item: CollectionCardItem]
  'copy-id': [item: CollectionCardItem]
}>()

const PAGE_SIZE = 60
const visibleCount = ref(PAGE_SIZE)
const contextItem = ref<CollectionCardItem | null>(null)
const tip = ref({ text: '', x: 0, y: 0 })

const visibleItems = computed(() => props.items.slice(0, visibleCount.value))

watch(() => props.items, () => {
  visibleCount.value = PAGE_SIZE
})

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
    visibleCount.value = Math.min(props.items.length, visibleCount.value + PAGE_SIZE)
  }
  if (tip.value.text) tip.value = { text: '', x: 0, y: 0 }
}

const onTipOver = (e: PointerEvent) => {
  const el = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
  if (!el?.dataset.tip) return
  const r = el.getBoundingClientRect()
  tip.value = { text: el.dataset.tip, x: r.left + r.width / 2, y: r.top }
}

const onTipOut = (e: PointerEvent) => {
  const from = (e.target as HTMLElement).closest('[data-tip]')
  const to = e.relatedTarget instanceof HTMLElement ? e.relatedTarget.closest('[data-tip]') : null
  if (from && from !== to) tip.value = { text: '', x: 0, y: 0 }
}

const onCardContext = (_e: MouseEvent, item: CollectionCardItem) => {
  contextItem.value = item
}

const onContextMenuTrigger = (e: MouseEvent) => {
  const target = (e.target as HTMLElement).closest('[data-component="CollectionScoreCard"]')
  if (!target) {
    e.preventDefault()
    return
  }
  const scoreId = (target as HTMLElement).dataset.scoreId
  contextItem.value = props.items.find(i => i.scoreId === scoreId) ?? contextItem.value
}

const run = (fn: (item: CollectionCardItem) => void) => {
  if (contextItem.value) fn(contextItem.value)
}
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar select-none" @scroll="onScroll" @pointerover="onTipOver" @pointerout="onTipOut">
    <div v-if="props.loading" class="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin"></div>
      <span class="text-xs font-medium">正在检索合集成绩数据...</span>
    </div>

    <div v-else-if="props.items.length === 0"
      class="flex flex-col items-center justify-center h-64 gap-2 bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg text-slate-400 p-6 text-center">
      <div
        class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <CircleOff class="w-6 h-6" />
      </div>
      <div class="font-bold text-sm text-[#0F172A] dark:text-white">暂未检索到符合条件的谱面成绩</div>
      <p class="text-xs text-[#64748B] dark:text-slate-400 max-w-sm">
        请尝试调整筛选难度、定数区间或关键词，或点击右上角「批量导入」添加曲目。
      </p>
    </div>

    <ContextMenu v-else>
      <ContextMenuTrigger as-child @contextmenu="onContextMenuTrigger">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1 sm:gap-1 pb-4" @contextmenu="onContextMenuTrigger">
          <CollectionScoreCard
            v-for="item in visibleItems"
            :key="item.scoreId"
            :item="item"
            @click="emit('select-card', item)"
            @dblclick="emit('open-detail', item)"
            @contextmenu="onCardContext"
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent class="w-56">
        <ContextMenuLabel class="text-xs text-muted-foreground truncate font-normal">
          {{ contextItem?.title }} [{{ contextItem?.diffName }}]
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem @click="run(item => emit('open-detail', item))">
          <Info class="w-4 h-4 mr-2" />
          查看歌曲与谱面详情
        </ContextMenuItem>
        <ContextMenuItem @click="run(item => emit('copy-title', item))">
          <Copy class="w-4 h-4 mr-2" />
          复制歌曲名称
        </ContextMenuItem>
        <ContextMenuItem @click="run(item => emit('copy-id', item))">
          <Hash class="w-4 h-4 mr-2" />
          复制歌曲 ID
        </ContextMenuItem>
        <ContextMenuSub v-if="props.otherCollections && props.otherCollections.length > 0">
          <ContextMenuSubTrigger>
            <FolderPlus class="w-4 h-4 mr-2" />
            添加至其他合集
          </ContextMenuSubTrigger>
          <ContextMenuSubContent class="w-44">
            <ContextMenuItem v-for="coll in props.otherCollections" :key="coll.label"
              @click="run(item => emit('add-to-collection', coll.label, item))">
              {{ coll.label }}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem
          class="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
          @click="run(item => emit('remove-item', item))">
          <Trash2 class="w-4 h-4 mr-2" />
          从当前合集移除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </div>
  <Teleport to="body">
    <div
      v-if="tip.text"
      class="fixed z-[200] pointer-events-none px-2 py-1 rounded-md text-[11px] font-medium text-white bg-slate-900/95 dark:bg-slate-100 dark:text-slate-900 shadow-lg whitespace-nowrap"
      :style="{ left: tip.x + 'px', top: tip.y + 'px', transform: 'translate(-50%, calc(-100% - 8px))' }"
    >{{ tip.text }}</div>
  </Teleport>
</template>

<style scoped>
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
