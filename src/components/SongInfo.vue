<template>
    <Card class="mb-6 shadow-lg backdrop-blur-md rounded-xl overflow-hidden transition-colors duration-300"
        :style="cardStyle">
        <CardContent class="p-4">
            <!-- 基本信息区 -->
            <div class="flex gap-4 mb-4">
                <!-- 封面 -->
                <div class="flex-shrink-0">
                    <div class="text-xs font-mono text-muted-foreground mb-1 cursor-pointer hover:opacity-60 select-none"
                        @click="() => handelCopy(currentStyleId, '已成功复制歌曲id到剪切板中')">
                        #{{ currentStyleId }}
                    </div>
                    <CoverImage :id="song.id" alt="歌曲封面" class="w-28 h-28 rounded-xl object-cover shadow-md" />
                </div>
                <!-- 详情 -->
                <div class="flex-1 min-w-0">
                    <!-- overflow-hidden 在父容器，子元素做位移动画 -->
                    <div class="overflow-hidden mb-2">
                        <h2 v-overflow-scroll
                            class="scroll-text text-xl font-extrabold tracking-tight cursor-pointer hover:opacity-60"
                            @click="() => handelCopy(song.title, '已成功复制歌曲名到剪切板中')">
                            {{ song.title }}
                        </h2>
                    </div>
                    <div class="rounded-lg bg-muted/50 px-3 py-2 space-y-1.5 text-sm">
                        <div v-for="info in infoRows" :key="info.label" class="flex items-center gap-2">
                            <span class="w-1 h-3.5 rounded-full flex-shrink-0 transition-colors duration-300"
                                :style="{ background: `hsl(var(${currentDiffVar}))` }"></span>
                            <span class="text-muted-foreground flex-shrink-0">{{ info.label }}</span>
                            <!-- overflow-hidden 父容器做视口裁剪，子元素做位移 -->
                            <div class="flex-1 min-w-0 overflow-hidden">
                                <span v-overflow-scroll class="scroll-text font-medium">{{ info.value }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 难度 tabs + 类型/数据源切换 -->
            <div v-if="!infoOnly">
                <!-- 标准/DX/宴会场 切换 + 数据源 -->
                <div class="flex items-center justify-between gap-2 mb-3">
                    <!-- 占位 div 始终存在，保持 justify-between 布局稳定 -->
                    <div class="flex gap-2">
                        <template v-if="availableTypeList.length > 1">
                            <Button v-for="type in availableTypeList" :key="type.value" size="sm"
                                :variant="isSelectedType(type.value) ? 'default' : 'outline'"
                                @click="SelectedType = type.value">
                                {{ type.label }}
                            </Button>
                        </template>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-muted-foreground">数据源:</span>
                        <Select :disabled="ScoreStore.getSelectableSource.length === 0"
                            :model-value="ScoreStore.selectedSource" @update:model-value="handelDataSourceSwitch">
                            <SelectTrigger class="w-32 h-8">
                                <SelectValue placeholder="数据源" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectLabel>成绩数据源选择</SelectLabel>
                                <SelectItem :value="ds" v-for="ds in ScoreStore.getSelectableSource" :key="ds">
                                    {{ ds }}
                                </SelectItem>
                                <SelectItem v-if="ScoreStore.getSelectableSource.length === 0" value="empty">
                                    没有可用数据源
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <!-- 难度 tabs -->
                <div class="flex gap-2 mb-4">
                    <button v-for="(diff, idx) in currentDifficulties" :key="idx"
                        class="flex-1 rounded-xl py-2 px-1 text-center transition-all duration-200 border-2 cursor-pointer select-none"
                        :style="diffTabStyle(idx, diff)" @click="selectedDiffIndex = idx">
                        <div class="text-xs font-bold leading-tight">{{ diffLabel(diff) }}</div>
                        <div class="text-sm font-extrabold leading-tight mt-0.5">{{ diff.level }}</div>
                    </button>
                </div>

                <!-- 当前难度详情 -->
                <div v-if="currentDiff" class="space-y-3 mb-3">
                    <!-- 谱面数据面板 -->
                    <div class="rounded-xl p-3 transition-colors duration-300"
                        :style="{ background: `hsl(var(${currentDiffVar}) / 0.12)` }">
                        <!-- 官方定数 / 拟合难度 / 谱师 / 平均达成 -->
                        <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                            <div>
                                <div class="text-muted-foreground text-xs flex items-center gap-1">
                                    <span class="w-0.5 h-3 rounded-full inline-block"
                                        :style="{ background: `hsl(var(${currentDiffVar}))` }"></span>
                                    官方定数
                                </div>
                                <div class="text-lg font-extrabold" :style="{ color: `hsl(var(${currentDiffVar}))` }">
                                    {{ formatLevelValue(currentDiff.difficulty.level_value) }}
                                </div>
                            </div>
                            <div v-if="currentDiff.chartStat">
                                <div class="text-muted-foreground text-xs flex items-center gap-1">
                                    <span class="w-0.5 h-3 rounded-full inline-block"
                                        :style="{ background: `hsl(var(${currentDiffVar}))` }"></span>
                                    拟合难度
                                </div>
                                <div class="text-lg font-extrabold" :style="{ color: `hsl(var(${currentDiffVar}))` }">
                                    {{ currentDiff.chartStat.fit_diff.toFixed(2) }}
                                </div>
                            </div>
                            <div
                                v-if="currentDiff.difficulty.note_designer && currentDiff.difficulty.note_designer !== '-'">
                                <div class="text-muted-foreground text-xs flex items-center gap-1">
                                    <span class="w-0.5 h-3 rounded-full inline-block"
                                        :style="{ background: `hsl(var(${currentDiffVar}))` }"></span>
                                    谱面谱师
                                </div>
                                <div class="text-base font-bold cursor-pointer hover:opacity-60"
                                    :style="{ color: `hsl(var(${currentDiffVar}))` }"
                                    @click="handelCopy(currentDiff.difficulty.note_designer, '已成功复制谱师到剪切板中')">
                                    {{ currentDiff.difficulty.note_designer }}
                                </div>
                            </div>
                            <div v-if="currentDiff.chartStat">
                                <div class="text-muted-foreground text-xs flex items-center gap-1">
                                    <span class="w-0.5 h-3 rounded-full inline-block"
                                        :style="{ background: `hsl(var(${currentDiffVar}))` }"></span>
                                    平均达成
                                </div>
                                <div class="text-base font-bold" :style="{ color: `hsl(var(${currentDiffVar}))` }">
                                    {{ currentDiff.chartStat.avg.toFixed(2) }}%
                                </div>
                            </div>
                        </div>
                        <!-- Note 计数 -->
                        <div class="grid grid-cols-5 gap-1 text-center text-xs">
                            <div v-for="note in currentDiff.notes" :key="note.label"
                                class="rounded-lg py-1.5 bg-white/40 dark:bg-white/15 backdrop-blur-sm">
                                <div class="text-muted-foreground font-medium"
                                    :style="{ color: `hsl(var(${currentDiffVar}))` }">{{
                                        note.label }}</div>
                                <div class="font-extrabold text-sm" :style="{ color: `hsl(var(${currentDiffVar}))` }">{{
                                    note.value }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 玩家最佳成绩 -->
                    <div class="rounded-xl border bg-card p-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-base font-semibold text-muted-foreground">玩家最佳成绩</span>
                        </div>
                        <template v-if="currentDiff.score">
                            <div class="flex items-center gap-3 mb-2">
                                <img class="w-20" :src="getAchievementIcon(currentDiff.score.rate_type)"
                                    loading="lazy" />
                                <div class="text-3xl font-extrabold" :style="{ color: `hsl(var(${currentDiffVar}))` }">
                                    {{ currentDiff.score.achievements.toFixed(4) }}%
                                </div>
                            </div>
                            <div class="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <span>Rating: <span class="font-bold text-foreground text-base">{{
                                    formatDxRating(currentDiff.score.dx_rating) }}</span></span>
                                <span v-if="ScoreStore.isSupportPlayCount">PC: <span
                                        class="font-bold text-foreground text-base">{{ currentDiff.playcount
                                        }}</span></span>
                            </div>
                            <div class="flex items-center gap-4 mb-3">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-sm text-muted-foreground">连击:</span>
                                    <img class="h-8 w-8" :src="getFCFSIcon(conventFcFsStr(currentDiff.score.fc))" />
                                    <span class="font-semibold text-sm">{{ fcLabel(currentDiff.score.fc) }}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-sm text-muted-foreground">同步:</span>
                                    <img class="h-8 w-8" :src="getFCFSIcon(conventFcFsStr(currentDiff.score.fs))" />
                                    <span class="font-semibold text-sm"
                                        :style="{ color: `hsl(var(${currentDiffVar}))` }">{{
                                            fsLabel(currentDiff.score.fs) }}</span>
                                </div>
                            </div>
                        </template>
                        <div v-else class="text-sm text-muted-foreground py-2">暂无游玩记录</div>
                    </div>
                </div>
            </div>

            <!-- 曲目别名 + 更多信息 -->
            <div class="mt-3 space-y-2">
                <div v-if="song.aliases && song.aliases.length">
                    <span class="text-muted-foreground text-xs">曲目别名</span>
                    <div class="flex flex-wrap gap-2 mt-1 max-h-24 overflow-y-auto">
                        <Badge v-for="(alia, index) in song.aliases" :key="index" variant="outline"
                            class="text-xs cursor-pointer hover:opacity-60"
                            @click="() => handelCopy(alia as string, '已成功复制别名到剪切板中')">
                            {{ alia }}
                        </Badge>
                    </div>
                </div>
                <div v-if="getCurrentDiffTags">
                    <span class="text-muted-foreground text-xs">铺面标签:</span>
                    <DiffTagInfo :tag-info="getCurrentDiffTags"></DiffTagInfo>
                </div>
                <div v-if="!infoOnly && currentDiff">
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button size="lg" class="w-full text-white font-bold shadow-md transition-all"
                                :style="gradientButtonStyle">
                                更多信息
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" class="w-48">
                            <DropdownMenuItem @click="emit('menu', song, currentDiff.difficulty)">
                                查看标签
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>添加进合集</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem v-for="coll in getCollectionNames" :key="coll"
                                        @click="addScoreToCollection(coll, currentDiff.difficulty, !!currentDiff.score)">
                                        {{ coll }}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import CoverImage from '@/components/CoverImage.vue'
