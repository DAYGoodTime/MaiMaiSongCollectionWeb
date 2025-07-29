<template>
    <AdvanceFeature v-model:open="showAdvanced" />
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
                            @click="onReset">
                            <X />
                        </span>
                    </div>
                    <div>
                        <AdvanceFilter :model-value="{}"
                            @update:model-value="(filter) => onFilterUpdate(filter as AdvanceFilterFilters)" />
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
    </div>
    <ScoreStatisticsCard :status-board="statusBoard" />
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
import { debounce, toFishStyleId, useRouterHelper } from '@/utils/functionUtil';
import { computed, onBeforeMount, reactive, ref, shallowRef, watch } from 'vue';
import { toast } from 'vue-sonner';
import { conventFcFsStr, getSongDiff } from '@/utils/StrUtil';
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

import type { Score } from '@/types/datasource';
import InfiniteScrollArea from '@/components/InfiniteScrollArea.vue';
import AdvanceFilter from '@/components/AdvanceFilter.vue';
import type { AdvanceFilterFilters } from '@/types/component';
import type { StatusBoard, StatusValue } from '@/views/collection/component/ScoreStatisticsCard.vue';
import ScoreStatisticsCard from '@/views/collection/component/ScoreStatisticsCard.vue';
import AdvanceFeature from './component/AdvanceFeature.vue';
import { useScoreSearch, type OrderBadge } from '@/utils/songSearch';
const { route, backHome } = useRouterHelper()
const { getScore, getSongListAsMap } = useDataStore()
const { getCollectionByLabel, UserCollectionList, removeFromCollection, pushScoreToCollection } = useCollectionStore()
const collectionStore = useCollectionStore()
const rawCollection = ref<Collection>()
const scoreList = shallowRef<ScoreExtend[]>([])
const SONG_MAP = getSongListAsMap();


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
const { updateIndex, searchScore, orderBy, advanceFilter } = useScoreSearch()
const keyword = ref("")
const search = ref("")
const isEmpty = computed(() => filteredScoreList.value.length === 0)
const onReset = () => {
    keyword.value = ""
    search.value = ""
}
const onSearch = debounce((val: string | number) => {
    search.value = String(val)
}, 200);
const filteredScoreList = computed(() => {
    //reset Status
    initStatus();
    let result = searchScore(search.value)
    //advanced filter
    result = advanceFilter(AdvanceFilterForm.value, result)
    //order
    if (selectedOrder.value.status_index !== 0) {
        return orderBy(result, selectedOrder.value);
    }
    //async calStatus
    setTimeout(() => {
        result.forEach(score => {
            calcStatusBoard(score.score, score.song)
        });
    }, 1)
    statusBoard.total = result.length
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
        level_value: diff ? diff.level_value : 1.0,
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
                calcStatusBoard(score, song)
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
    updateIndex(scoreList.value)
}
watch(
    () => route.query.label,
    (_val, _preVal) => {
        initScoreList()
    }
)
onBeforeMount(() => {
    initScoreList();
})
//统计
const initStatus = () => {
    for (const key of Object.keys(statusBoard)) {
        if (key === "total") statusBoard.total = 0;
        else if (key === "noteDesigners") statusBoard.noteDesigners.clear();
        else {
            (statusBoard[key as keyof StatusBoard] as StatusValue[]).forEach(s => s.current = 0)
        }
    }
}
const calcStatusBoard = (score: Score, song: MaiMaiSong) => {
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
    const diff = getSongDiff(song, score)
    const noteDesigner = diff ? diff.note_designer : ""
    const map = statusBoard.noteDesigners;
    if (noteDesigner.length > 1) {
        if (map.has(noteDesigner)) {
            map.set(noteDesigner, map.get(noteDesigner) as number + 1)
        } else {
            map.set(noteDesigner, 1)
        }
    }
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
    noteDesigners: new Map<string, number>(),
    total: 0
})
//advance feature
const AdvanceFilterForm = ref<AdvanceFilterFilters>({
    difficulty: [],
    musicCategories: [],
    version: [],
    mapCategories: [],
    difficultyRange: [1.0, 15.0],
    fullCombo: [],
    fullSync: [],
    Type: [],
    showUnplayed: false
})
const showAdvanced = ref(false)
const onFilterUpdate = (filter: AdvanceFilterFilters) => {
    AdvanceFilterForm.value = filter;
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
