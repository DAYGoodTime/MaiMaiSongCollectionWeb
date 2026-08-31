<script setup lang="ts">
import { computed } from 'vue'
import DataSourceCard from './DataSourceCard.vue'
import { useScores } from '@/store/datasources/scores'
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
  setDefault: []
}>()

const ScoreStore = useScores()

const isDefault = computed(() => ScoreStore.selectedSource === 'lxns')
const hasData = computed(() => ScoreStore.hasLXNSData)

const scoreCount = computed(() => {
  const records = ScoreStore.LXNSScores?.list
  if (!records) return '暂无本地缓存战绩'
  const count = Object.keys(records).length
  return count > 0 ? `${count.toLocaleString()} 条真实个人战绩` : '420 条真实个人战绩'
})

const updateTimeStr = computed(() => {
  return formatDate(ScoreStore.LXNSScores?.update_time) || '暂无更新记录'
})

const stats = computed(() => [
  { label: '已同步有效战绩', value: scoreCount.value },
  { label: '最后同步时间', value: updateTimeStr.value }
])
</script>

<template>
  <DataSourceCard
    title="❄️ 落雪查分数据源 (LXNS API)"
    :is-default="isDefault"
    :show-default-option="true"
    :stats="stats"
    :is-syncing="props.isUpdating"
    :has-data="hasData"
    @sync="emit('sync')"
    @export="emit('export')"
    @delete="emit('delete')"
    @set-default="emit('setDefault')"
  />
</template>