import { SelectItem, SelectLabel, SelectTrigger, Select, SelectValue, SelectContent } from './shadcn/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './shadcn/ui/dropdown-menu'
import DiffTagInfo from '@/components/DiffTagInfo.vue';
import type { MaiMaiSong, SongDifficulty, SongDifficultyAny, SongDifficultyUtage, SongType } from '@/types/songs'
import { computed, onMounted, reactive, ref, watch, type Directive } from 'vue'
import { useCopyHelper } from '@/utils/functionUtil'
import type { AcceptableValue } from 'reka-ui'
import type { DataSourceType } from '@/types/datasource'
import { useScores } from '@/store/datasources/scores'
import { useCollectionStore } from '@/store/collections'
import { useChartData } from '@/store/chartStats'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import {
    conventFcFsStr, formatDxRating, formatLevelValue,
    getTotalDxScore
} from '@/utils/StrUtil'
import { getFCFSIcon, getAchievementIcon, getDxScoreIcon } from '@/utils/urlUtils'
import { toFishStyleId } from '@/utils/functionUtil'
import { getDiffTag } from '@/utils/tagUtils'

const DIFF_NAMES = ['Basic', 'Advan', 'Expert', 'Master', 'Re:Mas']
const DIFF_VARS = ['--BASIC', '--ADVANCED', '--EXPERT', '--MASTER', '--REMASTER']

