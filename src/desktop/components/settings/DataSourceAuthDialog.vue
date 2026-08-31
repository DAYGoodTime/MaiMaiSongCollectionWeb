<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Smartphone
} from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/shadcn/ui/dialog'
import { Checkbox } from '@/components/shadcn/ui/checkbox'
import { Label } from '@/components/shadcn/ui/label'
import type { AvailableDataSourceType } from '@/types/datasource'

export interface AuthErrorInfo {
  title: string
  code: string
  message: string
  rawLog?: string
}

interface Props {
  open: boolean
  sourceKey: AvailableDataSourceType | 'song' | 'chartStats' | 'cloud'
  title?: string
  subtitle?: string
  credentialLabel?: string
  credentialPlaceholder?: string
  helpUrl?: string
  helpText?: string
  oauthUrl?: string
  showOAuth?: boolean
  showNfc?: boolean
  initialCredential?: string
  isUpdating?: boolean
  errorInfo?: AuthErrorInfo | null
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  sourceKey: 'lxns',
  title: '🔑 数据源更新',
  subtitle: '请输入对应平台的授权凭证或 API 密钥以同步最新个人成绩与数据',
  credentialLabel: '个人 API 密钥 (Token / Secret Key)',
  credentialPlaceholder: '请输入 API 密钥或凭证...',
  helpUrl: '',
  helpText: '如何获取密钥？ ↗',
  oauthUrl: '',
  showOAuth: true,
  showNfc: false,
  initialCredential: '',
  isUpdating: false,
  errorInfo: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [credentials: string, remember: boolean]
  clearCredential: []
  startOAuth: []
  startNfc: []
}>()

const credentials = ref(props.initialCredential)
const remember = ref(true)
const showPassword = ref(false)

// 同步初始凭证
watch(() => props.initialCredential, (newVal) => {
  credentials.value = newVal || ''
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    credentials.value = props.initialCredential || ''
  }
})

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  switch (props.sourceKey) {
    case 'lxns': return '🔑 落雪查分数据源认证'
    case 'divingfish': return '🔑 水鱼查分数据源认证'
    case 'usagi': return '🔑 UsagiCard 兔卡认证'
    default: return '🔑 数据源更新'
  }
})

const resolvedCredentialLabel = computed(() => {
  if (props.credentialLabel) return props.credentialLabel
  switch (props.sourceKey) {
    case 'lxns': return '个人 API 密钥 (Token / Secret Key)'
    case 'divingfish': return '成绩导入 Token'
    case 'usagi': return '卡片 UUID'
    default: return '认证凭证'
  }
})

const resolvedPlaceholder = computed(() => {
  if (props.credentialPlaceholder) return props.credentialPlaceholder
  switch (props.sourceKey) {
    case 'lxns': return 'lxns_sec_9f82a17c4b0e5d893f21a8...'
    case 'divingfish': return '请输入水鱼导入 Token...'
    case 'usagi': return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    default: return '请输入凭证...'
  }
})

const resolvedHelpUrl = computed(() => {
  if (props.helpUrl) return props.helpUrl
  switch (props.sourceKey) {
    case 'lxns': return 'https://maimai.lxns.net/user/profile'
    case 'divingfish': return 'https://www.diving-fish.com/maimaidx/prober/#Profile'
    case 'usagi': return 'https://uc.turou.fun/'
    default: return ''
  }
})

const handleClose = () => {
  emit('update:open', false)
}

const handleSubmit = () => {
  emit('submit', credentials.value.trim(), remember.value)
}

const handleClear = () => {
  credentials.value = ''
  emit('clearCredential')
}

