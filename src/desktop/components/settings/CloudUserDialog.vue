<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Button } from '@/components/shadcn/ui/button'
import { toast } from 'vue-sonner'

interface Props {
  open: boolean
  mode?: 'set' | 'confirm'
  currentName?: string
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  mode: 'set',
  currentName: '',
  isSubmitting: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [name: string]
}>()

const userNameInput = ref(props.currentName || '')

watch(() => props.currentName, (newVal) => {
  userNameInput.value = newVal || ''
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    userNameInput.value = props.currentName || ''
  }
})

const handleClose = () => {
  emit('update:open', false)
}

const handleSubmit = () => {
  const trimmed = userNameInput.value.trim()
  if (!trimmed) {
    toast.error('请输入用户名')
    return
  }
  if (trimmed.length > 20) {
    toast.error('用户名长度不能超过 20 个字符')
    return
  }
  emit('submit', trimmed)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent
      class="max-w-[425px] bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-xl shadow-xl">
      <DialogHeader>
        <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
          {{ props.mode === 'set' ? '设置个人云端标识符' : '确认云端用户名' }}
        </DialogTitle>
        <DialogDescription class="text-xs text-[#64748B] dark:text-slate-400">
          <template v-if="props.mode === 'set'">
            请输入一个标识符来管理你的云端合集与留言数据。该名称将作为同步的唯一凭证。
          </template>
          <template v-else>
            确认使用用户名 <span class="font-bold text-[#2563EB] dark:text-blue-400">{{ props.currentName }}</span> 同步云端数据吗？若需切换，可在下方直接修改。
          </template>
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4 pt-2">
        <div class="space-y-2">
          <Label for="cloud-user-name" class="text-xs font-bold text-[#334155] dark:text-slate-300">
            用户名 / 标识符
          </Label>
          <Input
            id="cloud-user-name"
            v-model="userNameInput"
            placeholder="请输入您的云端用户名"
            :disabled="props.isSubmitting"
            class="text-xs text-[#0F172A] dark:text-white"
            required
          />
        </div>

        <DialogFooter class="gap-2 sm:gap-0 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            @click="handleClose"
            class="text-xs h-8">
            取消
          </Button>
          <Button
            type="submit"
            :disabled="props.isSubmitting"
            class="text-xs h-8 bg-[#2563EB] hover:bg-blue-700 text-white">
            {{ props.isSubmitting ? '处理中...' : (props.mode === 'set' ? '保存标识符' : '确认并同步') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
