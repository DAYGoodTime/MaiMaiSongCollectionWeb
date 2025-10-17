<template>
    <AdvanceFeature v-model:open="showAdvanced" @on-score-list-changed="initScoreList" />
    <DefineSortingTemplate>
        <Badge class="flex justify-between w-28 h-8 cursor-pointer" v-for="(order, index) in OrderBadges"
            @click="handleOrderStatus(order, index)">
            {{ order.label }}
            <ChevronDown v-if="order.status_index === 1" />
            <ChevronUp v-if="order.status_index === 2" />
        </Badge>
    </DefineSortingTemplate>
    <DefineSearchTemplate>
        <div class="relative w-full max-w-sm mx-auto items-center">
            <Input id="search" type="text" placeholder="搜索成绩..." class="pl-10" @update:model-value="onSearch"
                v-model:model-value="searchInput" />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Search class="size-6 text-muted-foreground" />
            </span>
            <span class="absolute end-0 inset-y-0 flex items-center justify-center px-3 cursor-pointer"
                @click="onReset">
                <X />
            </span>
        </div>
    </DefineSearchTemplate>
    <div class="px-4 py-4">
        <NavigationMenu class="border rounded-xl shadow bg-background mb-4">
            <NavigationMenuList class="flex md:gap-2 lg:gap-4 p-1">
                <NavigationMenuItem>
                    <NavigationMenuLink :class="cn('cursor-pointer', navigationMenuTriggerStyle())"
                        @click="toggleSidebar">
                        <PanelLeft slot="icon" />
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>排序方式</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div class="flex flex-col w-fit p-4 gap-y-4">
                            <ReuseSortingTemplate />
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink @click="showAdvanced = true"
                        :class="cn('cursor-pointer w-fit', navigationMenuTriggerStyle())">
                        批量导入
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
        <div :class="cn(isFilterExpended ? 'items-start' : 'items-stretch', 'flex gap-4 flex-wrap justify-center')"
            ref="panel">
            <Card class="flex-auto w-96">
                <CardHeader>
                    <CardTitle>合集: {{ CurrentCollectionLabel }}</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div>
                        <p class="text-sm font-semibold text-gray-400 mb-2">
                            双击卡片打开歌曲详情，右键可以进行删除等操作。悬浮在曲名上方可以呼出完整文本，点击文本可以直接复制</p>
                        <p class="text-sm font-semibold mb-2 text-red-600">没有数据源的情况下所有成绩都是隐藏的！需要筛选中启用‘未游玩成绩’</p>
                    </div>
                    <div>
                        <ReuseSearchTemplate />
                    </div>
                    <div>
                        <div class="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg">
                            <AdvanceFilter ref="AdvanceFilterRef" :model-value="AdvanceFilterForm" :show-trigger="true"
                                v-model:is-expanded="isFilterExpended"
                                @update:model-value="(filter) => onFilterUpdate(filter as AdvanceFilterFilters)" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <ScoreStatisticsCard class="w-96" ref="StatisticsBoardRef" />
        </div>
        <!-- 成绩列表 -->
        <ContextMenu>
            <ContextMenuTrigger @contextmenu="onContextMenuTrigger">
                <InfiniteScrollArea class="px-0 w-full my-8 rounded-xl border shadow hover:shadow-xl py-2"
                    :items="searchResults" :page-size="60">
                    <template #default="{ items }">
                        <div
                            class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 p-2 justify-items-center">
                            <div v-if="(isLoadingPage || isLoading) && items.length <= 20"
                                class="col-span-full flex justify-center items-center py-10">
                                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                            <template v-else>
                                <ScoreCard v-for="(card, _index) in items" :key="card.score_id" :score="card"
                                    class="transition-shadow rounded-xl shadow hover:shadow-xl bg-white/90"
                                    @copy="handelCopy" @db-click="onMenu" @right-click="onContextMenu" />

                                <p class="flex items-center text-center justify-center" v-if="isEmpty">暂无任何成绩捏~</p>
                            </template>
                        </div>
                        <!-- <Popover>
                            <PopoverTrigger>

                            </PopoverTrigger>
                            <PopoverContent>
                                <Textarea @update:model-value="onUpdateMessage" v-model="scoreMessage"
                                    placeholder="关于这个铺子的一些心得？" class="w-full" />
                            </PopoverContent>
                        </Popover> -->
                    </template>
                </InfiniteScrollArea>

            </ContextMenuTrigger>
            <ContextMenuContent :reference="ContextMenuTarget">
                <ContextMenuItem class="text-red-600" @click="handelRemoveScore(ContextMenuTargetScoreId)">
                    从合集中删除
                </ContextMenuItem>
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        添加至其它合集
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuItem
                            @click="() => handelMoveToOtherCollection(coll.label, ContextMenuTargetScoreId)"
                            v-for="coll in getOtherCollections">{{ coll.label }}
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
            </ContextMenuContent>
        </ContextMenu>
    </div>
    <CollectionFloatingNav :target="PanelRef">
        <template #other>
            <NavigationMenuItem>
                <NavigationMenuTrigger>排序方式</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <div class="flex flex-col w-fit p-4 gap-y-4">
                        <ReuseSortingTemplate />
                    </div>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <div>
                    <ReuseSearchTemplate />
                </div>
            </NavigationMenuItem>
            <NavigationMenuItem class="hidden md:block">
                <Popover>
                    <PopoverTrigger
                        class="w-max h-9 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent">
                        高级筛选</PopoverTrigger>
                    <PopoverContent class=" w-3/4 pr-0">
                        <AdvanceFilter class="h-96 !p-1" :model-value="AdvanceFilterForm" :show-trigger="false"
                            v-model:is-expanded="showAdvancedFilter"
                            @update:model-value="(filter) => onFilterUpdate(filter as AdvanceFilterFilters)" />
                    </PopoverContent>
                </Popover>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink @click="showAdvanced = true"
                    :class="cn('cursor-pointer w-fit', navigationMenuTriggerStyle())">
                    批量导入
                </NavigationMenuLink>
            </NavigationMenuItem>
        </template>
    </CollectionFloatingNav>

    <!-- Song Info Menu -->
    <Dialog v-model:open="openSongInfoMenu">
        <DialogContent class="lg:w-full">
            <DialogHeader>
                <DialogTitle>
                    <p>歌曲信息</p>
                    <p class="mt-4" v-if="SongInfoNoteDesigner">该难度谱师: <span class="cursor-pointer hover:opacity-50"
                            @click="handelCopy(SongInfoNoteDesigner, '已成功复制谱师到剪切板中')">{{ SongInfoNoteDesigner
                            }}</span>
                    </p>
                </DialogTitle>
            </DialogHeader>
            <SongInfo :song="SongInfoSong" :infoOnly="true" />
        </DialogContent>
    </Dialog>
