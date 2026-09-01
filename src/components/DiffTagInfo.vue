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
                <div class="flex flex-wrap items-center gap-2">
                    <span v-for="(tag, index) in group.tags" :key="index" class="group relative inline-flex">
                        <Badge variant="outline" class="text-xs border-gray-300 dark:border-gray-600"
                            :style="{
                                backgroundColor: group.group.color + '20',
                                borderColor: group.group.color + '40',
                                color: 'inherit'
                            }">
                            {{ tag.localized_name['zh-Hans'] }}
                        </Badge>
                        <span v-if="tag.localized_description['zh-Hans']"
                            class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden w-max max-w-48 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-center text-xs text-background shadow-md group-hover:block">
                            {{ tag.localized_description['zh-Hans'] }}
                        </span>
                    </span>
                </div>
            </div>
        </template>

        <div v-if="isEmpty" class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            暂无标签信息
        </div>
    </div>
</template>
<script setup lang="ts">
import type { GroupInfo } from '@/types/tag';
import { Badge } from '@/components/shadcn/ui/badge';
import { computed } from 'vue';

const props = defineProps<{
    tagInfo?: GroupInfo[]
}>()

const isEmpty = computed(() => {
    return props.tagInfo != null && props.tagInfo.every(g => g.tags.length === 0)
})
</script>