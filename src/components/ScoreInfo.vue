<template>
    <div class="space-y-4">
        <Card :class="getClassColorByIndex(diff.difficulty.level_index, diff.isUtage)"
            v-for="diff in processedDifficulties(props.difficulties)" :key="diff.difficulty.level_index">
            <CardContent class="px-4 pb-2 pt-1">
                <div class="flex items-start sm:items-center justify-between">
                    <div class="flex items-center gap-3 text-center">
                        <span class="font-semibold">
                            {{ diff.label }}
                        </span>
                        <span class="text-2xl font-bold">{{ diff.levelDisplay }}</span>
                    </div>
                    <div class="flex gap-2" v-if="diff.score">
                        <img class="h-7 w-7" :src="getFCFSIcon(conventFcFsStr(diff.score.fc))" />
                        <img class="h-7 w-7" :src="getFCFSIcon(conventFcFsStr(diff.score.fs))" />
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

                    <div class="flex gap-4 text-sm">
                        <div class="flex gap-4">
                            <div>
                                <span class="text-gray-200">DX Rating</span>
                                <div class="font-bold">{{ formatDxRating(diff.score.dx_rating) }}</div>
                            </div>
                            <div>
                                <span class="text-gray-200">DX Score</span>
                                <div class="flex gap-2">
                                    <span class="font-bold">{{ `${diff.dxScore.current}/${diff.dxScore.total}` }}</span>
                                    <img class="w-auto h-4" v-if="diff.dxScore.available" :src="diff.dxScore.icon"
                                        loading="lazy" />
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
                                @click="handelCopy(diff.difficulty.note_designer, '已成功复制谱师到剪切板中')">
                                {{ diff.difficulty.note_designer }}
                            </span>
                        </div>
                        <div>
                            <span class="mr-2">版本:</span>
                            <span class="font-semibold">{{ conventVersionByInt(diff.difficulty.version) }}</span>
                        </div>
                        <div v-if="ScoreStore.isSupportPlayCount">
                            <span class="mr-2">游玩次数:</span>
                            <span class="font-semibold">{{ diff.playcount }}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 self-end sm:self-center">
                        <Button @click="emit('menu', props.song, diff.difficulty)" variant="outline"
                            class="text-black">查看标签</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="outline" class="h-8 text-black dark:bg-stone-500 dark:text-white">
                                    添加进合集
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem v-for="coll in getCollectionNames" :key="coll"
                                    @click="() => addScoreToCollection(coll, diff.difficulty, !!diff.score)">{{ coll }}
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
import { conventFcFsStr } from '@/utils/StrUtil';
import { getFCFSIcon } from '@/utils/urlUtils';
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent } from './shadcn/ui/dropdown-menu';
import { Button } from './shadcn/ui/button';
import { getAchievementIcon, getDxScoreIcon } from '@/utils/urlUtils';
import type { MaiMaiSong, SongDifficulty, SongDifficultyAny, SongDifficultyUtage } from '@/types/songs';
import { formatDxRating, formatLevelValue, getTotalDxScore, LevelIndexToLabel, conventVersionByInt } from '@/utils/StrUtil';
import { useCollectionStore } from '@/store/collections';
import { toast } from 'vue-sonner';
import { useCopyHelper } from '@/utils/functionUtil';
import { storeToRefs } from 'pinia';
import { useScores } from '@/store/datasources/scores';
const { handelCopy } = useCopyHelper()

const props = defineProps<{
    song: MaiMaiSong,
    difficulties: SongDifficulty[] | SongDifficultyUtage[],
}>();

const ScoreStore = useScores();

const processedDifficulties = (diffs: SongDifficulty[] | SongDifficultyUtage[]) => {
    return [...diffs].reverse().map(difficulty => {
        const isUtageVal = difficulty.type === 'utage';
        const diff_id = (isUtageVal && ("diff_id" in difficulty)) ? difficulty.diff_id : props.song.id
        const score = ScoreStore.getScoreByUni(diff_id, difficulty.type, difficulty.level_index);
        let label = '';
        if (isUtageVal && ("kanji" in difficulty)) {
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
            },
            playcount: score ? score.play_count : 0
        };
    });
};


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
const emit = defineEmits<{
    (e: 'menu', song: MaiMaiSong, diff: SongDifficultyAny): void
}>()

// collection
const { pushScoreToCollection } = useCollectionStore();
const { getCollectionNames } = storeToRefs(useCollectionStore())
function addScoreToCollection(label: string, diff: SongDifficulty | SongDifficultyUtage, hasScore: boolean) {
    const diff_id = diff.type === "utage" ? (diff as SongDifficultyUtage).diff_id : props.song.id
    if (!hasScore) {
        toast.warning("该难度暂无游玩记录，将以「未游玩」状态添加进合集，并且默认不展示", { position: "top-center" });
    }
    if (pushScoreToCollection(label, `${diff_id}_${diff.type}_${diff.level_index}`)) {
        toast.success("添加成功");
    } else {
        toast.error("添加失败,已经在集合当中");
    }
}
</script>
