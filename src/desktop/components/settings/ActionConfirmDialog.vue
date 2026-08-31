<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/shadcn/ui/dialog'
import { Button } from '@/components/shadcn/ui/button'

interface Props {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isProcessing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '确定要执行此操作吗？',
  description: '此操作执行后可能无法撤回，请确认是否继续。',
  confirmText: '确认',
  cancelText: '取消',
  isDestructive: false,
  isProcessing: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

const handleClose = () => {
  emit('update:open', false)
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent
      class="max-w-[400px] bg-white dark:bg-[#131B2E] border border-[#CBD5E1] dark:border-[#26354D] rounded-xl shadow-xl">
      <DialogHeader>
        <DialogTitle class="text-base font-bold text-[#0F172A] dark:text-white">
          {{ props.title }}
        </DialogTitle>
        <DialogDescription class="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed pt-1">
          {{ props.description }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter class="gap-2 sm:gap-0 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          @click="handleClose"
          :disabled="props.isProcessing"
          class="text-xs h-8">
          {{ props.cancelText }}
        </Button>
        <Button
          type="button"
          :variant="props.isDestructive ? 'destructive' : 'default'"
          @click="handleConfirm"
          :disabled="props.isProcessing"
          class="text-xs h-8"
          :class="!props.isDestructive ? 'bg-[#2563EB] hover:bg-blue-700 text-white' : ''">
          {{ props.isProcessing ? '处理中...' : props.confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
