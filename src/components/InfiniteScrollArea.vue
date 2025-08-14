<template>
    <ScrollArea :class="cn('w-full rounded-md border p-4', props.class)" ref="scrollAreaRef">
        <!-- 使用 slot 渲染已加载的内容 -->
        <div class="space-y-4">
            <slot name="default" :items="bufferItems" :loading="loading" :has-more="hasMore" :error="error">
                <!-- 默认渲染 -->
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

        <!-- 加载状态的骨架屏 -->
        <slot name="loading" :loading="loading">
            <div v-if="loading" class="space-y-4 mt-4">
                <div v-for="n in 3" :key="`skeleton-${n}`" class="flex items-center space-x-4 rounded-lg border p-4">
                    <Skeleton class="h-10 w-10 rounded-full" />
                    <div class="flex-1 space-y-2">
                        <Skeleton class="h-4 w-3/4" />
                        <Skeleton class="h-3 w-1/2" />
                    </div>
                </div>
            </div>
        </slot>

        <!-- 没有更多数据的提示 -->
        <slot name="no-more" :has-more="hasMore" :items="bufferItems">
            <div v-if="!hasMore && items.length > 0" class="text-center py-4 text-muted-foreground">
                没有更多数据了
            </div>
        </slot>

        <!-- 错误状态 -->
        <slot name="error" :error="error" :retry="loadMore">
            <div v-if="error" class="text-center py-4 text-red-500">
                加载失败，请重试
                <button @click="loadMore" class="ml-2 text-blue-500 hover:underline">
                    重新加载
                </button>
            </div>
        </slot>
    </ScrollArea>
</template>

<script setup lang="ts" generic="T = any">
import { ref, onMounted, onUnmounted, nextTick, computed, watchEffect } from 'vue'
import { ScrollArea } from '@/components/shadcn/ui/scroll-area'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
import { cn } from '@/lib/utils';

// 组件属性
interface Props<T> {
    items: T[],
    pageSize?: number
    threshold?: number // 距离底部多少像素时触发加载
    class: string
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
const scrollAreaRef = ref()


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
    console.log("trigger");
    try {
        currentPage.value++;
    } catch (err) {
        error.value = true
        console.error('加载数据失败:', err)
    } finally {
        loading.value = false
    }
}


// 滚动事件处理
const handleScroll = async (event: Event) => {
    const target = event.target as HTMLElement
    const { scrollTop, scrollHeight, clientHeight } = target
    const distanceToBottom = scrollHeight - scrollTop - clientHeight

    // 当距离底部小于阈值时触发加载
    if (distanceToBottom < props.threshold && !loading.value && hasMore.value) {
        loadMore()
    }
}

// 设置滚动监听
const currentViewport = ref();
const setupScrollListener = () => {
    if (!scrollAreaRef.value) return

    // 获取 ScrollArea 内部的滚动容器
    currentViewport.value = scrollAreaRef.value.$el?.querySelector('.scroller-viewport')
    if (currentViewport.value) {
        currentViewport.value.addEventListener('scroll', handleScroll)
    }
}

// 移除滚动监听
const removeScrollListener = (viewport: Element | null) => {
    if (viewport) {
        viewport.removeEventListener('scroll', handleScroll)
    }
}

// 重置数据
const reset = () => {
    items.value = []
    currentPage.value = 1
    hasMore.value = true
    error.value = false
}

// 初始加载和滚动监听设置
onMounted(async () => {
    // 等待 DOM 更新后设置滚动监听
    await nextTick()
    setupScrollListener()
})
// 清理函数
onUnmounted(() => {
    removeScrollListener(currentViewport.value)
})

// 暴露方法给父组件
defineExpose({
    loadMore,
    reset,
    items: items.value
})
</script>