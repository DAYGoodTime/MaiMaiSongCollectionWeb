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
                    <SheetContent
                        class="flex flex-col gap-0 p-0 w-full sm:max-w-md lg:max-w-3xl xl:max-w-4xl">
                        <SheetHeader class="shrink-0 px-5 pt-5 pb-4 border-b">
                            <SheetTitle class="text-left text-lg">详情统计</SheetTitle>
                            <SheetDescription class="text-left">
                                共 {{ statisticsBoard.total }} 张谱面的成绩分布
                            </SheetDescription>
                            <div class="grid grid-cols-2 gap-2 pt-2 text-left">
                                <div class="rounded-lg border bg-muted/40 px-3 py-2">
                                    <p class="text-[11px] uppercase tracking-wide text-muted-foreground">平均达成率</p>
                                    <p class="text-lg font-bold tabular-nums">{{ getAvgAchievement }}%</p>
                                </div>
                                <div v-if="statisticsBoard.totalPlayCount > 0"
                                    class="rounded-lg border bg-muted/40 px-3 py-2">
                                    <p class="text-[11px] uppercase tracking-wide text-muted-foreground">总游玩次数</p>
                                    <p class="text-lg font-bold tabular-nums">{{ statisticsBoard.totalPlayCount }}</p>
                                </div>
                            </div>
                        </SheetHeader>
                        <ScrollArea class="flex-1 min-h-0">
                            <div class="grid gap-4 p-5 lg:grid-cols-2">
                                <section v-for="group in statGroups" :key="group.title"
                                    class="rounded-xl border bg-card p-4 shadow-sm">
                                    <h3 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground">
                                        {{ group.title }}
                                    </h3>
                                    <ul class="space-y-2.5">
                                        <li v-for="item in group.items" :key="item.key" class="space-y-1">
                                            <div class="flex items-center justify-between gap-3">
                                                <div class="flex min-w-0 items-center gap-2">
                                                    <img v-if="item.icon" :src="item.icon" :alt="item.key"
                                                        :title="item.key" :class="group.iconClass" loading="lazy" />
                                                    <span v-if="item.text"
                                                        class="truncate text-sm font-medium">{{ item.text }}</span>
                                                </div>
                                                <div class="shrink-0 tabular-nums">
                                                    <span class="text-lg font-bold">{{ item.current }}</span>
                                                    <span class="text-xs text-muted-foreground">
                                                        / {{ statisticsBoard.total }}</span>
                                                </div>
                                            </div>
                                            <div class="h-1.5 overflow-hidden rounded-full bg-muted">
                                                <div class="h-full rounded-full bg-primary transition-[width] duration-500"
                                                    :style="{ width: percent(item.current) }" />
                                            </div>
                                        </li>
                                    </ul>
                                </section>
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        </CardTitle>
        <CardContent>
            <!-- PC Layout -->
            <template v-if="isLg">
                <div class="grid grid-cols-2 gap-2">
                    <div class="flex-1 space-y-2">
                        <div class="flex justify-between" v-for="ranking in statisticsBoard.rank_first"
                            :key="ranking.alt">
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
                        <div class="flex justify-between" v-for="ranking in statisticsBoard.apfc" :key="ranking.alt">
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
            </template>
            <!-- Mobile Layout -->
            <template v-else>
                <div class="space-y-2">
                    <div class="flex justify-between" v-for="ranking in statisticsBoard.rank_first" :key="ranking.alt">
                        <div class="flex items-center gap-2">
                            <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                        </div>
                        <div>
                            <span class="text-xl font-bold">{{ ranking.current }}</span>
                            <span class="text-sm text-muted-foreground">/ {{ statisticsBoard.total }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import { Card, CardContent, CardTitle } from '@/components/shadcn/ui/card'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetDescription } from '@/components/shadcn/ui/sheet';
import { Button } from '@/components/shadcn/ui/button';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { computed, reactive } from 'vue';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';
import { ACHIEVEMENT, PLAY_BONUS, ACHIEVEMENT_ICON, PLAY_BONUS_ICON } from '@/utils/urlUtils';
import { conventFcFsStr, getDxScoreThreshold, getTotalDxScore, DX_SCORE_TIERS } from '@/utils/StrUtil';
import type { Score } from '@/types/datasource';
import type { MaiMaiSong } from '@/types/songs';
import { getSongDiffByScore } from '@/utils/functionUtil';

const breakpoints = useBreakpoints(breakpointsTailwind)
const isLg = breakpoints.greaterOrEqual('lg')

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
    dxScore: StatisticsValue[],
    totalPlayCount: number
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
    total: 0,
    totalPlayCount: 0
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
    // 累计游玩次数(如果有的话)
    if (score.play_count) {
        statisticsBoard.totalPlayCount += score.play_count
    }

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
    statisticsBoard.total = 0
    statisticsBoard.totalAchievements = 0
    statisticsBoard.totalPlayCount = 0
    statisticsBoard.noteDesigners.clear()
        ;[
            ...statisticsBoard.rank_first,
            ...statisticsBoard.rank_second,
            ...statisticsBoard.apfc,
            ...statisticsBoard.fs,
            ...statisticsBoard.dxScore
        ].forEach(s => s.current = 0)
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
    if (other[1] > 0) sorted.push(other)
    return sorted;
})
const percent = (current: number) =>
    statisticsBoard.total === 0 ? '0%' : `${(current / statisticsBoard.total) * 100}%`

// 详情面板统一的数据源，避免桌面/移动端重复模板
const statGroups = computed(() => {
    const toItems = (list: StatisticsValue[]) =>
        list.map(s => ({ key: s.alt, icon: s.icon, text: s.icon ? '' : s.alt, current: s.current }))
    return [
        { title: '达成率分布', iconClass: 'h-7 w-auto', items: toItems([...statisticsBoard.rank_first, ...statisticsBoard.rank_second]) },
        { title: 'AP / FC', iconClass: 'h-7 w-auto', items: toItems(statisticsBoard.apfc) },
        { title: 'FS / SYNC', iconClass: 'h-7 w-auto', items: toItems(statisticsBoard.fs) },
        {
            title: 'DX 分统计', iconClass: 'h-4 w-auto',
            items: statisticsBoard.dxScore.map(s => ({
                key: s.alt,
                icon: s.icon,
                text: s.icon ? `(${(s.require as number) * 100}%)` : '0星 (<85%)',
                current: s.current
            }))
        },
        {
            title: '谱师统计', iconClass: 'h-4 w-auto',
            items: getOrderedNoteDesigner.value.map(arr => ({
                key: String(arr[0]), icon: '', text: String(arr[0]), current: arr[1] as number
            }))
        }
    ]
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