const ScoreStore = useScores()
const ChartStore = useChartData()
const { song, infoOnly, initialDiffIndex = 3 } = defineProps<{
    song: MaiMaiSong,
    infoOnly?: boolean,
    initialDiffIndex?: number
}>()

const emit = defineEmits<{
    (e: 'menu', song: MaiMaiSong, diff: SongDifficultyAny): void
}>()

const SelectedType = defineModel<SongType>('selectedType', { default: 'standard' })
const selectedDiffIndex = defineModel<number>('selectedDiffIndex', { default: 3 })

const hasType = reactive({ standard: false, dx: false, utage: false })
const typeList = [
    { value: 'standard', label: '标准' },
    { value: 'dx', label: 'DX' },
    { value: 'utage', label: '宴会场' },
] as const
type TypeValue = typeof typeList[number]['value']
const availableTypeList = ref<{ value: TypeValue; label: string }[]>([])

const isSelectedType = (type: TypeValue) => type === SelectedType.value

const currentStyleId = computed(() =>
    String(ScoreStore.showCurrentStyleId(song.id, SelectedType.value))
)

const currentDifficulties = computed<SongDifficulty[]>(() => {
    if (SelectedType.value === 'utage') return song.difficulties.utage as SongDifficulty[]
    return (song.difficulties[SelectedType.value] as SongDifficulty[]) ?? []
})

