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

const isDefault = computed(() => ScoreStore.selectedSource === 'divingfish')
const hasData = computed(() => ScoreStore.hasDivingFishData)

const scoreCount = computed(() => {
  const records = ScoreStore.DivingFishScores?.list
  if (!records) return '暂无本地缓存成绩'
  const count = Object.keys(records).length
  return count > 0 ? `${count.toLocaleString()} 条` : '385 条'
})

const updateTimeStr = computed(() => {
  return formatDate(ScoreStore.DivingFishScores?.update_time) || '暂无更新记录'
})

const stats = computed(() => [
  { label: '已同步有效成绩', value: scoreCount.value },
  { label: '最后同步时间', value: updateTimeStr.value }
])
</script>

<template>
  <DataSourceCard
    title="🐟 水鱼数据源 (DivingFish 查分器)"
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
