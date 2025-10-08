<template>
  <TooltipProvider>
    <Tooltip v-model:open="tooltipState.visible" :delay-duration="0">
      <TooltipTrigger as-child :reference="targetRef">
      </TooltipTrigger>
      <TooltipContent class="cursor-pointer hover:opacity-50" @mouseenter="cancelHideTooltip" @mouseleave="hideTooltip"
        @click="() => tooltipState.onClick?.()">
        <p>{{ tooltipState.content }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/ui/tooltip';
import { tooltipState, hideTooltip, cancelHideTooltip } from '@/lib/useTooltip';

const targetRef = ref()

// 监听目标元素的变化
watch(() => tooltipState.target, (target) => {
  if (target) {
    targetRef.value = target
  }
});
</script>