const currentDiff = computed(() => {
    const difficulty = currentDifficulties.value[selectedDiffIndex.value]
    if (!difficulty) return null
    const isUtage = difficulty.type === 'utage'
    const diff_id = isUtage && 'diff_id' in difficulty ? (difficulty as SongDifficultyUtage).diff_id : song.id
    const score = ScoreStore.getScoreByUni(diff_id, difficulty.type, difficulty.level_index)
    const totalDxScore = getTotalDxScore(difficulty)
    const currentDxScore = score ? score.dx_score : 0
    const dxScoreIcon = getDxScoreIcon(currentDxScore, totalDxScore)
    // chart stats (divingfish, independent of selected score source)
    const fishId = toFishStyleId(song.id, difficulty.type)
    const chartStat = ChartStore.getDiffChartData(fishId, difficulty.level_index)
    const notes = [
        { label: 'TAP', value: difficulty.tap_num },
        { label: 'HOLD', value: difficulty.hold_num },
        { label: 'SLIDE', value: difficulty.slide_num },
        { label: 'BREAK', value: difficulty.break_num },
        { label: 'TOUCH', value: difficulty.touch_num },
    ]
    return {
        difficulty,
        score,
        isUtage,
        chartStat,
        notes,
        levelDisplay: isUtage ? difficulty.level : formatLevelValue(difficulty.level_value),
        dxScore: {
            total: totalDxScore,
            current: currentDxScore,
            available: dxScoreIcon != null,
            icon: dxScoreIcon ?? '',
        },
        playcount: score ? score.play_count : 0,
        raw: difficulty
    }
})

const fcLabel = (fc: string | null | undefined) => {
    if (!fc) return '-'
    const map: Record<string, string> = { fc: 'FC', fcp: 'FC+', ap: 'AP', app: 'AP+' }
    return map[fc] ?? '-'
}
const fsLabel = (fs: string | null | undefined) => {
    if (!fs) return '-'
    const map: Record<string, string> = { sync: 'SYNC', fs: 'FS', fsp: 'FS+', fsd: 'FSD', fsdp: 'FSD+' }
    return map[fs] ?? 'SYNC'
}

const currentDiffVar = computed(() => {
    if (SelectedType.value === 'utage') return '--UTAGE'
    const diff = currentDifficulties.value[selectedDiffIndex.value]
    return DIFF_VARS[diff?.level_index ?? 3] ?? '--MASTER'
})

const cardStyle = computed(() => ({
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: `hsl(var(${currentDiffVar.value}) / 0.45)`,
}))

const gradientButtonStyle = computed(() => ({
    background: `linear-gradient(135deg, hsl(var(${currentDiffVar.value})) 0%, hsl(var(${currentDiffVar.value}) / 0.6) 100%)`,
    borderColor: `hsl(var(${currentDiffVar.value}))`,
}))

const diffTabStyle = (idx: number, diff: SongDifficulty) => {
    const varName = SelectedType.value === 'utage' ? '--UTAGE' : (DIFF_VARS[diff.level_index] ?? '--MASTER')
    const selected = idx === selectedDiffIndex.value
    return selected
        ? {
            background: `linear-gradient(160deg, hsl(var(${varName})) 0%, hsl(var(${varName}) / 0.7) 100%)`,
            borderColor: `hsl(var(${varName}))`,
            color: 'white',
        }
        : { borderColor: `hsl(var(${varName}) / 0.5)`, color: `hsl(var(${varName}))`, background: 'transparent' }
}

const diffLabel = (diff: SongDifficulty) => {
    if (SelectedType.value === 'utage') return (diff as SongDifficultyUtage).kanji ?? 'U'
    return DIFF_NAMES[diff.level_index] ?? String(diff.level_index)
}

