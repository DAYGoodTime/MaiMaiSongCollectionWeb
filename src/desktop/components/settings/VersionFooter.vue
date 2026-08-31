<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getProjectVersion } from '@/utils/StrUtil'
import { checkVersion } from '@/api/other'
import { toast } from 'vue-sonner'

interface Props {
  customVersion?: string
}

const props = defineProps<Props>()
const isChecking = ref(false)
const currentVersion = getProjectVersion() || '0'
const newVersion = ref('')
const versionStr = props.customVersion || `v${currentVersion}`

const handleCheckUpdate = async (silent = false) => {
  if (isChecking.value) return
  isChecking.value = true
  try {
    const versionTable = await checkVersion()
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    if (collator.compare(currentVersion, versionTable.new) === -1) {
      newVersion.value = versionTable.new
      toast.info(`发现有可更新的版本! ${versionTable.new}`, { position: 'top-right' })
    } else if (!silent) {
      toast.success('当前已是最新版本')
    }
    if (collator.compare(currentVersion, versionTable.min) === -1) {
      toast.warning('当前版本已不再可用，请更新到最新版本！', { position: 'top-center' })
    }
  } catch (error) {
    if (!silent) toast.info('检测更新失败')
    console.warn('检测更新失败', error)
  } finally {
    isChecking.value = false
  }
}

onMounted(() => handleCheckUpdate(true))
</script>

<template>
  <footer class="w-full py-2 px-4 flex items-center justify-center text-center">
    <button
      @click="handleCheckUpdate(false)"
      class="text-[11px] text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
      title="点击检查更新">
      <span>SongCollections 桌面端 {{ versionStr }}</span>
      <span v-if="newVersion">{{ `(最新版本:${newVersion})` }}</span>
      <span v-else>· 点击检查更新</span>
      <span v-if="isChecking" class="animate-spin text-xs">🔄</span>
    </button>
  </footer>
</template>
