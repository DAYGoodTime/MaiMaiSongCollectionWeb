<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from './utils'
import { MdFab } from '@material/web/fab/fab.js'
import { useAppStore } from '@/store/appStore';
import { useElementBounding, useIntersectionObserver, type UseIntersectionObserverReturn } from '@vueuse/core'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
const appStore = useAppStore();
const handelTriggerToggle = () => {
  appStore.ComboboxOpen = false;
  nextTick(() => {
    toggleSidebar()
  })
}
const triggerRef = useTemplateRef("sidebarTrigger")
const showSticky = ref(false)
const { x } = useElementBounding(triggerRef)
const floatingStyle = computed(() => {
  return {
    left: `${x.value}px`
  }
})
const ObsInstance = ref<UseIntersectionObserverReturn>();
const setUpObserver = () => {
  if (ObsInstance.value) {
    ObsInstance.value.stop()
  }
  ObsInstance.value = useIntersectionObserver(triggerRef, ([{ isIntersecting, boundingClientRect }]) => {
    if (!isIntersecting && boundingClientRect.y < 0) {
      if (appStore.shouldShowFloatingSideBarTrigger) {
        showSticky.value = true;
      } else {
        showSticky.value = false;
      }
    } else {
      showSticky.value = false;
    }
  }, {
    threshold: 0,
  })
}



watch(() => appStore.shouldShowFloatingSideBarTrigger, () => {
  setUpObserver();
})
</script>

<template>
  <md-fab ref="sidebarTrigger" data-sidebar="trigger" @click="handelTriggerToggle" :class="props.class">
    <PanelLeft slot="icon" class="!h-7 !w-7" />
    <span class="sr-only">menu</span>
  </md-fab>
  <transition name="fade">
    <md-fab v-if="showSticky" :style="floatingStyle" data-sidebar="trigger" @click="handelTriggerToggle"
      :class="cn('fixed top-0 left-0 z-10', props.class)">
      <PanelLeft slot="icon" class="!h-7 !w-7" />
      <span class="sr-only">menu</span>
    </md-fab>
  </transition>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
