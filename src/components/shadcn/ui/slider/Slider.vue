<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/ui/tooltip'
import { cn } from '@/lib/utils'
import { ref, computed } from 'vue'

interface EnhancedSliderProps extends SliderRootProps {
  class?: HTMLAttributes['class']
  showMinMax?: boolean
  tooltipFormatter?: (value: number) => string
}

const props = withDefaults(defineProps<EnhancedSliderProps>(), {
  showMinMax: true,
  tooltipFormatter: (value: number) => value.toString()
})

const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'showMinMax', 'tooltipFormatter')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const isDragging = ref(false)
const tooltipOpen = ref<boolean[]>([])

// 计算最小值和最大值
const minValue = computed(() => props.min || 0)
const maxValue = computed(() => props.max || 100)

// 获取当前值数组
const currentValues = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue
  }
  return [props.modelValue || props.min || 0]
})

// 处理滑块值变化
const handleValueChange = (value?: number[]) => {
  if (value) {
    // 更新tooltip状态
    if (isDragging.value) {
      tooltipOpen.value = value.map(() => true)
    }
  }
}

// 处理拖拽开始
const handleSlideStart = () => {
  isDragging.value = true
}

// 处理拖拽结束
const handleSlideEnd = () => {
  isDragging.value = false
}
</script>

<template>
  <div class="w-full max-w-96">
    <div class="relative">
      <SliderRoot :class="cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:h-full',
        props.class,
      )" v-bind="forwarded" @update:model-value="handleValueChange" @mouseup="handleSlideStart"
        @mousedown="handleSlideEnd">
        <SliderTrack
          class="relative h-1.5 w-full data-[orientation=vertical]:w-1.5 grow overflow-hidden rounded-full bg-primary/20">
          <SliderRange class="absolute h-full data-[orientation=vertical]:w-full bg-primary" />
        </SliderTrack>
        <TooltipProvider>
          <!-- 第一个滑块 -->
          <Tooltip v-model:open="isDragging">
            <TooltipTrigger as-child>
              <SliderThumb
                class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                @pointerdown="handleSlideStart" @pointerup="handleSlideEnd" />
            </TooltipTrigger>
            <TooltipContent :style="{ bottom: '100%' }" class="min-w-[30px] text-center">
              {{ tooltipFormatter(currentValues[0]) }}
            </TooltipContent>
          </Tooltip>

          <!-- 第二个滑块 -->
          <Tooltip v-model:open="isDragging">
            <TooltipTrigger as-child>
              <SliderThumb
                class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                @pointerdown="handleSlideStart" @pointerup="handleSlideEnd" />
            </TooltipTrigger>
            <TooltipContent :style="{ bottom: '100%' }" class="min-w-[30px] text-center">
              {{ tooltipFormatter(currentValues[1]) }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SliderRoot>
    </div>
    <!-- 最小值和最大值显示 -->
    <div v-if="showMinMax" class="flex justify-between mt-2">
      <span class="text-xs text-muted-foreground">{{ minValue }}</span>
      <span class="text-xs text-muted-foreground">{{ maxValue }}</span>
    </div>
  </div>
</template>