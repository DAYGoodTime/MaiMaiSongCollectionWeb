<template>
    <Sheet v-model:open="showAdvanced">
        <SheetContent>
            <SheetHeader>
                <SheetTitle>高级选项</SheetTitle>
                <SheetDescription>
                    这里有一些自动化操作，未来可能会逐步添加
                </SheetDescription>
            </SheetHeader>
            <div class="flex-1 my-4">
                <div>
                    <p class="font-semibold">自动导入</p>
                    <span class="text-sm text-gray-600">根据预先设定的逻辑进行成绩的筛选导入</span><span
                        class="text-sm text-red-600">且会覆盖合集原来的数据</span>
                    <div class="flex justify-center gap-4 mt-2">
                        <Button @click="lazy_master_13">全13</Button>
                    </div>
                </div>
            </div>
            <SheetFooter>
                <SheetClose as-child>
                    <Button type="submit">
                        关闭
                    </Button>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    </Sheet>
    <div class="container mx-auto px-4 py-4">
        <div class="flex justify-center">
            <Card class="w-full lg:w-1/2">
                <CardHeader>
                    <CardTitle>排序与搜索</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div>
                        <p class="text-sm font-mono text-gray-400">双击卡片打开歌曲详情</p>
                        <p class="text-sm font-medium text-muted-foreground">排序方式</p>
                        <div class="flex gap-4 justify-center pt-2">
                            <Badge class="w-fit h-8 cursor-pointer" v-for="(order, index) in OrderBadges"
                                @click="handleOrderStatus(order, index)">
                                {{ order.label }}
                                <ChevronDown v-if="order.status_index === 1" />
                                <ChevronUp v-if="order.status_index === 2" />
                            </Badge>
                        </div>
                    </div>
                    <div class="flex justify-center">
                        <Button variant="outline" @click="showAdvanced = true">高级功能</Button>
                    </div>
                    <div class="relative w-full max-w-sm mx-auto items-center">
                        <Input id="search" type="text" placeholder="搜索成绩..." class="pl-10"
                            @update:model-value="onSearch" v-model:model-value="keyword" />
                        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                            <Search class="size-6 text-muted-foreground" />
                        </span>
                        <span class="absolute end-0 inset-y-0 flex items-center justify-center px-3 cursor-pointer"
                            @click="keyword = ''">
                            <X />
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
        <!-- 成绩列表 -->
        <InfiniteScrollArea
            class="px-0 w-full max-h-screen h-[32rem] overflow-auto my-8 rounded-xl border shadow hover:shadow-xl py-2"
            :items="filteredScoreList" :page-size="60">
            <template #default="{ items }">
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2 justify-items-center">
                    <div v-for="card in items" :key="card.score_id">
                        <ContextMenu>
                            <ContextMenuTrigger>
                                <ScoreCard :score="card"
                                    class="transition-shadow rounded-xl shadow hover:shadow-xl bg-white/90" />
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem class="text-red-600" @click="handelRemoveScore(card.score_id)">从合集中删除
                                </ContextMenuItem>
                                <ContextMenuSub>
                                    <ContextMenuSubTrigger>
                                        添加至其它合集
                                    </ContextMenuSubTrigger>
                                    <ContextMenuSubContent>
                                        <ContextMenuItem
                                            @click="() => handelMoveToOtherCollection(coll.label, card.score_id)"
                                            v-for="coll in getOtherCollections">{{ coll.label }}
                                        </ContextMenuItem>
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                            </ContextMenuContent>
                        </ContextMenu>
                    </div>
                    <p class="flex items-center text-center justify-center" v-if="isEmpty">暂无任何成绩捏~</p>
                </div>
            </template>
        </InfiniteScrollArea>
        <!-- <ScrollArea class="w-full max-h-screen overflow-auto my-8 rounded-xl border shadow hover:shadow-xl py-2"
            ref="scrollArea">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2 justify-items-center">
                <div v-for="card in filteredScoreList" :key="card.score_id">
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <ScoreCard :score="card"
                                class="transition-shadow rounded-xl shadow hover:shadow-xl bg-white/90" />
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem class="text-red-600" @click="handelRemoveScore(card.score_id)">从合集中删除
                            </ContextMenuItem>
                            <ContextMenuSub>
                                <ContextMenuSubTrigger>
                                    添加至其它合集
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent>
                                    <ContextMenuItem
                                        @click="() => handelMoveToOtherCollection(coll.label, card.score_id)"
                                        v-for="coll in getOtherCollections">{{ coll.label }}
                                    </ContextMenuItem>
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        </ContextMenuContent>
                    </ContextMenu>
                </div>
                <div ref="sentinel" class="h-px w-full" />
            </div>
            <p class="flex items-center text-center justify-center" v-if="isEmpty">暂无任何成绩捏~</p>
        </ScrollArea> -->
        <!-- 统计卡片 -->
        <Card class="mx-auto mt-4 lg:w-[30rem] shadow hover:shadow-xl">
            <CardTitle>
                <div class="flex justify-between items-center mb-4">
                    <div></div>
                    <Button variant="ghost" class="mt-1 mr-1" @click="showDetailStats = !showDetailStats">
                        <span class="text-sm text-muted-foreground">{{ showDetailStats ? '收起' : '显示详细统计信息' }}</span>
                        <ChevronDown v-if="!showDetailStats" class="ml-1 h-4 w-4" />
                        <ChevronUp v-if="showDetailStats" class="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </CardTitle>
            <CardContent>
                <!-- PC Layout -->
                <div class="hidden lg:block">
                    <div class="lg:grid lg:grid-cols-2 gap-2">
                        <div class="flex-1 space-y-2">
                            <div class="flex justify-between" v-for="ranking in statusBoard.rank_first">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 space-y-2">
                            <div class="flex justify-between" v-for="ranking in statusBoard.apfc">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 展开后的详细统计 -->
                    <div v-show="showDetailStats" class="grid grid-cols-2 gap-2 pt-2">
                        <div class="flex-1 space-y-2">
                            <div class="flex justify-between" v-for="ranking in statusBoard.rank_second">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 space-y-2 mt-4">
                            <div class="flex justify-between" v-for="ranking in statusBoard.fs">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Mobile Layout -->
                <div class="block lg:hidden">
                    <div class="space-y-2">
                        <div class="flex justify-between" v-for="ranking in statusBoard.rank_first">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="showDetailStats" class="space-y-4">
                        <div class="space-y-2">
                            <div class="flex justify-between" v-for="ranking in statusBoard.rank_second">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-2">
                            <div class="space-y-2">
                                <div class="flex justify-between" v-for="ranking in statusBoard.apfc">
                                    <div class="flex items-center gap-2">
                                        <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                    </div>
                                    <div>
                                        <span class="text-xl font-bold">{{ ranking.current }}</span>
                                        <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between" v-for="ranking in statusBoard.fs">
                                    <div class="flex items-center gap-2">
                                        <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                    </div>
                                    <div>
                                        <span class="text-xl font-bold">{{ ranking.current }}</span>
                                        <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
