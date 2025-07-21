<template>
    <ContextMenu>
        <ContextMenuTrigger>
            <div class="w-64 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                <div :class="cardData.cardClass" @click="toggleDescMenu" class="cursor-pointer p-2">
                    <div class="flex gap-1">
                        <div class="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <img :src="cardData.coverUrl" alt="Song Cover" class="object-cover w-full h-full"
                                loading="lazy">
                        </div>
                        <div class="flex-1 text-white min-w-0">
                            <div class="flex justify-between items-start">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger class="font-bold truncate text-left">
                                            {{ score.song.title }}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{{ score.song.title }}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <img class="w-auto h-5" :src="cardData.typeIconUrl" alt="Song Type" />
                            </div>
                            <div class="flex items-center gap-1 font-bold text-2xl text-left">
                                <span>{{ cardData.achievementFormatted }}%</span>
                                <img :src="cardData.achievementIconUrl" alt="Achievement Icon" class="h-8 w-16">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-b-lg p-2">
                    <div class="flex w-full justify-between items-center">
                        <span class="text-left text-sm text-gray-600">{{ cardData.details }}</span>
                        <div class="flex w-12">
                            <FCFSPanel class="h-7 w-7" :fc="score.score.fc" :fs="score.score.fs" />
                        </div>

                    </div>
                </div>
                <div v-if="openMenu" class="p-2 bg-gray-50" ref="target">
                    <Textarea @update:model-value="onUpdateMessage" v-model="message" placeholder="关于这个铺子的一些心得？"
                        class="w-full" />
                </div>
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem class="text-red-600" @click="handelRemoveScore(score.score_id)">从合集中删除</ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup lang="ts">
import type { ScoreExtend } from '@/types/songs';
import { getAchievementIcon, getImageAssertUrl, getImageCoverUrl } from '@/utils/urlUtils';
import { ref, computed } from 'vue';
import { Textarea } from './shadcn/ui/textarea';
import { formatAchievement, formatDxRating, formatLevelValue, getSongDiff } from '@/utils/StrUtil';
import { useCollectionStore } from '@/store/collections';
import { debounce } from '@/utils/functionUtil';
import FCFSPanel from './FCFSPanel.vue';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/shadcn/ui/context-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/ui/tooltip';
import { toast } from 'vue-sonner';
import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
    score: ScoreExtend
}>()

const openMenu = ref(false);
const target = ref(null);

onClickOutside(target, () => {
    if (openMenu.value) {
        openMenu.value = false;
    }
});

const cardData = computed(() => {
    const isUtage = props.score.score.type === 'utage';
    const levelIndex = props.score.score.level_index;
    let cardClass = "flex flex-col rounded-t-lg";

    if (isUtage) cardClass += ' bg-UTAGE';
    else {
        const colors = ['bg-BASIC', 'bg-ADVANCED', 'bg-EXPERT', 'bg-MASTER', 'bg-REMASTER'];
        cardClass += ` ${colors[levelIndex]}`;
    }

    const diff = getSongDiff(props.score.song, props.score.score);
    const levelValue = diff ? formatLevelValue(diff.level_value) : '';

    return {
        cardClass,
        coverUrl: getImageCoverUrl(props.score.song.id ?? 0),
        typeIconUrl: getImageAssertUrl(props.score.score.type === 'dx' ? 'DX' : 'SD'),
        achievementFormatted: formatAchievement(props.score.score.achievements),
        achievementIconUrl: getAchievementIcon(props.score.score.achievements),
        details: `#${props.score.song.id} ${levelValue} → ${formatDxRating(props.score.score.dx_rating)}`
    }
});

const { CollectionMessageMap, removeFromCollection } = useCollectionStore();
const message = ref(CollectionMessageMap[props.score.score_id]?.message || "");

const toggleDescMenu = () => {
    const msgObj = CollectionMessageMap[props.score.score_id];
    if (!msgObj) {
        CollectionMessageMap[props.score.score_id] = { message: "" };
    }
    message.value = CollectionMessageMap[props.score.score_id].message;
    openMenu.value = !openMenu.value;
}

const onUpdateMessage = debounce((val: string | number) => {
    if (CollectionMessageMap[props.score.score_id]) {
        CollectionMessageMap[props.score.score_id].message = String(val);
    }
}, 300);

const emit = defineEmits(['onDelete'])
const handelRemoveScore = (score_id: string) => {
    if (removeFromCollection(score_id)) {
        toast.success("删除成功");
        emit('onDelete');
    } else {
        toast.error("删除失败");
    }
}
</script>
