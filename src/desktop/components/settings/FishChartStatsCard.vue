<script setup lang="ts">
import { computed } from 'vue'
import DataSourceCard from './DataSourceCard.vue'
import { useChartData } from '@/store/chartStats'
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

const ChartDataStore = useChartData()

const chartCount = computed(() => {
  const data = ChartDataStore.ChartStats?.list
  if (!data) return '540 条全网拟合定数与方差'
  const count = Object.keys(data).length
  return count > 0 ? `${count.toLocaleString()} 条全网拟合定数与方差` : '540 条全网拟合定数与方差'
})

const updateTimeStr = computed(() => {
  return formatDate(ChartDataStore.ChartStats?.update_time) || '暂无更新记录'
})

const stats = computed(() => [
  { label: '收录拟合谱面', value: chartCount.value },
  { label: '本地最后更新', value: updateTimeStr.value }
])
</script>

<template>
  <DataSourceCard
    title="📊 水鱼谱面拟合定数 (Chart Stats)"
    :is-default="false"
    :show-default-option="false"
    badge-type="none"
    :stats="stats"
    :is-syncing="props.isUpdating"
    :has-data="!!ChartDataStore.ChartStats?.list"
    @sync="emit('sync')"
    @export="emit('export')"
    @delete="emit('delete')"
  />
</template>
