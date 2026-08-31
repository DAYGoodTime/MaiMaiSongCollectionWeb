<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shadcn/ui/dialog'
import { Pencil, Trash2, Plus } from '@lucide/vue'
import { useCollectionStore, type Collection } from '@/store/collections'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'

interface Props {
  open: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const collectionStore = useCollectionStore()
const { UserCollectionList } = storeToRefs(collectionStore)

const isCreating = ref(false)
const editingIndex = ref<number | null>(null)
const pendingDelete = ref<number | null>(null)
const newName = ref('')

const startCreate = () => {
  isCreating.value = true
  editingIndex.value = null
  pendingDelete.value = null
  newName.value = ''
}

const startEdit = (index: number) => {
  editingIndex.value = index
  pendingDelete.value = null
  isCreating.value = false
  newName.value = UserCollectionList.value[index].label
}

const cancelEdit = () => {
  editingIndex.value = null
  isCreating.value = false
  pendingDelete.value = null
  newName.value = ''
}

const confirmCreate = () => {
  if (!newName.value.trim()) {
    toast.error('合集名称不能为空')
    return
  }
  const result = collectionStore.newCollection(newName.value.trim())
  if (result.success) {
    cancelEdit()
  } else {
    toast.error(result.message)
  }
}

const confirmEdit = () => {
  if (editingIndex.value === null) return
  if (!newName.value.trim()) {
    toast.error('合集名称不能为空')
    return
  }
  const result = collectionStore.EditCollectionName(editingIndex.value, newName.value.trim())
  if (result.success) {
    cancelEdit()
  } else {
    toast.error(result.message)
  }
}

const handleDelete = (index: number) => {
  pendingDelete.value = index
  editingIndex.value = null
  isCreating.value = false
}

const confirmDelete = () => {
  if (pendingDelete.value === null) return
  collectionStore.DeleteCollection(pendingDelete.value)
  pendingDelete.value = null
}

const getItemCount = (coll: Collection) => coll.list.size

watch(() => props.open, (open) => {
  if (!open) cancelEdit()
})
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px] max-h-[80vh] overflow-y-auto select-none bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-xl shadow-xl">
      <DialogHeader class="pb-2 border-b border-slate-100 dark:border-slate-800">
        <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
          管理我的合集
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-2 py-2">
        <!-- 现有合集列表 -->
        <div v-for="(coll, index) in UserCollectionList" :key="coll.label" 
          class="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <template v-if="editingIndex === index">
            <input
              v-model="newName"
              type="text"
              class="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md outline-none focus:border-blue-500"
              placeholder="输入新名称"
              @keyup.enter="confirmEdit"
              @keyup.esc="cancelEdit"
            />
            <button @click="confirmEdit" class="px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
              确定
            </button>
            <button @click="cancelEdit" class="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300">
              取消
            </button>
          </template>
          <template v-else-if="pendingDelete === index">
            <span class="flex-1 text-sm text-red-600 dark:text-red-400 truncate">
              删除「{{ coll.label }}」？不可恢复
            </span>
            <button @click="confirmDelete" class="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700">
              删除
            </button>
            <button @click="pendingDelete = null" class="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300">
              取消
            </button>
          </template>
          <template v-else>
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {{ coll.label }}
              </span>
              <span class="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                ({{ getItemCount(coll) }})
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="startEdit(index)"
                class="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="重命名">
                <Pencil class="w-4 h-4" />
              </button>
              <button
                @click="handleDelete(index)"
                class="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="删除">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </template>
        </div>

        <!-- 新建合集 -->
        <div v-if="isCreating" class="flex items-center gap-2 p-2.5 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <input
            v-model="newName"
            type="text"
            class="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md outline-none focus:border-blue-500"
            placeholder="输入合集名称"
            @keyup.enter="confirmCreate"
            @keyup.esc="cancelEdit"
          />
          <button @click="confirmCreate" class="px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
            创建
          </button>
          <button @click="cancelEdit" class="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300">
            取消
          </button>
        </div>

        <button
          v-if="!isCreating && editingIndex === null"
          @click="startCreate"
          class="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
          <Plus class="w-4 h-4" />
          <span class="text-sm font-medium">新建合集</span>
        </button>
      </div>

      <DialogFooter class="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          @click="emit('update:open', false)"
          class="px-4 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          关闭
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
