<script setup lang="ts">
import { reactive, watch } from 'vue'
import DesktopAppShell from '@/desktop/components/DesktopAppShell.vue'
import {
  VersionFooter,
  SongDataSourceCard,
  LxnsDataSourceCard,
  DivingFishDataSourceCard,
  UsagiDataSourceCard,
  FishChartStatsCard,
  CloudSyncCard,
  DataSourceAuthDialog,
  CloudUserDialog,
  ActionConfirmDialog
} from '@/desktop/components/settings'
import type { AuthErrorInfo } from '@/desktop/components/settings/DataSourceAuthDialog.vue'
import type { AvailableDataSourceType } from '@/types/datasource'
import { MAX_ERROR_COUNT, useScores } from '@/store/datasources/scores'
import { useSongStore } from '@/store/datasources/song'
import { useChartData } from '@/store/chartStats'
import { useAppStore } from '@/store/appStore'
import { useCollectionStore } from '@/store/collections'
import { useOAuthStore } from '@/store/oauth'
import { toast } from 'vue-sonner'
import LXNSService, { type LXNSAuthType } from '@/api/lxns'
import DivingFishService from '@/api/fish'
import UsagiService from '@/api/usagi'
import { HttpError } from '@/api/base'
import { exportFile, useNFC } from '@/utils/functionUtil'
import { formatDateForFile } from '@/utils/StrUtil'

const ScoreStore = useScores()
const SongStore = useSongStore()
const ChartDataStore = useChartData()
const appStore = useAppStore()
const collectionStore = useCollectionStore()
const OAuthStore = useOAuthStore()

const updatingState = reactive({
  song: false,
  lxns: false,
  divingfish: false,
  usagi: false,
  chartStats: false,
  cloud: false
})
const errorCount = reactive({ lxns: 0, divingfish: 0, usagi: 0 })

const toAuthError = (error: unknown, fallback: string): AuthErrorInfo => {
  if (error instanceof HttpError) {
    return {
      title: `同步校验失败 · ${error.status}`,
      code: `HTTP_${error.status}`,
      message: error.message || fallback,
      rawLog: JSON.stringify(error.toJSON())
    }
  }
  return {
    title: '同步失败',
    code: 'ERR_UNKNOWN',
    message: error instanceof Error ? error.message : fallback
  }
}

const bumpErrorCount = (source: AvailableDataSourceType) => {
  errorCount[source]++
  if (errorCount[source] >= MAX_ERROR_COUNT && OAuthStore.hasCredentials(source)) {
    toast.warning('错误次数过多,已为你删除缓存凭证')
    OAuthStore.removeCredentials(source)
    authDialogState.initialCredential = ''
  }
}

// ==========================================
// 数据源认证 Dialog
// ==========================================
const authDialogState = reactive<{
  open: boolean
  sourceKey: AvailableDataSourceType | 'song' | 'chartStats' | 'cloud'
  mode: 'token' | 'oauth'
  title: string
  subtitle: string
  credentialLabel: string
  credentialPlaceholder: string
  initialCredential: string
  errorInfo: AuthErrorInfo | null
}>({
  open: false,
  sourceKey: 'lxns',
  mode: 'token',
  title: '🔑 数据源更新',
  subtitle: '请输入对应平台的授权凭证或 API 密钥以同步最新个人成绩与数据',
  credentialLabel: '个人 API 密钥 (Token / Secret Key)',
  credentialPlaceholder: '',
  initialCredential: '',
  errorInfo: null
})

