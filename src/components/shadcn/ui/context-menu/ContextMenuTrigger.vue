<script setup lang="ts">
import { ContextMenuTrigger, type ContextMenuTriggerProps, useForwardProps } from 'reka-ui'

const props = defineProps<ContextMenuTriggerProps>()

const forwardedProps = useForwardProps(props)
const onContextMenu = (e: PointerEvent) => {
  const target = (e.target as HTMLElement).closest('[data-component="ScoreCard"]')
  if (!target) {
    e.preventDefault()
  }
}
</script>

<template>
  <ContextMenuTrigger v-bind="forwardedProps" @contextmenu="onContextMenu">
    <slot />
  </ContextMenuTrigger>
</template>
