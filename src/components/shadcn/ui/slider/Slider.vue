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
  showTicks?: boolean
}

const props = withDefaults(defineProps<EnhancedSliderProps>(), {
  showMinMax: true,
  tooltipFormatter: (value: number) => value.toFixed(1),
  showTicks: false,
})

const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'showMinMax', 'tooltipFormatter', 'showTicks')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const isDragging = ref(false)

const currentValues = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue
  }
  return [props.modelValue || props.min || 0]
})

const minValue = computed(() => props.min || 0)
const maxValue = computed(() => props.max || 100)

const tickPositions = computed(() => {
  if (!props.showTicks) return []
  const range = maxValue.value - minValue.value
  if (range <= 0) return []
  const ticks = []
  const start = Math.ceil(minValue.value)
  const end = Math.floor(maxValue.value)
  for (let i = start; i <= end; i++) {
    ticks.push({
      value: i,
      position: ((i - minValue.value) / range) * 100,
    })
  }
  return ticks
})
</script>

<template>
  <div class="w-full">
    <div class="relative">
      <SliderRoot :class="cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:h-full',
        props.class,
      )" v-bind="forwarded" @pointerdown="isDragging = true" @pointerup="isDragging = false">
        <SliderTrack
          class="relative h-1.5 w-full data-[orientation=vertical]:w-1.5 grow overflow-hidden rounded-full bg-primary/20">
          <SliderRange class="absolute h-full data-[orientation=vertical]:w-full bg-primary" />
        </SliderTrack>
        <TooltipProvider>
          <template v-for="(value, _index) in currentValues" :key="_index">
            <Tooltip :open="isDragging">
              <TooltipTrigger as-child>
                <SliderThumb
                  class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 bg-primary rounded-full" />
                </SliderThumb>
              </TooltipTrigger>
              <TooltipContent :style="{ bottom: '100%' }" class="min-w-[30px] text-center">
                {{ tooltipFormatter(value) }}
              </TooltipContent>
            </Tooltip>
          </template>
        </TooltipProvider>
      </SliderRoot>
      <div v-if="showTicks" class="relative h-2 mt-1" aria-hidden="true">
        <span v-for="tick in tickPositions" :key="tick.value" class="absolute w-px h-2 bg-gray-300"
          :style="{ left: `${tick.position}%` }">
        </span>
      </div>
    </div>
    <div v-if="showMinMax" class="flex justify-between mt-2">
      <span class="text-xs text-muted-foreground">{{ minValue.toFixed(1) }}</span>
      <span class="text-xs text-muted-foreground">{{ maxValue.toFixed(1) }}</span>
    </div>
  </div>
</template>