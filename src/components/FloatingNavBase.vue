<script setup lang="ts">
import { useAppStore } from "@/store/appStore";
import { useIntersectionObserver } from "@vueuse/core";
import { onMounted, onUnmounted, watch, type ComponentPublicInstance } from "vue";

const appStore = useAppStore()
type CommonComponent = ComponentPublicInstance | HTMLElement | null
const props = defineProps<{ target: CommonComponent }>()
watch(() => props.target, (newRef) => {
    if (newRef) {
        useIntersectionObserver(newRef, ([{ isIntersecting, boundingClientRect }]) => {
            if (!isIntersecting && boundingClientRect.y < 0) {
                showSticky.value = true;
            } else {
                showSticky.value = false;
            }
        }, {
            threshold: 0,
        })
    }
})
const showSticky = defineModel("showSticky")
//disable floating sidebarTrigger when using navbar as floating element
onMounted(() => {
    appStore.shouldShowFloatingSideBarTrigger = false
})
onUnmounted(() => {
    appStore.shouldShowFloatingSideBarTrigger = true
})
defineExpose({
    showSticky
})
</script>

<template>
    <transition name="fade">
        <slot v-if="showSticky">
        </slot>
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