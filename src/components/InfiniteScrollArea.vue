<template>
    <ScrollArea :class="cn('w-full rounded-md border p-4', props.class)">
        <div class="space-y-4">
            <slot name="default" :items="bufferItems" :loading="loading" :has-more="hasMore" :error="error">
                <div v-for="item in bufferItems" :key="(item as any).id || Math.random()"
                    class="flex items-center space-x-4 rounded-lg border p-4">
                    <div class="flex-shrink-0">
                        <div
                            class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {{ (item as any).id }}
                        </div>
                    </div>
                    <div class="flex-1 space-y-1">
                        <h3 class="text-sm font-medium leading-none">{{ (item as any).title }}</h3>
                        <p class="text-sm text-muted-foreground">{{ (item as any).description }}</p>
                    </div>
                </div>
            </slot>
        </div>
    </ScrollArea>
</template>

<script setup lang="ts" generic="T = any">
import { ref, computed, watchEffect, watch } from 'vue'
import { ScrollArea } from '@/components/shadcn/ui/scroll-area'
import { cn } from '@/lib/utils';
import { useWindowScroll } from '@vueuse/core';

// 组件属性
interface Props<T> {
    items: T[],
    pageSize?: number
    threshold?: number // 距离底部多少像素时触发加载
    class: string,
}

// 定义 slots 的类型
interface Slots<T> {
    default?: (props: {
        items: T[]
        loading: boolean
        hasMore: boolean
        error: boolean
    }) => any
    loading?: (props: {
        loading: boolean
    }) => any
    'no-more'?: (props: {
        hasMore: boolean
        items: T[]
    }) => any
    error?: (props: {
        error: boolean
        retry: () => void
    }) => any
}

const props = withDefaults(defineProps<Props<T>>(), {
    pageSize: 20,
    threshold: 100
})

// 定义 slots
defineSlots<Slots<T>>()

// 响应式数据
const items = ref<T[]>([])
const loading = ref(false)
const hasMore = ref(true)
const error = ref(false)
const currentPage = ref(1)


const bufferItems = computed(() => {
    return props.items.slice(0, currentPage.value * props.pageSize);
})
// 观察分页变化
watchEffect(() => {
    hasMore.value = bufferItems.value.length < props.items.length
})
// 加载更多数据
const loadMore = () => {
    if (loading.value || !hasMore.value) return
    loading.value = true
    error.value = false
    try {
        currentPage.value++;
    } catch (err) {
        error.value = true
        console.error('加载数据失败:', err)
    } finally {
        loading.value = false
    }
}


const { arrivedState } = useWindowScroll({ offset: { bottom: props.threshold } })

watch(() => arrivedState.bottom, (bool) => {
    if (bool && hasMore.value) {
        loadMore();
    }
})
// 重置数据
const reset = () => {
    items.value = []
    currentPage.value = 1
    hasMore.value = true
    error.value = false
}
// 暴露方法给父组件
defineExpose({
    loadMore,
    reset,
    items: items.value
})
</script>