<template>
    <Card class="shadow hover:shadow-xl">
        <CardTitle>
            <div class="flex justify-between items-center mb-4">
                <div></div>
                <Sheet class="">
                    <SheetTrigger>
                        <Button variant="ghost" class="mt-1 mr-1">
                            <span class="text-sm text-muted-foreground">显示详细统计信息</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent class="pr-0">
                        <SheetHeader>
                            <SheetTitle>详情统计</SheetTitle>
                        </SheetHeader>
                        <ScrollArea class="flex flex-col gap-2 max-h-full pr-4">
                            <div class="flex flex-col gap-2 my-4">
                                <p class="font-bold">平均达成率:<span>{{ getAvgAchievement }}%</span></p>
                                <p class="font-bold">达成率分布</p>
                                <!-- PC Layout -->
                                <div class="hidden lg:grid lg:grid-cols-2 gap-2">
                                    <div class="flex-1 space-y-2">
                                        <div class="flex justify-between" v-for="ranking in statisticsBoard.rank_first">
                                            <div class="flex items-center gap-2">
                                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                <span class="text-sm text-muted-foreground">
                                                    / {{ statisticsBoard.total }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex-1 space-y-2">
                                        <div class="flex justify-between" v-for="ranking in statisticsBoard.apfc">
                                            <div class="flex items-center gap-2">
                                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                <span class="text-sm text-muted-foreground">
                                                    / {{ statisticsBoard.total }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="hidden lg:block mb-4">
                                    <div class="grid grid-cols-2 gap-2 pt-2">
                                        <div class="flex-1 space-y-2">
                                            <div class="flex justify-between"
                                                v-for="ranking in statisticsBoard.rank_second">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">
                                                        / {{ statisticsBoard.total }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex-1 space-y-2">
                                            <div class="flex justify-between" v-for="ranking in statisticsBoard.fs">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">
                                                        / {{ statisticsBoard.total }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="font-bold my-2">dx分统计:</p>
                                    <div class="grid grid-cols-2 gap-2 mt-2">
                                        <div class="flex justify-between" v-for="dxScore in statisticsBoard.dxScore">
                                            <div class="flex items-center gap-2">
                                                <img v-if="dxScore.icon" :src="dxScore.icon" :alt="dxScore.alt"
                                                    class="w-auto h-4" :title="dxScore.alt" />
                                                <span v-else>{{ '0星(<85%)' }}</span>
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ dxScore.current }}</span>
                                                <span class="text-sm text-muted-foreground">/ {{
                                                    statisticsBoard.total
                                                    }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="font-bold my-2">谱师统计:</p>
                                    <div class="grid grid-cols-2 gap-2 mt-2">
                                        <div class="flex justify-between items-center"
                                            v-for="arr in getOrderedNoteDesigner">
                                            <span class="text-sm">{{ arr[0] }}</span>
                                            <div class="min-w-fit">
                                                <span class="text-xl font-bold">{{ arr[1] }}</span>
                                                <span class="text-sm text-muted-foreground">/ {{ statisticsBoard.total
                                                    }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Mobile Layout -->
                                <div class="block lg:hidden space-y-2">
                                    <div class="flex justify-between" v-for="ranking in statisticsBoard.rank_first">
                                        <div class="flex items-center gap-2">
                                            <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                                        </div>
                                        <div>
                                            <span class="text-xl font-bold">{{ ranking.current }}</span>
                                            <span class="text-sm text-muted-foreground">
                                                / {{ statisticsBoard.total }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="block lg:hidden space-y-4 mb-4">
                                    <div class="space-y-2">
                                        <div class="flex justify-between"
                                            v-for="ranking in statisticsBoard.rank_second">
                                            <div class="flex items-center gap-2">
                                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8"
                                                    loading="lazy" />
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                <span class="text-sm text-muted-foreground">
                                                    / {{ statisticsBoard.total }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2 pt-2">
                                        <div class="space-y-2">
                                            <div class="flex justify-between" v-for="ranking in statisticsBoard.apfc">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8"
                                                        loading="lazy" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">
                                                        / {{ statisticsBoard.total }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="space-y-2">
                                            <div class="flex justify-between" v-for="ranking in statisticsBoard.fs">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8"
                                                        loading="lazy" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">
                                                        / {{ statisticsBoard.total }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="font-bold my-2">dx分统计:</p>
                                    <div class="flex flex-col gap-2 mt-2">
                                        <div class="flex justify-between" v-for="dxScore in statisticsBoard.dxScore">
                                            <div class="flex items-center gap-2">
                                                <div v-if="dxScore.icon" class="flex">
                                                    <img :src="dxScore.icon" :alt="dxScore.alt" class="w-auto h-4"
                                                        :title="dxScore.alt" />
                                                    <span class="ml-1 text-sm font-semibold">
                                                        ({{ `${dxScore.require * 100}%` }})</span>
                                                </div>
                                                <span v-else>
                                                    0星
                                                    <span class="ml-1 text-sm font-semibold">
                                                        {{ '(<85%)' }}</span>
                                                    </span>
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ dxScore.current }}</span>
                                                <span class="text-sm text-muted-foreground">
                                                    / {{ statisticsBoard.total }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="font-bold">谱师统计:</p>
                                    <div class="flex flex-col gap-2 mt-2">
                                        <div class="flex justify-between" v-for="arr in getOrderedNoteDesigner">
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm truncate">{{ arr[0] }}</span>
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ arr[1] }}</span>
                                                <span class="text-sm text-muted-foreground">
                                                    / {{ statisticsBoard.total }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        </CardTitle>
        <CardContent>
            <!-- PC Layout -->
            <div class="hidden lg:block">
                <div class="lg:grid lg:grid-cols-2 gap-2">
                    <div class="flex-1 space-y-2">
                        <div class="flex justify-between" v-for="ranking in statisticsBoard.rank_first">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statisticsBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 space-y-2">
                        <div class="flex justify-between" v-for="ranking in statisticsBoard.apfc">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statisticsBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Mobile Layout -->
            <div class="block lg:hidden">
                <div class="space-y-2">
                    <div class="flex justify-between" v-for="ranking in statisticsBoard.rank_first">
                        <div class="flex items-center gap-2">
                            <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                        </div>
                        <div>
                            <span class="text-xl font-bold">{{ ranking.current }}</span>
                            <span class="text-sm text-muted-foreground">/ {{ statisticsBoard.total }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import { Card, CardContent, CardTitle } from '@/components/shadcn/ui/card'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/shadcn/ui/sheet';
import { Button } from '@/components/shadcn/ui/button';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { computed, reactive } from 'vue';
import { ACHIEVEMENT, PLAY_BONUS, ACHIEVEMENT_ICON, PLAY_BONUS_ICON } from '@/utils/urlUtils';
import { conventFcFsStr, getDxScoreThreshold, getTotalDxScore, DX_SCORE_TIERS } from '@/utils/StrUtil';
import type { Score } from '@/types/datasource';
import type { MaiMaiSong } from '@/types/songs';
import { getSongDiffByScore } from '@/utils/functionUtil';

interface StatisticsValue {
    icon: string,
    current: number,
    alt: string,
    require: any
}
interface StatisticsBoard {
    rank_first: StatisticsValue[],
    rank_second: StatisticsValue[],
    apfc: StatisticsValue[],
    fs: StatisticsValue[],
    noteDesigners: Map<string, number>,
    totalAchievements: number,
    total: number,
    dxScore: StatisticsValue[]
}
//统计
const statisticsBoard = reactive<StatisticsBoard>({
    rank_first: [
        { icon: ACHIEVEMENT_ICON.SSSP, current: 0, alt: "SSS+", require: ACHIEVEMENT.SSSP },
        { icon: ACHIEVEMENT_ICON.SSS, current: 0, alt: "SSS", require: ACHIEVEMENT.SSS },
        { icon: ACHIEVEMENT_ICON.SSP, current: 0, alt: "SS+", require: ACHIEVEMENT.SSP },
        { icon: ACHIEVEMENT_ICON.SS, current: 0, alt: "SS", require: ACHIEVEMENT.SS }
    ],
    rank_second: [
        { icon: ACHIEVEMENT_ICON.SP, current: 0, alt: "S+", require: ACHIEVEMENT.SP },
        { icon: ACHIEVEMENT_ICON.S, current: 0, alt: "S", require: ACHIEVEMENT.S },
        { icon: ACHIEVEMENT_ICON.AAA, current: 0, alt: "AAA", require: ACHIEVEMENT.AAA },
        { icon: ACHIEVEMENT_ICON.AA, current: 0, alt: "AA", require: ACHIEVEMENT.AA },
        { icon: ACHIEVEMENT_ICON.A, current: 0, alt: "A", require: ACHIEVEMENT.A }
    ],
    apfc: [
        { icon: PLAY_BONUS_ICON.APP, current: 0, alt: "AP+", require: PLAY_BONUS.APP },
        { icon: PLAY_BONUS_ICON.AP, current: 0, alt: "AP", require: PLAY_BONUS.AP },
        { icon: PLAY_BONUS_ICON.FCP, current: 0, alt: "FC+", require: PLAY_BONUS.FCP },
        { icon: PLAY_BONUS_ICON.FC, current: 0, alt: "FC", require: PLAY_BONUS.FC },
    ],
    fs: [
        { icon: PLAY_BONUS_ICON.FDXP, current: 0, alt: "FDX+", require: PLAY_BONUS.FDXP },
        { icon: PLAY_BONUS_ICON.FDX, current: 0, alt: "FDX", require: PLAY_BONUS.FDX },
        { icon: PLAY_BONUS_ICON.FSP, current: 0, alt: "FS+", require: PLAY_BONUS.FSP },
        { icon: PLAY_BONUS_ICON.FS, current: 0, alt: "FS", require: PLAY_BONUS.FS },
        { icon: PLAY_BONUS_ICON.SYNC, current: 0, alt: "Sync", require: PLAY_BONUS.SYNC }
    ],
    dxScore: [
        { icon: DX_SCORE_TIERS[0].icon, current: 0, alt: "dx0星(<85%)", require: DX_SCORE_TIERS[0].threshold },
        { icon: DX_SCORE_TIERS[1].icon, current: 0, alt: "dx1星(<90%)", require: DX_SCORE_TIERS[1].threshold },
        { icon: DX_SCORE_TIERS[2].icon, current: 0, alt: "dx2星(<93%)", require: DX_SCORE_TIERS[2].threshold },
        { icon: DX_SCORE_TIERS[3].icon, current: 0, alt: "dx3星(<95%)", require: DX_SCORE_TIERS[3].threshold },
        { icon: DX_SCORE_TIERS[4].icon, current: 0, alt: "dx4星(<97%)", require: DX_SCORE_TIERS[4].threshold },
        { icon: DX_SCORE_TIERS[6].icon, current: 0, alt: "dx5星(>97%)", require: DX_SCORE_TIERS[5].threshold }
    ],
    noteDesigners: new Map<string, number>(),
    totalAchievements: 0,
    total: 0
})
const updateStatisticsBoard = (score: Score, song: MaiMaiSong) => {
    // 使用单个循环处理所有状态统计，避免重复遍历
    statisticsBoard.rank_first.forEach(statistics => {
        if (score.achievements >= statistics.require) statistics.current++;
    });

    statisticsBoard.rank_second.forEach(statistics => {
        if (score.achievements >= statistics.require) statistics.current++;
    });

    const fcStr = conventFcFsStr(score.fc);
    statisticsBoard.apfc.forEach(statistics => {
        if (fcStr === statistics.require) statistics.current++;
    });

    const fsStr = conventFcFsStr(score.fs);
    statisticsBoard.fs.forEach(statistics => {
        if (fsStr === statistics.require) statistics.current++;
    });

    // 累加总达成率
    statisticsBoard.totalAchievements += score.achievements;


    const diff = getSongDiffByScore(song, score);

    //统计dx分
    const dxThreshold = getDxScoreThreshold(score.dx_score, getTotalDxScore(diff))
    statisticsBoard.dxScore.forEach(statistics => {
        if (dxThreshold === statistics.require) statistics.current++;
    });

    // 统计谱师信息
    const noteDesigner = diff?.note_designer || "";
    if (noteDesigner) {
        statisticsBoard.noteDesigners.set(
            noteDesigner,
            (statisticsBoard.noteDesigners.get(noteDesigner) || 0) + 1
        );
    }

    // 增加总数统计
    statisticsBoard.total++;
}
//init
const initStatistics = () => {
    for (const key of Object.keys(statisticsBoard)) {
        if (key === "total") statisticsBoard.total = 0;
        else if (key === "totalAchievements") statisticsBoard.totalAchievements = 0;
        else if (key === "noteDesigners") statisticsBoard.noteDesigners.clear();
        else {
            (statisticsBoard[key as keyof StatisticsBoard] as StatisticsValue[]).forEach(s => s.current = 0)
        }
    }
}
const getOrderedNoteDesigner = computed(() => {
    const list = []
    const other: [string, number] = ["其它(<=1)", 0]
    const itr = statisticsBoard.noteDesigners.entries();
    for (const value of itr) {
        if (value[1] <= 1 && statisticsBoard.noteDesigners.size > 10) {
            other[1]++;
        } else {
            list.push([value[0], value[1]])
        }
    }
    const sorted = list.sort((s1, s2) => (s2[1] as number) - (s1[1] as number));
    sorted.push(other)
    return sorted;
})
const getAvgAchievement = computed(() => {
    if (statisticsBoard.total === 0) return 0;
    return (statisticsBoard.totalAchievements / statisticsBoard.total).toFixed(4)
})

defineExpose({
    updateStatisticsBoard,
    initStatistics
})
</script>