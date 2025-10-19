<template>
    <div ref="ScoreCardRef" @click.right.native="(e) => emit('rightClick', e, ScoreCardRef, props.score.score_id)"
        data-component="ScoreCard">
        <div class="w-72 h-full sm:w-64 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl dark:border"
            @dblclick="() => emit('dbClick', ScoreCardRef, props.score.song, getNoteDesigner(SongDiff))">
            <div :class="cardClass" @click="handleTitleEnter(scoreTitle)" @mouseenter="handleTitleEnter(scoreTitle)"
                @mouseleave="hideTooltip()" class="cursor-pointer p-2">
                <div class="flex gap-1">
                    <div class="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <img :src="getImageCoverUrl(props.score.song.id ?? 0)" alt="Song Cover"
                            class="object-cover w-full h-full" loading="lazy">
                    </div>
                    <div class="flex-1 text-white min-w-0">
                        <div class="flex justify-between items-start">
                            <span class="font-bold text-left truncate" :title="scoreTitle">
                                {{ scoreTitle }}</span>
                            <img v-if="!isUtage" class="w-auto h-5"
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
            <div class=" bg-white dark:bg-black rounded-b-lg p-2">
                <div class="flex w-full items-center">
                    <div class="flex flex-1 justify-between items-center pr-2" @mouseenter="handleDxScoreEnter()"
                        @mouseleave="hideTooltip(200)">
                        <span ref="CardDetailRef" class="text-left text-sm text-gray-600 dark:text-gray-300">{{ details
                        }}</span>
                        <div ref="DxScoreIconRef">
                            <img v-if="!ScoreStore.isSupportPlayCount" class="w-auto h-4" :src="dxScoreIcon"
                                loading="lazy" />
                        </div>
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

<script setup lang="tsx">
import type { MaiMaiSong, ScoreExtend } from '@/types/songs';
import { conventFcFsStr, getDxScoreRadio, getTotalDxScore } from '@/utils/StrUtil';
import { getDxScoreIcon, getFCFSIcon } from '@/utils/urlUtils';
import { computed, useTemplateRef, type VNode } from 'vue';
import { getAchievementIcon, getImageAssertUrl, getImageCoverUrl } from '@/utils/urlUtils';
import { formatAchievement, formatDxRating, formatLevelValue, getNoteDesigner } from '@/utils/StrUtil';
import { getSongDiffByScoreEx } from '@/utils/functionUtil';
import { useScores } from '@/store/datasources/scores';
import { showTooltip, hideTooltip } from '@/lib/useTooltip';

const props = defineProps<{
    score: ScoreExtend
}>()

const ScoreCardRef = useTemplateRef('ScoreCardRef')
const DxScoreIconRef = useTemplateRef('DxScoreIconRef')
const CardDetailRef = useTemplateRef('CardDetailRef')
const ScoreStore = useScores();

const handleTitleEnter = (title: string) => {
    const copyFn = () => emit('copy', title, '已成功复制歌曲名到剪切板中');
    showTooltip(ScoreCardRef.value as HTMLElement, title, copyFn);
};
const handleDxScoreEnter = () => {
    const imgClass = dxScoreIcon.value.includes("UI_GAM_DXScoreIcon_2_5") ? "w-auto" : "w-auto h-4"
    const template: VNode =
        <div>{ScoreStore.isSupportPlayCount ?
            <div class={'flex justify-between items-center gap-2'}>
                <p>{dxScoreText.value}</p>
                <img class={imgClass} src={dxScoreIcon.value} loading="lazy" />
            </div>
            : <p>{dxScoreText.value}</p>}
        </div>
    const targetRef = ScoreStore.isSupportPlayCount ? CardDetailRef.value : DxScoreIconRef.value
    showTooltip(targetRef as HTMLElement, template);
};

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
const scoreTitle = computed(() => {
    if (isUtage.value && SongDiff.value && ("kanji" in SongDiff.value)) {
        return `[${SongDiff.value.kanji}] ${SongDiff.value.is_buddy ? '[双]' : ''} ${props.score.song.title}`
    } else return props.score.song.title
})
const details = computed(() => {
    const diff = SongDiff.value
    const levelValue = diff ? formatLevelValue(diff.level_value) : '';
    const palyCount = ScoreStore.isSupportPlayCount ? `pc:${props.score.score.play_count}` : ''
    let baseDetails = `#${ScoreStore.showCurrentStyleId(props.score.song.id)} ${levelValue} → ${formatDxRating(props.score.score.dx_rating)} ${palyCount} `;
    if (props.score.score.type === "utage") {
        baseDetails = `#${props.score.score.diff_id} ${props.score.score.level} ${palyCount}`;
    }
    return baseDetails;
});
const dxScoreIcon = computed(() => {
    const diff = SongDiff.value
    return getDxScoreIcon(props.score.score.dx_score, getTotalDxScore(diff)) ?? "";
})
const dxScoreText = computed(() => {
    return `${props.score.score.dx_score} / ${getTotalDxScore(SongDiff.value)} ${(getDxScoreRadio(props.score) * 100).toFixed(2)}%`
})

const played = computed(() => props.score.score.is_played === undefined ? true : props.score.score.is_played);

const emit = defineEmits<{
    (e: 'dbClick', ref: HTMLDivElement | null, song: MaiMaiSong, noteDesigner: string): void
    (e: 'copy', text: string, message: string): void
    (e: 'singleClick', ref: HTMLDivElement | null): void
    (e: 'rightClick', event: Event, ref: HTMLDivElement | null, score_id: string): void
}>()
</script>
