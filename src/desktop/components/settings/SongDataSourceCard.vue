<script setup lang="ts">
import { computed } from 'vue'
import DataSourceCard from './DataSourceCard.vue'
import { useSongStore } from '@/store/datasources/song'
import { formatDate } from '@/utils/StrUtil'

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
}>()

const SongStore = useSongStore()

const songCount = computed(() => {
  const list = SongStore.SONG_LIST?.list
  if (!list) return '暂无数据'
  const count = Object.keys(list).length
  return count > 0 ? `${count.toLocaleString()} 首歌曲` : '暂无数据'
})

const updateTimeStr = computed(() => {
  return formatDate(SongStore.SONG_LIST?.update_time) || '暂无更新记录'
})

const stats = computed(() => [
  { label: '谱面数据量', value: songCount.value },
  { label: '最后更新时间', value: updateTimeStr.value }
])
</script>

<template>
  <DataSourceCard title="🎵 歌曲元数据源 (Usagi API)" :is-default="false" :show-default-option="false" badge-type="none"
    :stats="stats" :is-syncing="props.isUpdating" :has-data="!!SongStore.SONG_LIST?.list" @sync="emit('sync')"
    @export="emit('export')" @delete="emit('delete')" />
</template>