const openAuthDialog = (source: AvailableDataSourceType) => {
  authDialogState.sourceKey = source
  authDialogState.mode = 'token'
  authDialogState.errorInfo = null

  switch (source) {
    case 'lxns':
      authDialogState.title = '🔑 落雪查分数据源认证'
      authDialogState.subtitle = '请输入您的落雪账号个人 API 密钥，可前往落雪控制台生成。'
      authDialogState.credentialLabel = '落雪 API 密钥 (Token / Secret Key)'
      authDialogState.credentialPlaceholder = 'lxns_sec_9f82a17c4b0e5d893f21a8...'
      authDialogState.initialCredential = OAuthStore.DataSourceCredentials.lxns || ''
      break
    case 'divingfish':
      authDialogState.title = '🔑 水鱼查分数据源认证'
      authDialogState.subtitle = '请输入您的水鱼账号成绩导入 Token 以同步最新成绩。'
      authDialogState.credentialLabel = '成绩导入 Token'
      authDialogState.credentialPlaceholder = '请输入水鱼导入 Token...'
      authDialogState.initialCredential = OAuthStore.DataSourceCredentials.divingfish || ''
      break
    case 'usagi':
      authDialogState.title = '🔑 UsagiCard 兔卡认证'
      authDialogState.subtitle = '请输入您的 UsagiCard 卡片 UUID，或使用设备 NFC 贴卡自动读取。'
      authDialogState.credentialLabel = '卡片 UUID'
      authDialogState.credentialPlaceholder = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      authDialogState.initialCredential = OAuthStore.DataSourceCredentials.usagi || ''
      break
  }

  authDialogState.open = true
}

const handleAuthSubmit = async (credentials: string, remember: boolean) => {
  if (!credentials) {
    toast.error('凭证不能为空')
    return
  }
  if (authDialogState.mode === 'oauth') {
    await submitOAuthCode(credentials)
    return
  }
  const source = authDialogState.sourceKey as AvailableDataSourceType
  if (source === 'lxns') await updateLXNS(credentials, 'Token', remember)
  else if (source === 'divingfish') await updateDivingFish(credentials, remember)
  else if (source === 'usagi') await updateUsagi(credentials, remember)
}

const handleClearAuthCredential = () => {
  const source = authDialogState.sourceKey as AvailableDataSourceType
  if (source === 'lxns' || source === 'divingfish' || source === 'usagi') {
    OAuthStore.removeCredentials(source)
  }
  authDialogState.initialCredential = ''
  toast.info('已清除该数据源的历史缓存凭证')
}

const handleStartOAuth = () => {
  const oauthUri = import.meta.env.VITE_LXNS_OAUTH_URI
  if (oauthUri) window.open(oauthUri, '_blank')
  authDialogState.mode = 'oauth'
  authDialogState.errorInfo = null
  authDialogState.title = '使用落雪 OAuth'
  authDialogState.subtitle = '已打开授权页面。授权成功后，请将获得的授权码填入此处。'
  authDialogState.credentialLabel = '授权码'
  authDialogState.credentialPlaceholder = '落雪OAuth授权码'
  authDialogState.initialCredential = ''
  authDialogState.open = true
  toast.info('已打开 OAuth 授权页面，授权完成后请填入授权码')
}

const submitOAuthCode = async (code: string) => {
  updatingState.lxns = true
  try {
    const ok = await OAuthStore.getLXNSToken(code, 'query')
    if (!ok) return
    toast.info('使用OAuth更新中~')
    await updateLXNS(`Bearer ${OAuthStore.LXNSOAuth.access_token}`, 'OAuth')
  } finally {
    updatingState.lxns = false
  }
}

const UUIDRegex = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i
const handleNFCScanning = async (message: string) => {
  if (typeof message !== 'string') {
    toast.error('无效的UsagiCard', { position: 'top-center' })
    return
  }
  const matched = message.match(UUIDRegex)
  if (matched?.[1]) {
    toast.success(`读取成功:${matched[1]}`, { position: 'top-center' })
    authDialogState.initialCredential = matched[1]
    await updateUsagi(matched[1], false)
  } else {
    toast.error('无效的UsagiCard', { position: 'top-center' })
  }
}
const { isSupported: webNfcSupported, startScan } = useNFC(handleNFCScanning)
watch(() => appStore.NFCData, (val) => { if (val) handleNFCScanning(val) })

const handleStartNfc = () => {
  if (webNfcSupported) {
    startScan()
    return
  }
  toast.info('请将 UsagiCard 贴近设备 NFC 识别区域...')
}

// ==========================================
// 云端用户 Dialog
// ==========================================
const cloudDialogState = reactive({
  open: false,
  mode: 'set' as 'set' | 'confirm',
  isSubmitting: false
})