</template>
<script setup lang="ts">
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/shadcn/ui/dialog'
import ScoreCard from '@/components/ScoreCard.vue';
import SongInfo from '@/components/SongInfo.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/shadcn/ui/popover';
import { Badge } from '@/components/shadcn/ui/badge';
import { Search, X, ChevronDown, ChevronUp, PanelLeft } from 'lucide-vue-next'
import { Input } from '@/components/shadcn/ui/input'
import { useCollectionStore } from '@/store/collections';
import type { MaiMaiSong, ScoreExtend, SongType } from '@/types/songs';
import { debounce, toFishStyleId, toLXNSStyleId, useCopyHelper, useRouterHelper } from '@/utils/functionUtil';
import { computed, onMounted, ref, toRaw, useTemplateRef, watch } from 'vue';
import { toast } from 'vue-sonner';

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
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle
} from "@/components/shadcn/ui/navigation-menu"
import type { Score } from '@/types/datasource';
import InfiniteScrollArea from '@/components/InfiniteScrollArea.vue';
import AdvanceFilter from '@/components/AdvanceFilter/AdvanceFilter.vue';
import type { AdvanceFilterFilters } from '@/types/component';
import ScoreStatisticsCard from '@/views/collection/component/ScoreStatisticsCard.vue';
import AdvanceFeature from './component/AdvanceFeature.vue';
import { type OrderBadge } from '@/types/component';
import { storeToRefs } from 'pinia';
import { createReusableTemplate } from '@vueuse/core';
import { cn } from '@/lib/utils';
import CollectionFloatingNav from './component/CollectionFloatingNav.vue';
import { useSidebar } from '@/components/shadcn/ui/sidebar';
import { useScores } from '@/store/datasources/scores';
import { useSongStore } from '@/store/datasources/song';
import { useScoreSearchWorker } from '@/utils/workerHelper';


