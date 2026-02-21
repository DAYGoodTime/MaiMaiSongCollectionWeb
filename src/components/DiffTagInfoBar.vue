<template>
    <div class="space-y-4">
        <template v-for="(group, groupIndex) in props.tagInfo" :key="groupIndex">
            <div v-if="group.tags.length !== 0"
                class="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: group.group.color }"></div>
                    <span class="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {{ group.group.localized_name['zh-Hans'] }}
                    </span>
                </div>
                <div class="flex flex-col gap-2 overflow-y-auto">
                    <div v-for="item in group.tags" :key="item.tag.id" class="flex items-center gap-2">
                        <span class="text-xs text-gray-600 dark:text-gray-400 w-24 shrink-0 truncate">
                            {{ item.tag.localized_name['zh-Hans'] }}
                        </span>
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-300"
                                :style="{ width: `${maxCount(group.tags) > 0 ? (item.count / maxCount(group.tags) * 100) : 0}%`, backgroundColor: group.group.color }">
                            </div>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">
                            {{ item.count.toFixed(0) }}
                        </span>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="isEmpty" class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            暂无标签信息
        </div>
    </div>
</template>
<script setup lang="ts">
import type { DiffTagCounter, GroupInfoForCounter } from '@/types/tag';
import { computed } from 'vue';

const maxCount = (tags: DiffTagCounter[]) => Math.max(...tags.map(t => t.count), 0)

const props = defineProps<{
    tagInfo: GroupInfoForCounter[]
}>()

const isEmpty = computed(() => {
    return props.tagInfo.every(g => g.tags.length === 0)
})
</script>