const openCloudUserDialog = (mode: 'set' | 'confirm') => {
  cloudDialogState.mode = mode
  cloudDialogState.open = true
}

const handleCloudUserSubmit = async (name: string) => {
  cloudDialogState.isSubmitting = true
  appStore.UserName = name
  try {
    if (cloudDialogState.mode === 'confirm') {
      updatingState.cloud = true
      const ok = await collectionStore.downloadCollectionData(name)
      if (ok) {
        toast.success('同步成功')
        cloudDialogState.open = false
      } else {
        toast.error('同步失败，请确认该用户名是否有数据')
      }
    } else {
      toast.success(`云端标识符已更新为: ${name}`)
      cloudDialogState.open = false
    }
  } finally {
    cloudDialogState.isSubmitting = false
    updatingState.cloud = false
  }
}

// ==========================================
// 操作确认 Dialog
// ==========================================
const confirmDialogState = reactive({
  open: false,
  title: '',
  description: '',
  confirmText: '确认',
  isDestructive: false,
  isProcessing: false,
  action: (() => { }) as () => void | Promise<void>
})

const openConfirmDialog = (options: {
  title: string
  description: string
  confirmText?: string
  isDestructive?: boolean
  onConfirm: () => void | Promise<void>
}) => {
  confirmDialogState.title = options.title
  confirmDialogState.description = options.description
  confirmDialogState.confirmText = options.confirmText || '确认'
  confirmDialogState.isDestructive = !!options.isDestructive
  confirmDialogState.action = options.onConfirm
  confirmDialogState.open = true
}

const handleExecuteConfirm = async () => {
  confirmDialogState.isProcessing = true
  try {
    await confirmDialogState.action()
  } finally {
    confirmDialogState.isProcessing = false
    confirmDialogState.open = false
  }
}

// ==========================================
// 1. 歌曲元数据
// ==========================================
const handleSyncSong = async () => {
  if (updatingState.song) return
  updatingState.song = true
  try {
    if (await SongStore.updateSongFromAPI()) {
      toast.success('歌曲数据源更新完成')
    }
  } catch (error: any) {
    toast.error(`歌曲数据源更新失败: ${error.message ? error.message : 'Unknown Error'}`)
  } finally {
    updatingState.song = false
  }
}

const handleExportSong = () => {
  const list = SongStore.SONG_LIST?.list
  if (!list || Object.keys(list).length === 0) {
    toast.error('歌曲元数据为空，无法导出')
    return
  }
  exportFile(JSON.stringify(list), `${formatDateForFile(new Date())}-songs.json`)
}

const handleDeleteSong = () => {
  openConfirmDialog({
    title: '确定要清空本地歌曲元数据缓存吗？',
    description: '清空后将需要重新从云端同步元数据，否则搜索和定数分析将无法正常使用。',
    confirmText: '确认清空',
    isDestructive: true,
    onConfirm: () => {
      SongStore.SONG_LIST.list = {}
      SongStore.SONG_LIST.update_time = '从未获取'
      SongStore.SONG_LIST.version = 0
      toast.success('已清空本地歌曲元数据')
    }
  })
}

// ==========================================
// 2. 落雪查分
// ==========================================
const updateLXNS = async (token: string, type: LXNSAuthType = 'Token', remember = false) => {
  if (!token) {
    toast.error(`请填写您的落雪${type === 'Token' ? '账号个人 API 密钥' : 'OAuth授权码'}`)
    return
  }
  updatingState.lxns = true
  authDialogState.errorInfo = null
  try {
    const result = await LXNSService.queryDataFromLXNS(token, type)
    if (result?.success) {
      ScoreStore.updateScores(result.data, 'lxns')
      toast.success('落雪数据源更新成功！')
      if (type === 'Token' && remember) OAuthStore.DataSourceCredentials.lxns = token
      authDialogState.open = false
      authDialogState.mode = 'token'
    } else {
      toast.error(`落雪数据源更新失败 code:${result?.code ?? ''}`)
    }
  } catch (error: any) {
    authDialogState.errorInfo = toAuthError(error, '落雪数据源更新失败')
    if (error instanceof HttpError && error.status === 401) {
      if (type === 'Token') toast.error('落雪数据源更新失败: token无效', { position: 'top-center' })
      else {
        toast.error('落雪数据源更新失败: token失效', { position: 'top-center' })
        OAuthStore.cleanLXNSOAuth()
      }
    } else {
      toast.error(error instanceof HttpError ? `落雪数据源更新失败 : ${error.message}` : '落雪数据源更新失败', { position: 'top-center' })
    }
    if (type === 'Token') bumpErrorCount('lxns')
  } finally {
    updatingState.lxns = false
  }
}