<script setup lang="ts">
import ScoreCard from '@/components/ScoreCard.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Badge } from '@/components/shadcn/ui/badge';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Input } from '@/components/shadcn/ui/input'
import { Button } from '@/components/shadcn/ui/button';
import { type Collection, useCollectionStore } from '@/store/collections';
import { useDataStore } from '@/store/datasource';
import type { MaiMaiSong, ScoreExtend, SongType } from '@/types/songs';
import { debounce, toFishStyleId, toLXNSStyleId, useRouterHelper } from '@/utils/functionUtil';
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { toast } from 'vue-sonner';
import { toHiragana } from 'wanakana';
import { conventFcFsStr, getNoteDesigners, getSongDiff } from '@/utils/StrUtil';
import { ACHIEVEMENT, PLAY_BONUS, ACHIEVEMENT_ICON, PLAY_BONUS_ICON } from '@/utils/urlUtils';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/shadcn/ui/context-menu'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/shadcn/ui/sheet'
import type { Score } from '@/types/datasource';
import InfiniteScrollArea from '@/components/InfiniteScrollArea.vue';
const { route, backHome } = useRouterHelper()
const { getScore, getSongListAsMap, getSongDataList } = useDataStore()
const { getCollectionByLabel, UserCollectionList, removeFromCollection, pushScoreToCollection } = useCollectionStore()
const collectionStore = useCollectionStore()
const rawCollection = ref<Collection>()
const scoreList = shallowRef<ScoreExtend[]>([])
const SONG_MAP = getSongListAsMap();

