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
                <div class="flex flex-wrap items-center gap-2 max-h-32 overflow-y-auto">
                    <Badge v-for="(tag, index) in group.tags" :key="index" variant="outline" class="text-xs cursor-pointer hover:opacity-70 transition-opacity duration-200
                           border-gray-300 dark:border-gray-600 hover:shadow-sm" :style="{
                            backgroundColor: group.group.color + '20',
                            borderColor: group.group.color + '40',
                            color: 'inherit'
                        }" @mouseenter="handelTagDescription(getTag(tag).localized_description['zh-Hans'], $event)"
                        @mouseleave="hideTooltip()">
                        {{ getText(tag, group) }}
                    </Badge>
                </div>
            </div>
        </template>

        <div v-if="props.tagInfo.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            暂无标签信息
        </div>
    </div>
</template>
<script setup lang="ts">
import { hideTooltip, showTooltip } from '@/lib/useTooltip';
import type { DiffTAG, DiffTagCounter, GroupInfo, GroupInfoForCounter } from '@/types/tag';
import { Badge } from '@/components/shadcn/ui/badge';

const props = defineProps<{
    tagInfo: GroupInfo[] | GroupInfoForCounter[]
}>()

const getTag = (tag: DiffTAG | DiffTagCounter) => {
    if ("count" in tag) return tag.tag
    return tag;
}

const getText = (tag: DiffTAG | DiffTagCounter, group: GroupInfo | GroupInfoForCounter) => {
    if ("count" in tag && "total" in group) {
        return `${tag.tag.localized_name['zh-Hans']} (${((tag.count / group.total) * 100).toFixed(0)}%)`
    } else if ("localized_name" in tag) {
        return `${tag.localized_name['zh-Hans']}`
    }
}
const handelTagDescription = (text: string, event: MouseEvent) => {
    showTooltip(event.target as HTMLElement, text);
};


</script>