const handleSyncLxns = async () => {
  if (OAuthStore.hasLXNSOAuth) {
    updatingState.lxns = true
    if (OAuthStore.isAccessTokenExpired()) {
      if (OAuthStore.isRefreshTokenExpired()) {
        OAuthStore.cleanLXNSOAuth()
        toast.error('OAuth已过期，请用token更新或者重新申请', { position: 'top-center' })
        openAuthDialog('lxns')
        updatingState.lxns = false
        return
      }
      const ok = await OAuthStore.getLXNSToken('', 'refresh')
      if (!ok) {
        openAuthDialog('lxns')
        updatingState.lxns = false
        return
      }
    }
    toast.info('使用OAuth更新中~')
    await updateLXNS(`Bearer ${OAuthStore.LXNSOAuth.access_token}`, 'OAuth')
  } else if (OAuthStore.hasCredentials('lxns')) {
    await updateLXNS(OAuthStore.DataSourceCredentials.lxns, 'Token')
  } else {
    openAuthDialog('lxns')
  }
}

const handleExportLxns = () => ScoreStore.exportScores('lxns')

const handleDeleteLxns = () => {
  openConfirmDialog({
    title: '确定要删除落雪查分数据源吗？',
    description: '此操作将清空本地已缓存的落雪个人战绩。',
    confirmText: '删除数据',
    isDestructive: true,
    onConfirm: () => ScoreStore.ClearDataSource('lxns')
  })
}

const handleSetDefaultLxns = () => ScoreStore.switchDataSource('lxns')

// ==========================================
// 3. 水鱼查分
// ==========================================
const updateDivingFish = async (token: string, remember: boolean) => {
  updatingState.divingfish = true
  authDialogState.errorInfo = null
  try {
    const result = await DivingFishService.queryFishUserScores(token)
    if (result) {
      ScoreStore.updateScores(result.records, 'divingfish')
      toast.success('水鱼数据源更新成功！', { position: 'top-center' })
      if (remember) OAuthStore.DataSourceCredentials.divingfish = token
      authDialogState.open = false
    } else {
      toast.error('水鱼数据源更新失败,返回的数据源为空', { position: 'top-center' })
    }
  } catch (error) {
    authDialogState.errorInfo = toAuthError(error, '水鱼数据源更新失败')
    if (error instanceof HttpError && error.status === 400) {
      toast.error('水鱼数据源更新失败 token无效', { position: 'top-center' })
    } else {
      toast.error('水鱼数据源更新失败', { position: 'top-center' })
      bumpErrorCount('divingfish')
    }
  } finally {
    updatingState.divingfish = false
  }
}

const handleSyncDivingFish = async () => {
  if (OAuthStore.hasCredentials('divingfish')) {
    await updateDivingFish(OAuthStore.DataSourceCredentials.divingfish, false)
  } else {
    openAuthDialog('divingfish')
  }
}

const handleExportDivingFish = () => ScoreStore.exportScores('divingfish')

const handleDeleteDivingFish = () => {
  openConfirmDialog({
    title: '确定要删除水鱼数据源吗？',
    description: '此操作将清空本地已缓存的水鱼个人战绩。',
    confirmText: '删除数据',
    isDestructive: true,
    onConfirm: () => ScoreStore.ClearDataSource('divingfish')
  })
}

const handleSetDefaultDivingFish = () => ScoreStore.switchDataSource('divingfish')

