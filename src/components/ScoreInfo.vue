<template>
    <div class="space-y-4">
        <Card :class="getClassColorByIndex(diff.difficulty.level_index, diff.isUtage)"
            v-for="diff in processedDifficulties" :key="diff.difficulty.level_index">
            <CardContent class="px-4 pb-2 pt-1">
                <div class="flex items-start sm:items-center justify-between">
                    <div class="flex items-center gap-3 text-center">
                        <span class="font-semibold">
                            {{ diff.label }}
                        </span>
                        <span class="text-2xl font-bold">{{ diff.levelDisplay }}</span>
                    </div>
                    <div class="flex gap-2" v-if="diff.score">
                        <FCFSPanel class="w-10 h-10" :fc="diff.score.fc" :fs="diff.score.fs" />
                    </div>
                </div>

                <div class="bg-black/20 rounded-lg p-3 mb-3" v-if="diff.score">
                    <div class="flex items-center gap-3 mb-2">
                        <img class="w-20" :src="getAchievementIcon(diff.score.rate_type)" loading="lazy" />
                        <div class="flex-1">
                            <div class="text-sm text-gray-200">达成率</div>
                            <div class="text-xl font-bold">{{ `${diff.score.achievements.toFixed(4)}%` }}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex gap-4">
                            <div>
                                <span class="text-gray-200">DX Rating</span>
                                <div class="font-bold">{{ formatDxRating(diff.score.dx_rating) }}</div>
                            </div>
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="text-gray-200">DX Score</span>
                                    <div class="font-bold">{{ `${diff.dxScore.current}/${diff.dxScore.total}` }}</div>
                                </div>
                                <div class="overflow-hidden h-7">
                                    <img class="max-w-full max-h-full" v-if="diff.dxScore.available"
                                        :src="diff.dxScore.icon" loading="lazy" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="border-[#0e7536] border border-opacity-25 mb-2" v-else></div>
                <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div v-if="diff.difficulty.note_designer && diff.difficulty.note_designer !== '-'">
                            <span class="mr-2">谱师:</span>
                            <span class="font-semibold cursor-pointer hover:opacity-50"
                                @click="handelCopy(diff.difficulty.note_designer, '已成功复制谱师到剪切板中')">{{
                                    diff.difficulty.note_designer
                                }}</span>
                        </div>
                        <div>
                            <span class="mr-2">版本:</span>
                            <span class="font-semibold">{{ conventVersionByInt(diff.difficulty.version) }}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 self-end sm:self-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button :disabled="!diff.score" variant="outline" class="h-8 text-black">
                                    添加进合集
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem v-for="coll in getCollectionNames" :key="coll"
                                    @click="() => addScoreToCollection(coll, diff.difficulty)">{{ coll }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
<script setup lang="ts">
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent } from './shadcn/ui/dropdown-menu';
import { Button } from './shadcn/ui/button';
import { getAchievementIcon, getDxScoreIcon } from '@/utils/urlUtils';
import type { MaiMaiSong, SongDifficulty } from '@/types/songs';
import { formatDxRating, formatLevelValue, getTotalDxScore, LevelIndexToLabel } from '@/utils/StrUtil';
import { conventVersionByInt } from '@/utils/version';
import { computed } from 'vue';
import { useDataStore } from '@/store/datasource';
import { useCollectionStore } from '@/store/collections';
import { toast } from 'vue-sonner';
import { defineAsyncComponent } from 'vue';
import { useCopyHelper } from '@/utils/functionUtil';
import { storeToRefs } from 'pinia';
const { handelCopy } = useCopyHelper()
const FCFSPanel = defineAsyncComponent(() => import('./FCFSPanel.vue'));

const props = defineProps<{
    song: MaiMaiSong,
    difficulties: SongDifficulty[],
}>();

const { getScore } = useDataStore();

const processedDifficulties = computed(() => {
    return [...props.difficulties].reverse().map(difficulty => {
        const score = getScore(props.song.id, difficulty.type, difficulty.level_index);
        const isUtageVal = difficulty.type === 'utage';
        let label = '';
        if (isUtageVal) {
            label = `U·TA·GE ${`[${difficulty.kanji ?? ''}]`}${difficulty.is_buddy ? `[双]` : ''}`;
        } else {
            label = LevelIndexToLabel(difficulty.level_index) ?? "";
        }
        const totalDxScore = getTotalDxScore(difficulty)
        const currentDxScore = score ? score.dx_score : 0
        const dxScoreIcon = getDxScoreIcon(currentDxScore, totalDxScore)
        return {
            difficulty,
            score,
            isUtage: isUtageVal,
            label,
            levelDisplay: isUtageVal ? difficulty.level : formatLevelValue(difficulty.level_value),
            dxScore: {
                total: totalDxScore,
                current: currentDxScore,
                available: dxScoreIcon != null,
                icon: dxScoreIcon ?? ""
            }
        };
    });
});


function getClassColorByIndex(index: number, isUtage: boolean) {
    const baseClass = "text-white transition-all";
    if (isUtage) {
        return `bg-UTAGE ${baseClass}`;
    }
    switch (index) {
        case 0: return `bg-BASIC ${baseClass}`;
        case 1: return `bg-ADVANCED ${baseClass}`;
        case 2: return `bg-EXPERT ${baseClass}`;
        case 3: return `bg-MASTER ${baseClass}`;
        case 4: return `bg-REMASTER ${baseClass}`;
        default: return baseClass;
    }
}

// collection
const { pushScoreToCollection } = useCollectionStore();
const { getCollectionNames } = storeToRefs(useCollectionStore())
function addScoreToCollection(label: string, diff: SongDifficulty) {
    if (pushScoreToCollection(label, `${props.song.id}_${diff.type}_${diff.level_index}`)) {
        toast.success("添加成功");
    } else {
        toast.error("添加失败,已经在集合当中");
    }
}
</script>
