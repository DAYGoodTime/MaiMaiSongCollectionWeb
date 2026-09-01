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

const isDefault = computed(() => ScoreStore.selectedSource === 'usagi')
const hasData = computed(() => ScoreStore.hasUsagiData)

const updateTimeStr = computed(() => {
  if (!ScoreStore.hasUsagiData) return '暂无本地缓存数据'
  return formatDate(ScoreStore.UsagiScores?.update_time) || '暂无更新记录'
})

const scoreCount = computed(() => {
  const records = ScoreStore.UsagiScores?.list
  if (!records) return '暂无本地缓存战绩'
  const count = Object.keys(records).length
  return count > 0 ? `${count.toLocaleString()} 条成绩` : '从未获取'
})

const stats = computed(() => [
  { label: '支持展示游玩次数 (PlayCount)', value: '√' },
  { label: '已同步有效成绩', value: scoreCount.value },
  { label: '最后同步时间', value: updateTimeStr.value }
])
</script>

<template>
  <DataSourceCard title="🐰 UsagiCard 兔卡成绩源" :is-default="isDefault" :show-default-option="true" :stats="stats"
    :is-syncing="props.isUpdating" :has-data="hasData" @sync="emit('sync')" @export="emit('export')"
    @delete="emit('delete')" @set-default="emit('setDefault')" />
</template>