// ==========================================
// 4. UsagiCard
// ==========================================
const updateUsagi = async (uuid: string, remember: boolean) => {
  if (!uuid) {
    toast.error('请填写UsagiCard的uuid', { position: 'top-center' })
    return
  }
  updatingState.usagi = true
  authDialogState.errorInfo = null
  try {
    const result = await UsagiService.queryUsagiUserScore(uuid)
    if (result) {
      ScoreStore.updateScores(result, 'usagi')
      toast.success('Usagi数据源更新成功！')
      if (remember) OAuthStore.DataSourceCredentials.usagi = uuid
      authDialogState.open = false
    } else {
      toast.error('Usagi数据源更新失败,返回的数据源为空', { position: 'top-center' })
    }
  } catch (error) {
    authDialogState.errorInfo = toAuthError(error, 'Usagi数据源更新失败')
    toast.error('Usagi数据源更新失败', { position: 'top-center' })
    bumpErrorCount('usagi')
  } finally {
    updatingState.usagi = false
  }
}

const handleSyncUsagi = async () => {
  if (OAuthStore.hasCredentials('usagi')) {
    await updateUsagi(OAuthStore.DataSourceCredentials.usagi, false)
  } else {
    openAuthDialog('usagi')
  }
}

const handleExportUsagi = () => ScoreStore.exportScores('usagi')

const handleDeleteUsagi = () => {
  openConfirmDialog({
    title: '确定要删除 UsagiCard 兔卡数据源吗？',
    description: '此操作将清空本地已缓存的兔卡全量战绩与游玩次数数据。',
    confirmText: '删除数据',
    isDestructive: true,
    onConfirm: () => ScoreStore.ClearDataSource('usagi')
  })
}

const handleSetDefaultUsagi = () => ScoreStore.switchDataSource('usagi')

// ==========================================
// 5. 水鱼拟合定数
// ==========================================
const handleSyncChartStats = async () => {
  if (updatingState.chartStats) return
  updatingState.chartStats = true
  try {
    await ChartDataStore.updateData()
    if (ChartDataStore.hasChartData) toast.success('全网谱面拟合定数库已同步更新！')
  } finally {
    updatingState.chartStats = false
  }
}

const handleExportChartStats = () => {
  if (!ChartDataStore.hasChartData) {
    toast.error('拟合定数库为空，无法导出')
    return
  }
  exportFile(JSON.stringify(ChartDataStore.ChartStats.list), `${formatDateForFile(new Date())}-chart-stats.json`)
}

const handleDeleteChartStats = () => {
  openConfirmDialog({
    title: '确定要重置拟合定数库吗？',
    description: '重置后需重新同步才能在推分与搜索中使用拟合定数。',
    confirmText: '确认重置',
    isDestructive: true,
    onConfirm: () => {
      ChartDataStore.ChartStats.list = {}
      ChartDataStore.ChartStats.update_time = '从未获取'
      ChartDataStore.DiffData.list = {}
      ChartDataStore.DiffData.update_time = '从未获取'
      toast.success('拟合定数库已重置')
    }
  })
}

// ==========================================
// 6. 云端合集与留言
// ==========================================
const handleSyncCloud = () => {
  if (!appStore.hasUserName) {
    toast.error('请先设置名称再进行同步', { position: 'top-center' })
    openCloudUserDialog('set')
    return
  }
  openCloudUserDialog('confirm')
}

const handleUploadCloud = async () => {
  if (!appStore.hasUserName) {
    toast.error('请先设置名称再进行上传', { position: 'top-center' })
    openCloudUserDialog('set')
    return
  }
  updatingState.cloud = true
  try {
    if (await collectionStore.uploadCollectionData(appStore.UserName)) {
      toast.success('上传成功')
    }
  } finally {
    updatingState.cloud = false
  }
}

const handleExportCloud = () => {
  collectionStore.exportCollectionData()
}

const handleDeleteCloud = () => {
  openConfirmDialog({
    title: '确定要解绑当前云端用户标识符吗？',
    description: '解绑后本地合集不会被删除，但需重新设置标识符后才能同步云端数据。',
    confirmText: '确认解绑',
    isDestructive: true,
    onConfirm: () => {
      appStore.UserName = ''
      toast.success('已解绑云端用户标识符')
    }
  })
}
</script>

