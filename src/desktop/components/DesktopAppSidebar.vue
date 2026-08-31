<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  Settings,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Pencil,
  Trash2
} from '@lucide/vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useScores } from '@/store/datasources/scores'
import { useCollectionStore } from '@/store/collections'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/shadcn/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shadcn/ui/dialog'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import CollectionManageDialog from './collection/modals/CollectionManageDialog.vue'

interface Props {
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

const router = useRouter()
const route = useRoute()
const ScoreStore = useScores()
const collectionStore = useCollectionStore()

const displayCollections = computed(() => collectionStore.UserCollectionList ?? [])
const isManageDialogOpen = ref(false)

const targetCollection = ref<{
  coll: any
  index: number
} | null>(null)

const actionDialog = ref<{
  open: boolean
  type: 'add' | 'edit' | 'delete'
  targetIndex: number
  targetLabel: string
  inputValue: string
}>({
  open: false,
  type: 'add',
  targetIndex: -1,
  targetLabel: '',
  inputValue: ''
})

const actionDialogInfo = computed(() => {
  switch (actionDialog.value.type) {
    case 'add':
      return {
        title: '新建合集',
        description: '创建一个新的个人歌曲合集',
        confirmText: '创建'
      }
    case 'edit':
      return {
        title: '重命名合集',
        description: `修改合集「${actionDialog.value.targetLabel}」的名称`,
        confirmText: '保存'
      }
    case 'delete':
      return {
        title: '删除合集',
        description: `确定要删除合集「${actionDialog.value.targetLabel}」吗？此操作不可恢复。`,
        confirmText: '确认删除'
      }
    default:
      return { title: '', description: '', confirmText: '确定' }
  }
})

const openActionDialog = (type: 'add' | 'edit' | 'delete', index = -1, label = '') => {
  actionDialog.value = {
    open: true,
    type,
    targetIndex: index,
    targetLabel: label,
    inputValue: type === 'edit' ? label : ''
  }
}

const handleActionSubmit = () => {
  const { type, targetIndex, inputValue } = actionDialog.value
  const trimmed = inputValue.trim()

  if (type !== 'delete' && !trimmed) {
    toast.error('合集名称不能为空')
    return
  }

  let result: { success: boolean, message: string } = { success: false, message: '' }

  if (type === 'add') {
    result = collectionStore.newCollection(trimmed)
  } else if (type === 'edit') {
    result = collectionStore.EditCollectionName(targetIndex, trimmed)
  } else if (type === 'delete') {
    result = collectionStore.DeleteCollection(targetIndex)
  }

  if (result.success) {
    actionDialog.value.open = false
  } else {
    toast.error(result.message)
  }
}

const onCollectionContextMenu = (coll: any, index: number) => {
  targetCollection.value = { coll, index }
}

const onCollectionsContainerContextMenu = (e: MouseEvent) => {
  const itemEl = (e.target as HTMLElement).closest('[data-collection-item]')
  if (!itemEl) {
    targetCollection.value = null
  }
}

const getItemCount = (coll: any) => {
  if (coll.list instanceof Set) return coll.list.size
  if (Array.isArray(coll.list)) return coll.list.length
  return coll.count ?? 0
}

// 路由激活态匹配
const isSearchActive = computed(() => {
  return route.path === '/desktop' || route.path === '/test' || route.name === 'Test'
})

const isCollectionActive = computed(() => {
  return route.path.startsWith('/desktop/collection') || route.path.startsWith('/collection') || route.name === 'Collection' || route.name === 'DesktopCollection'
})

const isSettingsActive = computed(() => {
  return route.path.startsWith('/desktop/settings') || route.name === 'DesktopSettings'
})

const currentDataSourceName = computed(() => {
  switch (ScoreStore.selectedSource) {
    case 'lxns': return '落雪 (LXNS)'
    case 'divingfish': return '水鱼查分器'
    case 'usagi': return 'UsagiCard 兔卡'
    default: return '未配置数据源'
  }
})

const toggleCollapse = () => {
  emit('update:collapsed', !props.collapsed)
}

const navigateTo = (path: string) => {
  router.push(path).catch(() => { })
}

const navigateToCollection = (label?: string) => {
  if (label) {
    router.push({ name: 'DesktopCollection', query: { label } }).catch(() => { })
  } else {
    router.push('/desktop/collection').catch(() => { })
  }
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col justify-between h-full bg-white dark:bg-[#131B2E] border-r border-[#E2E8F0] dark:border-[#26354D] p-3 sm:p-4 transition-all duration-300 select-none shrink-0 overflow-hidden"
    :class="props.collapsed ? 'w-14 sm:w-16 p-2 sm:p-2.5' : 'w-56 lg:w-60'">

    <!-- 侧边栏顶部品牌与导航 -->
    <div class="space-y-4">
      <!-- 品牌 Logo 与折叠按钮 -->
      <div class="flex items-center" :class="props.collapsed ? 'justify-center' : 'justify-between px-1'">
        <div v-if="!props.collapsed" class="flex items-center gap-2 min-w-0">
          <div
            class="w-7 h-7 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            ♫
          </div>
          <span class="font-bold text-sm tracking-tight text-[#0F172A] dark:text-white truncate">SongCollections</span>
        </div>

        <button @click="toggleCollapse"
          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          :title="props.collapsed ? '展开侧边栏' : '折叠侧边栏'">
          <PanelLeftOpen v-if="props.collapsed" class="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <PanelLeftClose v-else class="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <!-- 核心导航 -->
      <div class="space-y-1">
        <div v-if="!props.collapsed" class="text-[11px] font-bold text-[#94A3B8] px-2 py-0.5">
          核心导航
        </div>

        <!-- 歌曲检索与分析 -->
        <button @click="navigateTo('/desktop')"
          class="w-full flex items-center gap-2.5 rounded-lg text-[13px] transition-colors cursor-pointer" :class="[
            props.collapsed ? 'justify-center p-2' : 'px-2.5 py-2',
            isSearchActive
              ? 'font-bold bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 shadow-xs'
              : 'font-normal text-[#334155] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          ]" title="歌曲检索与分析">
          <Search class="w-4 h-4 shrink-0"
            :class="isSearchActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#64748B] dark:text-slate-400'" />
          <span v-if="!props.collapsed" class="truncate">歌曲检索与分析</span>
        </button>

        <!-- 个人合集管理 -->
        <button @click="navigateTo('/desktop/collection')"
          class="w-full flex items-center gap-2.5 rounded-lg text-[13px] transition-colors cursor-pointer" :class="[
            props.collapsed ? 'justify-center p-2' : 'px-2.5 py-2',
            isCollectionActive
              ? 'font-bold bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 shadow-xs'
              : 'font-normal text-[#334155] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          ]" title="个人合集管理">
          <Folder class="w-4 h-4 shrink-0"
            :class="isCollectionActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#64748B] dark:text-slate-400'" />
          <span v-if="!props.collapsed" class="truncate">个人合集管理</span>
        </button>

        <!-- 系统与数据源设置 -->
        <button @click="navigateTo('/desktop/settings')"
          class="w-full flex items-center gap-2.5 rounded-lg text-[13px] transition-colors cursor-pointer" :class="[
            props.collapsed ? 'justify-center p-2' : 'px-2.5 py-2',
            isSettingsActive
              ? 'font-bold bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 shadow-xs'
              : 'font-normal text-[#334155] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          ]" title="系统与数据源设置">
          <Settings class="w-4 h-4 shrink-0"
            :class="isSettingsActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#64748B] dark:text-slate-400'" />
          <span v-if="!props.collapsed" class="truncate">系统与数据源设置</span>
        </button>
      </div>

      <!-- 个人合集列表 (仅展开时显示) -->
      <div v-if="!props.collapsed" class="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div class="flex items-center justify-between text-[11px] font-bold text-[#94A3B8] px-2 py-0.5">
          <span>我的合集 ({{ displayCollections.length }})</span>
          <Plus @click="isManageDialogOpen = true"
            class="w-3.5 h-3.5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300" title="管理合集" />
        </div>

        <ContextMenu>
          <ContextMenuTrigger as-child @contextmenu="onCollectionsContainerContextMenu">
            <div class="space-y-0.5">
              <div v-if="displayCollections.length === 0" class="px-2.5 py-2 text-[11px] text-slate-400 italic">
                暂无合集 (右键可新建)
              </div>
              <div v-for="(coll, index) in displayCollections" :key="coll.label || index"
                data-collection-item
                @click="navigateToCollection(coll.label)"
                @contextmenu="onCollectionContextMenu(coll, index)"
                class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 text-[#475569] dark:text-slate-300 cursor-pointer">
                <div class="flex items-center gap-1.5 min-w-0 pr-1">
                  <span class="text-xs text-slate-500 shrink-0">📁</span>
                  <span class="truncate">{{ coll.label }}</span>
                </div>
                <span class="text-[10px] font-mono text-[#94A3B8] shrink-0">{{ getItemCount(coll) }}</span>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent class="w-44 select-none">
            <template v-if="targetCollection">
              <ContextMenuLabel class="text-xs text-muted-foreground truncate font-normal">
                {{ targetCollection.coll.label }}
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem @click="navigateToCollection(targetCollection.coll.label)">
                <FolderOpen class="w-4 h-4 mr-2 text-slate-500" />
                <span>打开合集</span>
              </ContextMenuItem>
              <ContextMenuItem @click="openActionDialog('add')">
                <Plus class="w-4 h-4 mr-2 text-slate-500" />
                <span>新建合集</span>
              </ContextMenuItem>
              <ContextMenuItem @click="openActionDialog('edit', targetCollection.index, targetCollection.coll.label)">
                <Pencil class="w-4 h-4 mr-2 text-slate-500" />
                <span>重命名</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                class="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                @click="openActionDialog('delete', targetCollection.index, targetCollection.coll.label)">
                <Trash2 class="w-4 h-4 mr-2" />
                <span>删除合集</span>
              </ContextMenuItem>
            </template>
            <template v-else>
              <ContextMenuItem @click="openActionDialog('add')">
                <Plus class="w-4 h-4 mr-2 text-slate-500" />
                <span>新建合集</span>
              </ContextMenuItem>
              <ContextMenuItem @click="isManageDialogOpen = true">
                <Settings class="w-4 h-4 mr-2 text-slate-500" />
                <span>管理合集</span>
              </ContextMenuItem>
            </template>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>

    <!-- 侧边栏底部数据源状态 -->
    <div
      class="bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg transition-colors"
      :class="props.collapsed ? 'p-2 flex justify-center' : 'px-2.5 py-2 text-[11px] flex items-center justify-between'"
      :title="`当前数据源: ${currentDataSourceName}`">
      <div class="flex items-center gap-1.5 min-w-0 pr-1">
        <div class="w-2 h-2 rounded-full shrink-0"
          :class="ScoreStore.selectedSource === 'empty' ? 'bg-amber-400' : 'bg-[#22C55E]'"></div>
        <span v-if="!props.collapsed" class="text-[#64748B] dark:text-slate-400 shrink-0">数据源:</span>
        <span v-if="!props.collapsed" class="font-bold text-[#0F172A] dark:text-white truncate">{{ currentDataSourceName
          }}</span>
      </div>
    </div>

    <!-- 合集管理弹窗 -->
    <CollectionManageDialog v-model:open="isManageDialogOpen" />

    <!-- 合集操作弹窗 (新建 / 重命名 / 删除) -->
    <Dialog v-model:open="actionDialog.open">
      <DialogContent class="sm:max-w-[420px] bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
            {{ actionDialogInfo.title }}
          </DialogTitle>
          <DialogDescription v-if="actionDialogInfo.description" class="text-xs text-[#64748B] dark:text-slate-400">
            {{ actionDialogInfo.description }}
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleActionSubmit" class="space-y-4">
          <div v-if="actionDialog.type !== 'delete'" class="space-y-2">
            <Label for="sidebar-collection-name" class="text-xs font-bold text-[#475569] dark:text-slate-300">
              合集名称
            </Label>
            <Input
              id="sidebar-collection-name"
              v-model="actionDialog.inputValue"
              :placeholder="actionDialog.type === 'add' ? '请输入新合集名称' : '请输入合集名称'"
              maxlength="30"
              autofocus
              class="text-xs sm:text-sm"
            />
          </div>

          <DialogFooter class="gap-2 sm:gap-0 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="actionDialog.open = false"
              class="text-xs">
              取消
            </Button>
            <Button
              type="submit"
              size="sm"
              :variant="actionDialog.type === 'delete' ? 'destructive' : 'default'"
              :class="actionDialog.type !== 'delete' ? 'bg-[#2563EB] hover:bg-blue-700 text-white' : ''"
              class="text-xs">
              {{ actionDialogInfo.confirmText }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </aside>
</template>
