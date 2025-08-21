
<script setup lang="ts">
import { ref } from 'vue'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/ui/popover'
import { Button } from '@/components/shadcn/ui/button'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
  }>(),
  {
    title: '你确定吗？',
    description: '这个操作无法撤销。',
    confirmText: '确定',
    cancelText: '取消',
  },
)

const emit = defineEmits(['confirm', 'cancel'])

const isOpen = ref(false)

function onConfirm() {
  emit('confirm')
  isOpen.value = false
}

function onCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <slot />
    </PopoverTrigger>
    <PopoverContent class="w-80">
      <div class="grid gap-4">
        <div class="space-y-2">
          <h4 class="font-medium leading-none">
            {{ title }}
          </h4>
          <p class="text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="onCancel">
            {{ cancelText }}
          </Button>
          <Button variant="destructive" @click="onConfirm">
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