interface OrderBadge {
    label: string,
    value: string,
    status_index: number
}
//order
const OrderBadges = ref([
    {
        label: "达成率",
        value: "achievement",
        status_index: 0
    },
    {
        label: "Dx Rating",
        value: "dx_rating",
        status_index: 0
    },
    {
        label: "定数",
        value: "level",
        status_index: 0
    }
])
const selectedOrder = ref<OrderBadge>(OrderBadges.value[0])
const handleOrderStatus = (_order: OrderBadge, index: number) => {
    OrderBadges.value.forEach((o, i) => {
        if (i != index) {
            o.status_index = 0
        } else {
            if (o.status_index == 2) {
                o.status_index = 0;
            } else {
                o.status_index++;
            }
        }
    })
    selectedOrder.value = OrderBadges.value[index];
}
//filtered score list
const keyword = ref("")
const search = ref("")
const isEmpty = computed(() => filteredScoreList.value.length === 0)
const onSearch = debounce((val: string | number) => {
    search.value = String(val)
}, 200);
const getLevelValue = (sc: ScoreExtend) => {
    const diff = getSongDiff(sc.song, sc.score);
    if (diff) return diff.level_value;
    return 0
}
const filteredScoreList = computed(() => {
    const result = new Set<ScoreExtend>();
    //根据关键词搜索
    const hiragana = toHiragana(search.value).toLowerCase();
    const searchLower = search.value.toLowerCase();
    const searchNumber = !isNaN(Number(search)) ? toLXNSStyleId(Number(search)) : null;
    for (const sc of scoreList.value) {
        if (searchNumber !== null && sc.song.id === searchNumber) {
            result.add(sc);
            continue;
        }
        const titleLower = sc.song.title.toLowerCase();
        const artistLower = sc.song.artist.toLowerCase();
        const noteDesigners = getNoteDesigners(sc.song);
        const titleHiragana = toHiragana(sc.song.title).toLowerCase();
        const artistHiragana = toHiragana(sc.song.artist).toLowerCase();
        let ailas = "";
        if (sc.song.aliases) {
            ailas = sc.song.aliases.join(" ").toLowerCase();
        }
        if (
            titleLower.includes(searchLower) ||
            titleHiragana.includes(hiragana) ||
            artistLower.includes(searchLower) ||
            artistHiragana.includes(hiragana) ||
            ailas.includes(searchLower) ||
            noteDesigners.includes(searchLower) ||
            search.value.length === 0
        ) {
            result.add(sc)
        }
    }
    //order
    if (selectedOrder.value.status_index !== 0) {
        let ordered = [...result];
        switch (selectedOrder.value.value) {
            case 'achievement':
                ordered = ordered.sort((a, b) => {
                    if (selectedOrder.value?.status_index == 2) {
                        return a.score.achievements - b.score.achievements
                    } else {
                        return b.score.achievements - a.score.achievements
                    }
                });
                break;
            case 'dx_rating':
                ordered = ordered.sort((a, b) => {
                    if (selectedOrder.value?.status_index == 2) {
                        return a.score.dx_rating - b.score.dx_rating
                    } else {
                        return b.score.dx_rating - a.score.dx_rating
                    }
                });
                break;
            case 'level':
                ordered = ordered.sort((a, b) => {
                    if (selectedOrder.value?.status_index == 2) {
                        return getLevelValue(a) - getLevelValue(b)
                    } else {
                        return getLevelValue(b) - getLevelValue(a)
                    }
                });
                break;
        }
        return ordered;
    }
    return Array.from(result);
})
//init
const createUnplayedScore = (song: MaiMaiSong, song_type: SongType, level_index: number): Score => {
    const diff = song.difficulties[song_type].find(d => d.level_index === level_index);
    return {
        id: song.id,
        fish_id: toFishStyleId(song.id),
        song_name: song.title,
        level: diff ? diff.level : "0",
        level_index,
        achievements: 0,
        fc: null,
        fs: null,
        dx_score: 0,
        dx_rating: 0,
        rate_type: '',
        type: song_type,
        is_played: false
    }
}

