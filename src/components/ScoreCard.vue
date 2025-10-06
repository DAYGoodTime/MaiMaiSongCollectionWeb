<template>
    <div ref="ScoreCardRef" @click.right.native="(e) => emit('rightClick', e, ScoreCardRef, props.score.score_id)"
        data-component="ScoreCard">
        <div class="w-72 sm:w-64 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
            @click="() => openTitleTooltips = true"
            @dblclick="() => emit('dbClick', ScoreCardRef, props.score.song, getNoteDesigner(SongDiff))">
            <div :class="cardClass" @click="emit('singleClick', ScoreCardRef)" class="cursor-pointer p-2">
                <div class="flex gap-1">
                    <div class="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <img :src="getImageCoverUrl(props.score.song.id ?? 0)" alt="Song Cover"
                            class="object-cover w-full h-full" loading="lazy">
                    </div>
                    <div class="flex-1 text-white min-w-0">
                        <div class="flex justify-between items-start">
                            <TooltipProvider>
                                <Tooltip v-model:open="openTitleTooltips" :delay-duration="0">
                                    <TooltipTrigger class="font-bold truncate text-left">
                                        {{ score.song.title }}
                                    </TooltipTrigger>
                                    <TooltipContent class="cursor-pointer hover:opacity-50"
                                        @click="() => emit('copy', score.song.title, '已成功复制歌曲名到剪切板中')">
                                        <p>{{ score.song.title }}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <img class="w-auto h-5"
                                :src="getImageAssertUrl(props.score.score.type === 'dx' ? 'DX' : 'SD')"
                                alt="Song Type" />
                        </div>

                        <div v-if="played" class="flex items-center justify-between font-bold text-2xl text-left">
                            <span>{{ formatAchievement(props.score.score.achievements) }}%</span>
                            <img :src="getAchievementIcon(props.score.score.rate_type)" alt="Achievement Icon"
                                class="h-8 w-16">
                        </div>
                        <div v-else class="font-bold text-xl text-left">
                            暂未游玩
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-b-lg p-2">
                <div class="flex w-full justify-between items-center">
                    <div class="flex justify-between items-center">
                        <span class="text-left text-sm text-gray-600">{{ details }}</span>
                        <img v-if="ScoreStore.selectedSource !== 'usagi'" :src="dxScoreIcon" loading="lazy" />
                        <!-- <TooltipProvider>
                            <Tooltip v-model:open="openDxScoreTooltips" :delay-duration="0">
                                <TooltipTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{{ `${details.sc.current}/${cardData.dxScore.total}` }}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider> -->
                    </div>
                    <div class="flex w-12">
                        <img class="h-7 w-7" :src="getFCFSIcon(conventFcFsStr(score.score.fc))" />
                        <img class="h-7 w-7" :src="getFCFSIcon(conventFcFsStr(score.score.fs))" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MaiMaiSong, ScoreExtend } from '@/types/songs';
import { conventFcFsStr, getTotalDxScore } from '@/utils/StrUtil';
import { getDxScoreIcon, getFCFSIcon } from '@/utils/urlUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/ui/tooltip';
import { computed, useTemplateRef } from 'vue';
import { getAchievementIcon, getImageAssertUrl, getImageCoverUrl } from '@/utils/urlUtils';
import { formatAchievement, formatDxRating, formatLevelValue, getNoteDesigner } from '@/utils/StrUtil';
import { getSongDiffByScoreEx, showCurrentStyleId } from '@/utils/functionUtil';
import { ref } from 'vue';
import { useScores } from '@/store/datasources/scores';

const props = defineProps<{
    score: ScoreExtend
}>()

const ScoreCardRef = useTemplateRef('ScoreCardRef')
const ScoreStore = useScores();
const openTitleTooltips = ref(false)

const isUtage = computed(() => props.score.score.type === 'utage');


const cardClass = computed(() => {
    let baseClass = "flex flex-col rounded-t-lg";
    if (isUtage.value) return baseClass + ' bg-UTAGE';
    const colors = ['bg-BASIC', 'bg-ADVANCED', 'bg-EXPERT', 'bg-MASTER', 'bg-REMASTER'];
    return baseClass + ` ${colors[props.score.score.level_index]}`;
});
const SongDiff = computed(() => {
    return getSongDiffByScoreEx(props.score);
})

const details = computed(() => {
    const diff = SongDiff.value
    const levelValue = diff ? formatLevelValue(diff.level_value) : '';
    const dxScoreOrPc = props.score.score.play_count ? `pc:${props.score.score.play_count}` : ''
    let baseDetails = `#${showCurrentStyleId(props.score.song.id)} ${levelValue} → ${formatDxRating(props.score.score.dx_rating)} ${dxScoreOrPc}`;
    if (props.score.score.type === "utage") {
        baseDetails = `#${props.score.score.diff_id} ${props.score.score.level}      ${dxScoreOrPc}`;
    }
    return baseDetails;
});
const dxScoreIcon = computed(() => {
    const diff = SongDiff.value
    return getDxScoreIcon(props.score.score.dx_score, getTotalDxScore(diff)) ?? "";
})

const played = computed(() => props.score.score.is_played === undefined ? true : props.score.score.is_played);

const emit = defineEmits<{
    (e: 'dbClick', ref: HTMLDivElement | null, song: MaiMaiSong, noteDesigner: string): void
    (e: 'copy', text: string, message: string): void
    (e: 'singleClick', ref: HTMLDivElement | null): void
    (e: 'rightClick', event: Event, ref: HTMLDivElement | null, score_id: string): void
}>()
</script>
