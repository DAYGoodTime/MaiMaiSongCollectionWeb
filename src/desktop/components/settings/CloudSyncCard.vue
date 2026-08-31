<script setup lang="ts">
import { computed } from 'vue'
import DataSourceCard from './DataSourceCard.vue'
import { useAppStore } from '@/store/appStore'
import { useCollectionStore } from '@/store/collections'

interface Props {
  isUpdating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isUpdating: false
})

const emit = defineEmits<{
  sync: []
  export: []
  delete: []
  editUser: []
  upload: []
}>()

const appStore = useAppStore()
const collectionStore = useCollectionStore()

const userNameDisplay = computed(() => {
  return appStore.hasUserName ? appStore.UserName : '未配置标识符 (点击设置)'
})

const collectionCountDisplay = computed(() => {
  const count = collectionStore.UserCollectionList?.length || 0
  return `${count} 个本地与云端合集`
})

const stats = computed(() => [
  { label: '个人云端标识符', value: userNameDisplay.value, highlight: !appStore.hasUserName },
  { label: '同步合集统计', value: collectionCountDisplay.value }
])
</script>

<template>
  <DataSourceCard
    title="💬 合集与留言云端数据 (Cloud Sync)"
    :is-default="false"
    :show-default-option="false"
    badge-type="none"
    :stats="stats"
    :is-syncing="props.isUpdating"
    :has-data="true"
    sync-button-text="从云端同步"
    @sync="emit('sync')"
    @export="emit('export')"
    @delete="emit('delete')"
  >
    <button
      type="button"
      class="w-full h-8 mt-1 rounded-md text-[11px] font-bold border bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      :disabled="props.isUpdating"
      @click="emit('upload')"
    >
      上传到云端
    </button>
  </DataSourceCard>
</template>