const handleOpenHelp = () => {
  if (resolvedHelpUrl.value) {
    window.open(resolvedHelpUrl.value, '_blank')
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent
      class="max-w-[540px] sm:max-w-[620px] w-[95vw] p-0 bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-xl shadow-xl overflow-hidden">
      
      <!-- 对话框头部 Dialog Header -->
      <div class="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3">
        <div class="space-y-1 min-w-0">
          <DialogTitle class="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <span>{{ resolvedTitle }}</span>
          </DialogTitle>
          <DialogDescription class="text-xs text-[#64748B] dark:text-slate-400 leading-normal">
            {{ props.subtitle }}
          </DialogDescription>
        </div>
      </div>

      <!-- 表单主体 Form Body -->
      <form @submit.prevent="handleSubmit" class="p-5 sm:p-6 space-y-4">
        
        <!-- 凭证输入区域 Credential Field Group -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label for="auth-credential-input" class="text-xs font-bold text-[#334155] dark:text-slate-300">
              {{ resolvedCredentialLabel }}
            </Label>
            <button
              v-if="resolvedHelpUrl"
              type="button"
              @click="handleOpenHelp"
              class="text-[11px] font-normal text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
              <span>{{ props.helpText }}</span>
            </button>
          </div>

          <!-- 输入框与明文切换眼睛 -->
          <div
            class="relative flex items-center bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-md px-3 py-2 transition-colors focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]">
            <input
              id="auth-credential-input"
              v-model="credentials"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="resolvedPlaceholder"
              :disabled="props.isUpdating"
              class="w-full bg-transparent border-none outline-none text-xs font-mono text-[#0F172A] dark:text-white placeholder:text-slate-400"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              :title="showPassword ? '隐藏明文' : '显示明文'">
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- OAuth 快捷登录提示卡片 -->
        <div
          v-if="props.showOAuth && (props.sourceKey === 'lxns' || props.oauthUrl)"
          class="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-2">
          <span class="text-[11px] text-[#64748B] dark:text-slate-400 leading-tight">
            不想手动输入密钥？也可通过官方平台授权快捷登录
          </span>
          <button
            type="button"
            @click="emit('startOAuth')"
            class="px-2.5 py-1 rounded-md text-[11px] font-bold text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer">
            <span>使用 OAuth 登录 ↗</span>
          </button>
        </div>

        <!-- NFC 扫卡辅助选项 (针对 UsagiCard) -->
        <div
          v-if="props.showNfc || props.sourceKey === 'usagi'"
          class="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-2">
          <div class="flex items-center gap-2">
            <Smartphone class="w-4 h-4 text-[#2563EB] shrink-0" />
            <span class="text-[11px] text-[#64748B] dark:text-slate-400 leading-tight">
              支持通过设备 NFC 贴卡自动读取卡片 UUID
            </span>
          </div>
          <button
            type="button"
            @click="emit('startNfc')"
            class="px-2.5 py-1 rounded-md text-[11px] font-bold text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer">
            <span>通过 NFC 扫卡</span>
          </button>
        </div>

        <!-- 记住凭证 Checkbox -->
        <div class="flex items-center gap-2 pt-0.5">
          <Checkbox id="auth-remember-check" v-model:checked="remember" />
          <Label for="auth-remember-check" class="text-xs text-[#334155] dark:text-slate-300 font-normal cursor-pointer select-none">
            记住凭证（保存在本地浏览器存储中）
          </Label>
        </div>

        <!-- 错误展示区域 Error Display Area (按需显示) -->
        <div
          v-if="props.errorInfo"
          class="p-3 rounded-lg bg-[#FEF2F2] dark:bg-red-950/30 border border-[#FECACA] dark:border-red-900/60 space-y-2">
          <!-- 错误标题行 -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <AlertTriangle class="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              <span class="text-[11px] font-bold text-[#991B1B] dark:text-red-400 truncate">
                {{ props.errorInfo.title || '同步校验失败' }}
              </span>
            </div>
            <span class="text-[10px] font-mono text-[#EF4444] shrink-0">
              {{ props.errorInfo.code || 'ERR_INVALID_TOKEN' }}
            </span>
          </div>

          <!-- 详细错误说明 -->
          <p class="text-[10px] text-[#B91C1C] dark:text-red-300 leading-relaxed">
            {{ props.errorInfo.message }}
          </p>

          <!-- 原始日志 Debug Box -->
          <div
            v-if="props.errorInfo.rawLog"
            class="p-2 rounded bg-[#450A0A] dark:bg-black/60 text-[#FCA5A5] font-mono text-[9px] overflow-x-auto">
            <code>{{ props.errorInfo.rawLog }}</code>
          </div>
        </div>

        <!-- 底部按钮栏 Dialog Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
          <!-- 清除历史凭证 -->
          <button
            type="button"
            @click="handleClear"
            class="px-3 py-1.5 rounded-md text-xs text-[#64748B] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 transition-colors cursor-pointer"
            title="清除当前缓存凭证">
            清除历史凭证
          </button>

          <!-- 右侧取消与确认按钮 -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-1.5 rounded-md text-xs font-medium text-[#475569] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              取消
            </button>
            <button
              type="submit"
              :disabled="props.isUpdating"
              class="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed">
              <RefreshCw v-if="props.isUpdating" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ props.isUpdating ? '验证同步中...' : '🔄 验证并同步更新' }}</span>
            </button>
          </div>
        </div>

      </form>
    </DialogContent>
  </Dialog>
</template>