<template>
  <DesktopAppShell>
    <main class="flex-1 flex flex-col h-full min-w-0 overflow-y-auto custom-scrollbar">
      <div class="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col justify-between space-y-6">
        <header
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h1
              class="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>系统与数据源设置</span>
            </h1>
            <p class="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
              管理多平台查分器授权凭证、谱面定数库及云端合集数据同步
            </p>
          </div>

          <div @click="openCloudUserDialog(appStore.hasUserName ? 'confirm' : 'set')"
            class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] shadow-2xs hover:border-[#2563EB] dark:hover:border-blue-500 transition-colors cursor-pointer self-start sm:self-auto"
            :title="appStore.hasUserName ? '点击修改或切换云端用户名' : '点击设置个人云端标识符'">
            <div
              class="w-7 h-7 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
              👤
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-[#0F172A] dark:text-white truncate max-w-[120px]">
                {{ appStore.hasUserName ? appStore.UserName : '未绑定标识符' }}
              </div>
              <div class="text-[10px] text-[#64748B] dark:text-slate-400 leading-none">
                {{ appStore.hasUserName ? '已登录' : '点击立即配置' }}
              </div>
            </div>
          </div>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 flex-1 items-start">
          <SongDataSourceCard :is-updating="updatingState.song" @sync="handleSyncSong" @export="handleExportSong"
            @delete="handleDeleteSong" />

          <LxnsDataSourceCard :is-updating="updatingState.lxns" @sync="handleSyncLxns" @export="handleExportLxns"
            @delete="handleDeleteLxns" @set-default="handleSetDefaultLxns" />

          <DivingFishDataSourceCard :is-updating="updatingState.divingfish" @sync="handleSyncDivingFish"
            @export="handleExportDivingFish" @delete="handleDeleteDivingFish"
            @set-default="handleSetDefaultDivingFish" />

          <UsagiDataSourceCard :is-updating="updatingState.usagi" @sync="handleSyncUsagi" @export="handleExportUsagi"
            @delete="handleDeleteUsagi" @set-default="handleSetDefaultUsagi" />

          <FishChartStatsCard :is-updating="updatingState.chartStats" @sync="handleSyncChartStats"
            @export="handleExportChartStats" @delete="handleDeleteChartStats" />

          <CloudSyncCard :is-updating="updatingState.cloud" @sync="handleSyncCloud" @export="handleExportCloud"
            @delete="handleDeleteCloud" @edit-user="openCloudUserDialog('set')" @upload="handleUploadCloud" />
        </section>

        <VersionFooter />
      </div>
    </main>

    <DataSourceAuthDialog v-model:open="authDialogState.open" :source-key="authDialogState.sourceKey"
      :title="authDialogState.title" :subtitle="authDialogState.subtitle"
      :credential-label="authDialogState.credentialLabel"
      :credential-placeholder="authDialogState.credentialPlaceholder"
      :initial-credential="authDialogState.initialCredential"
      :is-updating="updatingState[authDialogState.sourceKey as AvailableDataSourceType]"
      :error-info="authDialogState.errorInfo"
      :show-o-auth="authDialogState.sourceKey === 'lxns' && authDialogState.mode === 'token'" @submit="handleAuthSubmit"
      @clear-credential="handleClearAuthCredential" @start-o-auth="handleStartOAuth" @start-nfc="handleStartNfc" />

    <CloudUserDialog v-model:open="cloudDialogState.open" :mode="cloudDialogState.mode"
      :current-name="appStore.UserName" :is-submitting="cloudDialogState.isSubmitting"
      @submit="handleCloudUserSubmit" />

    <ActionConfirmDialog v-model:open="confirmDialogState.open" :title="confirmDialogState.title"
      :description="confirmDialogState.description" :confirm-text="confirmDialogState.confirmText"
      :is-destructive="confirmDialogState.isDestructive" :is-processing="confirmDialogState.isProcessing"
      @confirm="handleExecuteConfirm" />
  </DesktopAppShell>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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
