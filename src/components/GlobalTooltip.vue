<template>
  <TooltipProvider>
    <Tooltip v-model:open="tooltipState.visible" :delay-duration="0">
      <TooltipTrigger as-child :reference="targetRef">
      </TooltipTrigger>
      <TooltipContent :class="contentClass" @mouseenter="cancelHideTooltip" @mouseleave="hideTooltip"
        @click="() => tooltipState.onClick?.()">
        <div v-if="typeof tooltipState.content === 'string'">
          <p>{{ tooltipState.content }}</p>
        </div>
        <component :is="tooltipState.content" v-else />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/ui/tooltip';
import { tooltipState, hideTooltip, cancelHideTooltip } from '@/lib/useTooltip';

const targetRef = ref()

// 监听目标元素的变化
watch(() => tooltipState.target, (target) => {
  if (target) {
    targetRef.value = target
  }
});

const contentClass = computed(() => {
  return tooltipState.onClick ? 'cursor-pointer hover:opacity-50 z-[99]' : 'z-[99]';
});
</script>