const { route, backHome } = useRouterHelper()

const { getCollectionByLabel, removeFromCollection, pushScoreToCollection } = useCollectionStore()
const { CurrentCollectionLabel, UserCollectionList } = storeToRefs(useCollectionStore())
const { toggleSidebar } = useSidebar()
const PanelRef = useTemplateRef("panel")
const AdvanceFilterRef = useTemplateRef("AdvanceFilterRef")
const StatisticsBoardRef = useTemplateRef("StatisticsBoardRef")
const [DefineSortingTemplate, ReuseSortingTemplate] = createReusableTemplate()
const [DefineSearchTemplate, ReuseSearchTemplate] = createReusableTemplate()

//状态
const searchInput = ref("")
const searchValue = ref("")
const showAdvanced = ref(false)
const showAdvancedFilter = ref(true)
const supportPcCount = ref(false)
const isFilterExpended = ref(false)
const isLoadingPage = ref(true)

//Store
const SongStore = useSongStore()
const ScoreStore = useScores()

//排序
const OrderBadges = ref<OrderBadge[]>([
    { label: "达成率", value: "achievement", status_index: 2 },
    { label: "Dx Rating", value: "dx_rating", status_index: 0 },
    { label: "定数", value: "level", status_index: 0 },
    { label: "dx分", value: "dx_score", status_index: 0 },
])
const selectedOrder = ref<OrderBadge>(OrderBadges.value[0])

//高级过滤
const AdvanceFilterForm = ref<AdvanceFilterFilters>({
    difficulty: [],
    musicCategories: [],
    version: [],
    mapCategories: [],
    difficultyRange: [1.0, 15.0],
    dxScore: [],
    fullCombo: [],
    fullSync: [],
    Type: [],
    showUnplayed: false
})


//helper
const { searchResults, isLoading, updateIndex } = useScoreSearchWorker(searchValue, AdvanceFilterForm, selectedOrder)

//handler
const onSearch = debounce((val: string | number) => {
    searchValue.value = String(val)
}, 200);

const onReset = () => {
    searchInput.value = ""
    searchValue.value = ""
}

const handleOrderStatus = (_order: OrderBadge, index: number) => {
    OrderBadges.value.forEach((o, i) => {
        o.status_index = (i === index) ? (o.status_index === 2 ? 1 : o.status_index + 1) : 0;
    });
    selectedOrder.value = OrderBadges.value[index];
}

const onFilterUpdate = (filter: AdvanceFilterFilters) => {
    AdvanceFilterForm.value = filter;
}

const handelRemoveScore = (score_id: string) => {
    if (removeFromCollection(score_id)) {
        initScoreList();
        toast.success("删除成功");
    } else {
        toast.error("删除失败");
    }
}

const handelMoveToOtherCollection = (coll_label: string, score_id: string) => {
    if (pushScoreToCollection(coll_label, score_id)) {
        toast.success("添加成功")
    } else {
        toast.error("添加失败")
    }
}

