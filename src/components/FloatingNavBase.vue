<script setup lang="ts">
import { useAppStore } from "@/store/appStore";
import { useIntersectionObserver, type UseIntersectionObserverReturn } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { ref, watch, type ComponentPublicInstance } from "vue";

const { showCustomSideBarTrigger } = storeToRefs(useAppStore())
type CommonComponent = ComponentPublicInstance | HTMLElement | null
const props = defineProps<{ target: CommonComponent }>()
watch(() => props.target, (newRef) => {
    if (newRef) {
        setUpObserver(newRef)
    }
})
const showSticky = defineModel("showSticky")
//disable floating sidebarTrigger when using navbar as floating element
watch(() => showCustomSideBarTrigger.value, () => {
    setUpObserver(props.target)
})
const Observer = ref<UseIntersectionObserverReturn>()
const setUpObserver = (target: CommonComponent) => {
    if (Observer.value) {
        Observer.value.stop()
    }
    if (target) {
        Observer.value = useIntersectionObserver(target, ([{ isIntersecting, boundingClientRect }]) => {
            if (!isIntersecting && boundingClientRect.y < 0) {
                showSticky.value = showCustomSideBarTrigger.value;
            } else {
                setTimeout(() => showSticky.value = false, 500)
            }
        }, {
            threshold: 0,
        })
    }
}
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