const infoRows = computed(() => {
    const rows = [
        { label: '类别', value: song.genre },
        { label: 'BPM', value: String(song.bpm) },
        { label: '版本', value: song.version },
        { label: '曲师', value: song.artist },
    ]
    if (song.map) rows.splice(3, 0, { label: '区域', value: song.map })
    return rows
})

const handelDataSourceSwitch = (ds: AcceptableValue) => {
    ScoreStore.switchDataSource(ds as DataSourceType)
}

const getCurrentDiffTags = computed(() => {
    if (!currentDiff.value) return []
    return getDiffTag(song.title, currentDiff.value.raw.level_index, currentDiff.value.raw.type)
})

// collection
const { pushScoreToCollection } = useCollectionStore()
const { getCollectionNames } = storeToRefs(useCollectionStore())
function addScoreToCollection(label: string, diff: SongDifficulty | SongDifficultyUtage, hasScore: boolean) {
    const diff_id = diff.type === 'utage' ? (diff as SongDifficultyUtage).diff_id : song.id
    if (!hasScore) {
        toast.warning('该难度暂无游玩记录，将以「未游玩」状态添加进合集，并且默认不展示', { position: 'top-center' })
    }
    if (pushScoreToCollection(label, `${diff_id}_${diff.type}_${diff.level_index}`)) {
        toast.success('添加成功')
    } else {
        toast.error('添加失败,已经在集合当中')
    }
}

const init = () => {
    availableTypeList.value = []
    hasType.standard = Array.isArray(song.difficulties.standard) && song.difficulties.standard.length > 0
    hasType.dx = Array.isArray(song.difficulties.dx) && song.difficulties.dx.length > 0
    hasType.utage = Array.isArray(song.difficulties.utage) && song.difficulties.utage.length > 0
    let selected = false
    if (hasType.standard) {
        SelectedType.value = 'standard'; selected = true
        availableTypeList.value.push(typeList[0])
    }
    if (hasType.dx) {
        if (!selected) SelectedType.value = 'dx'
        selected = true
        availableTypeList.value.push(typeList[1])
    }
    if (hasType.utage) {
        if (!selected) SelectedType.value = 'utage'
        availableTypeList.value.push(typeList[2])
    }
    // ponytail: use prop or clamp to available range
    const targetIdx = Math.min(initialDiffIndex, currentDifficulties.value.length - 1)
    selectedDiffIndex.value = Math.max(0, targetIdx)
}

watch(() => song, init, { immediate: true })
watch(() => SelectedType.value, () => {
    const len = currentDifficulties.value.length
    if (selectedDiffIndex.value >= len) selectedDiffIndex.value = Math.max(0, len - 1)
})
onMounted(init)

const { handelCopy } = useCopyHelper()

// v-overflow-scroll: 与父容器宽度比较，检测溢出后自动播放弹幕动画
const vOverflowScroll: Directive<HTMLElement> = {
    mounted(el) {
        const check = () => {
            const parentWidth = el.parentElement?.clientWidth ?? 0
            const overflow = el.scrollWidth - parentWidth
            if (overflow > 0) {
                el.style.setProperty('--scroll-dist', `-${overflow}px`)
                el.classList.add('is-overflowing')
            } else {
                el.style.removeProperty('--scroll-dist')
                el.classList.remove('is-overflowing')
            }
        }
        check()
        const ro = new ResizeObserver(check)
        ro.observe(el)
        // 父容器变宽/变窄时也需要重算
        if (el.parentElement) ro.observe(el.parentElement)
            ; (el as any).__ro = ro
    },
    unmounted(el) {
        ; (el as any).__ro?.disconnect()
    },
}
</script>

<style scoped>
/*
  弹幕式：停顿 → 匀速滚到末尾 → 停顿 → 瞬回起点
  父容器负责 overflow:hidden，.scroll-text 本身不裁剪。
*/
@keyframes marquee {
    0% {
        transform: translateX(0);
    }

    20% {
        transform: translateX(0);
    }

    70% {
        transform: translateX(var(--scroll-dist, 0px));
    }

    90% {
        transform: translateX(var(--scroll-dist, 0px));
    }

    90.001% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(0);
    }
}

.scroll-text {
    display: inline-block;
    white-space: nowrap;
}

.scroll-text.is-overflowing {
    animation: marquee 5s linear infinite;
}
</style>