const createUnplayedScore = (song: MaiMaiSong, song_type: SongType, level_index: number): Score => {
    const diff = song.difficulties[song_type].find(d => d.level_index === level_index);
    const diff_id = diff ? (("diff_id" in diff) ? diff.diff_id as number : song.id) : song.id;
    return {
        id: song.id,
        fish_id: toFishStyleId(song.id),
        song_name: song.title,
        level: diff ? diff.level : "0",
        diff_id,
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
    supportPcCount.value = false
    isLoadingPage.value = true;
    if (AdvanceFilterRef.value) {
        AdvanceFilterRef.value.resetAllFilters()
    }
    const coll = getCollectionByLabel(route.query.label as string)
    if (!coll) {
        toast.error("合集不存在", { position: "top-center" })
        backHome()
        return;
    }
    CurrentCollectionLabel.value = coll.label
    if (coll && StatisticsBoardRef.value) {
        StatisticsBoardRef.value.initStatistics();
        const result: ScoreExtend[] = [];
        let unplayedCount = 0;
        for (const level_str of coll.list) {
            const [diff_id, song_type, level_index_str] = level_str.split("_");
            if (!diff_id || !song_type || !level_index_str) continue;
            const song_id = toLXNSStyleId(Number(diff_id))
            const song = SongStore.getSong(song_id)
            if (!song) continue;

            const level_index = Number(level_index_str);
            let score = ScoreStore.getScoreByUni(song_type === "utage" ? Number(diff_id) : song_id, song_type as SongType, level_index);
            if (score) {
                StatisticsBoardRef.value.updateStatisticsBoard(score, song);
            } else {
                unplayedCount++;
                score = createUnplayedScore(song, song_type as SongType, level_index);
            }

            result.push({
                score: score,
                song: toRaw(song),
                score_id: level_str
            });
        }
        //更新索引
        updateIndex(result)
        supportPcCount.value = result.some(score =>
            score.score.play_count !== undefined || score.score.play_count === 0
        );
        const playCountIndex = OrderBadges.value.findIndex(o => o.value === "play_count");
        if (supportPcCount.value && playCountIndex === -1) {
            OrderBadges.value.push({ label: "游玩次数", value: "play_count", status_index: 0 });
        } else if (!supportPcCount.value && playCountIndex !== -1) {
            OrderBadges.value.splice(playCountIndex, 1);
        }
    }
    isLoadingPage.value = false
}

// computed
const getOtherCollections = computed(() => UserCollectionList.value.filter(c => c.label !== route.query.label))
const isEmpty = computed(() => searchResults.value.length === 0)

watch(() => route.query.label, () => {
    initScoreList()
})
onMounted(() => {
    initScoreList()
})
//ScoreCard Event
const { handelCopy } = useCopyHelper()
//menu
const openSongInfoMenu = ref(false)
const SongInfoNoteDesigner = ref("")
const SongInfoSong = ref<MaiMaiSong>({
    id: 0,
    title: '',
    artist: '',
    genre: '',
    bpm: 0,
    map: null,
    version: '',
    rights: null,
    aliases: [],
    disabled: false,
    difficulties: {
        standard: [],
        dx: [],
        utage: []
    },
    level_0: [],
    level_1: [],
    level_2: [],
    level_3: [],
    level_4: []
})
const onMenu = (_ref: HTMLDivElement | null, song: MaiMaiSong, noteDesigner: string) => {
    openSongInfoMenu.value = true
    SongInfoNoteDesigner.value = noteDesigner;
    SongInfoSong.value = song;
}
//context
const ContextMenuTarget = ref()
const ContextMenuTargetScoreId = ref("")
const onContextMenu = (_event: Event, ref: HTMLDivElement | null, score_id: string) => {
    ContextMenuTargetScoreId.value = score_id
    ContextMenuTarget.value = ref;
}
const onContextMenuTrigger = (e: PointerEvent) => {
    const target = (e.target as HTMLElement).closest('[data-component="ScoreCard"]')
    if (!target) {
        e.preventDefault()
    }
}
//Score message
// const scoreMessage = ref("")
// const scoreMessageValue = ref("")
// const onUpdateMessage = debounce((val: string | number) => {
//     scoreMessageValue.value = String(val)
// }, 200);
// const toggleDescMenu = () => {
//     const CollectionMessageMap = collectionStore.CollectionMessageMap;

//     const msgObj = CollectionMessageMap[props.score.score_id];
//     if (!msgObj) {
//         CollectionMessageMap[props.score.score_id] = { message: "" };
//     }

//     message.value = CollectionMessageMap[props.score.score_id].message;
//     openMenu.value = !openMenu.value;
// }
</script>