const initScoreList = () => {
    initStatus();
    const coll = getCollectionByLabel(route.query.label as string)
    if (!coll) {
        toast.error("合集不存在", { position: "top-center" })
        backHome()
        return;
    }
    collectionStore.CurrentCollectionLabel = coll.label
    rawCollection.value = coll;
    if (rawCollection.value) {
        const level_list = rawCollection.value.list;
        let result: any[] = []
        let quick_count = 0;
        for (const level_str of level_list) {
            const spilt = level_str.split("_")
            if (spilt.length !== 3) continue;
            const song_id = spilt[0];
            const song_type = spilt[1] as SongType;
            const level_index = spilt[2];
            const song = SONG_MAP.get(Number(song_id)) as MaiMaiSong;
            let score = getScore(Number(song_id), song_type, Number(level_index))
            if (score) {
                calcStatusBoard(score)
            } else {
                score = createUnplayedScore(song, song_type, Number(level_index))
            }
            result.push({
                score,
                song,
                score_id: level_str
            })
            quick_count++;
        }
        scoreList.value = result
    }
    //统计总数
    statusBoard.total = scoreList.value.length
}
watch(
    () => route.query.label,
    (_val, _preVal) => {
        initScoreList()
    }
)
onMounted(async () => {
    initScoreList();
})
//统计
interface StatusValue {
    icon: string,
    current: number,
    alt: string,
    require: any
}
interface StatusBoard {
    rank_first: StatusValue[],
    rank_second: StatusValue[],
    apfc: StatusValue[],
    fs: StatusValue[],
    total: number,
}
const showDetailStats = ref(false)
const initStatus = () => {
    for (const key of Object.keys(statusBoard)) {
        if (key === "total") statusBoard.total = 0;
        else {
            (statusBoard[key as keyof StatusBoard] as StatusValue[]).forEach(s => s.current = 0)
        }
    }
}
const calcStatusBoard = (score: Score) => {
    statusBoard.rank_first.forEach(status => {
        if (score.achievements >= status.require) {
            status.current++;
        }
    })
    statusBoard.rank_second.forEach(status => {
        if (score.achievements >= status.require) {
            status.current++;
        }
    })
    statusBoard.apfc.forEach(status => {
        if (conventFcFsStr(score.fc) === status.require) {
            status.current++;
        }
    })
    statusBoard.fs.forEach(status => {
        if (conventFcFsStr(score.fs) === status.require) {
            status.current++;
        }
    })
}
const statusBoard = reactive<StatusBoard>({
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
    total: 0
})
//advance feature
const showAdvanced = ref(false)
//auto import
const lazy_master_13 = () => {
    const song_list = getSongDataList.list;
    const result_score = new Set<string>([])
    const coll_index = UserCollectionList.findIndex(c => c.label == collectionStore.CurrentCollectionLabel);
    for (const song of song_list) {
        const difficulties = [...song.difficulties.standard, ...song.difficulties.dx];
        for (const diff of difficulties) {
            if (diff.level === "13") {
                result_score.add(`${song.id}_${diff.type}_${diff.level_index}`)
            }
        }
    }
    if (UserCollectionList[coll_index]) {
        UserCollectionList[coll_index].list = result_score;
        toast.success("导入成功，请重新刷新页面")
    }
}
//context menu
const handelRemoveScore = (score_id: string) => {
    if (removeFromCollection(score_id)) {
        initScoreList();
        toast.success("删除成功");
    } else {
        toast.error("删除失败");
    }
}
const getOtherCollections = computed(() => UserCollectionList.filter(c => c.label !== route.query.label))
const handelMoveToOtherCollection = (coll_label: string, score_id: string) => {
    if (pushScoreToCollection(coll_label, score_id)) {
        toast.success("添加成功")
    } else {
        toast.error("添加失败")
    }
}
</script>
