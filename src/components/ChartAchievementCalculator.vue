<template>
    <Dialog v-model:open="open">
        <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>达成率计算</DialogTitle>
                <DialogDescription>
                    总物量 {{ total }}，展示单个 Note 在达成率中所占的比例。
                </DialogDescription>
            </DialogHeader>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[480px] table-fixed text-center text-sm">
                    <thead class="border-b">
                        <tr>
                            <th class="p-2 text-left font-medium">
                                <Select v-model="mode">
                                    <SelectTrigger class="h-8 w-20 border-0 px-1 shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0+">0+</SelectItem>
                                        <SelectItem value="100-">100-</SelectItem>
                                        <SelectItem value="101-">101-</SelectItem>
                                    </SelectContent>
                                </Select>
                            </th>
                            <th class="p-2 font-medium">物量</th>
                            <th class="p-2 font-medium text-orange-500">PERFECT</th>
                            <th class="p-2 font-medium text-pink-500">GREAT</th>
                            <th class="p-2 font-medium text-green-600">GOOD</th>
                            <th class="p-2 font-medium text-muted-foreground">MISS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="note in notes" :key="note.key" class="border-b last:border-0">
                            <td class="p-2 text-left font-medium">{{ note.label }}</td>
                            <td class="p-2 tabular-nums">{{ note.value }}</td>
                            <td v-for="judgment in judgments" :key="judgment" class="p-2 tabular-nums">
                                <template v-if="note.key === 'touch' && note.value === 0">-</template>
                                <template v-else>
                                    <span v-for="(value, index) in calculate(note.key, judgment)" :key="index"
                                        :class="note.key === 'break' && judgment === 'perfect' && index === 0 ? 'text-yellow-500' : ''"
                                        class="block whitespace-nowrap">
                                        {{ value }}
                                    </span>
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p class="text-xs text-muted-foreground">
                该表格代表每个 Note 不同判定在达成率中所占的比例，结果仅供参考。
            </p>

            <!-- 达成率验证（可折叠） -->
            <Collapsible v-model:open="verifyOpen">
                <CollapsibleTrigger as-child>
                    <button
                        class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
                        <span>达成率验证</span>
                        <span class="text-muted-foreground text-xs">{{ verifyOpen ? '收起' : '展开' }}</span>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div class="mt-3 space-y-3">
                        <p class="text-xs text-muted-foreground">输入一个达成率，验证它在数学上是否能由合法判定组合产生。</p>
                        <div class="flex items-center gap-2">
                            <input
                                type="number"
                                v-model.number="verifyInput"
                                min="0"
                                max="101"
                                step="0.0001"
                                placeholder="如 100.9523"
                                class="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background tabular-nums"
                            />
                            <Button size="sm" :disabled="verifyLoading" @click="doVerify">
                                <span v-if="verifyLoading" class="flex items-center gap-1.5">
                                    <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    计算中
                                </span>
                                <span v-else>验证</span>
                            </Button>
                        </div>
                        <div v-if="verifyDone && !verifyLoading" class="rounded-md border px-3 py-2 text-sm flex items-center gap-2"
                            :class="verifyResult ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' : 'border-destructive bg-destructive/10 text-destructive'">
                            <span v-if="verifyResult">✓ 合法：该达成率存在对应的判定组合</span>
                            <span v-else>✗ 不合法：不存在任何判定组合能产生该达成率</span>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <!-- 绝赞分布计算（可折叠） -->
            <Collapsible v-model:open="breakCalcOpen">
                <CollapsibleTrigger as-child>
                    <button
                        class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
                        <span>绝赞分布计算</span>
                        <span class="text-muted-foreground text-xs">{{ breakCalcOpen ? '收起' : '展开' }}</span>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div class="mt-3 space-y-4">
                        <!-- 判定矩阵 -->
                        <div class="rounded-md border overflow-hidden">
                            <table class="w-full text-xs">
                                <thead>
                                    <tr class="bg-muted/50">
                                        <th class="px-2 py-1.5 text-left font-medium w-12">Note</th>
                                        <th class="px-1 py-1.5 font-medium text-yellow-500">CP</th>
                                        <th class="px-1 py-1.5 font-medium text-orange-400">PF</th>
                                        <th class="px-1 py-1.5 font-medium text-pink-500">GR</th>
                                        <th class="px-1 py-1.5 font-medium text-green-600">GD</th>
                                        <th class="px-1 py-1.5 font-medium text-muted-foreground">MS</th>
                                        <th class="px-2 py-1.5 font-medium text-muted-foreground">总计/物量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in matrixRows" :key="row.key"
                                        class="border-t">
                                        <td class="px-2 py-1 font-medium text-muted-foreground">{{ row.label }}</td>
                                        <td v-for="col in matrixCols" :key="col"
                                            class="px-1 py-1">
                                            <input
                                                type="number"
                                                min="0"
                                                :value="matrix[row.key][col]"
                                                @input="onMatrixInput(row.key, col, $event)"
                                                class="w-full min-w-0 rounded border px-1.5 py-0.5 text-center tabular-nums text-xs focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                                                :class="rowError(row.key) ? 'border-destructive' : ''"
                                            />
                                        </td>
                                        <td class="px-2 py-1 text-center tabular-nums">
                                            <span :class="rowError(row.key) ? 'text-destructive font-medium' : 'text-muted-foreground'">
                                                {{ rowSum(row.key) }} / {{ noteCount(row.key) }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- 错误提示 -->
                        <p v-if="hasMatrixError" class="text-xs text-destructive">
                            每行判定数之和必须等于对应 Note 物量
                        </p>

                        <!-- 目标达成率 + 计算按钮 -->
                        <div class="flex items-center gap-2">
                            <label class="text-xs text-muted-foreground shrink-0">目标达成率</label>
                            <input
                                type="number"
                                v-model.number="targetAchievement"
                                min="0"
                                max="101"
                                step="0.0001"
                                placeholder="如 100.9999"
                                class="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background tabular-nums"
                            />
                            <Button size="sm" :disabled="hasMatrixError" @click="doCalc">计算</Button>
                        </div>

                        <!-- 结果表 -->
                        <template v-if="calcResults.length > 0">
                            <div class="rounded-md border overflow-x-auto">
                                <table class="w-full text-xs text-center">
                                    <thead>
                                        <tr class="bg-muted/50 border-b">
                                            <th class="px-2 py-1.5 font-medium tabular-nums">达成率</th>
                                            <th class="px-1 py-1.5 font-medium text-orange-400">PF<br/><span class="font-normal text-muted-foreground">0.75</span></th>
                                            <th class="px-1 py-1.5 font-medium text-orange-400">PF<br/><span class="font-normal text-muted-foreground">0.5</span></th>
                                            <th class="px-1 py-1.5 font-medium text-pink-500">GR<br/><span class="font-normal text-muted-foreground">2000</span></th>
                                            <th class="px-1 py-1.5 font-medium text-pink-500">GR<br/><span class="font-normal text-muted-foreground">1500</span></th>
                                            <th class="px-1 py-1.5 font-medium text-pink-500">GR<br/><span class="font-normal text-muted-foreground">1250</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(r, i) in pagedResults" :key="i"
                                            class="border-t hover:bg-muted/30 transition-colors"
                                            :class="i === 0 && currentPage === 1 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''">
                                            <td class="px-2 py-1.5 tabular-nums font-medium">{{ r.achievement.toFixed(4) }}%</td>
                                            <td class="px-1 py-1.5 tabular-nums">{{ r.split.pf075 }}</td>
                                            <td class="px-1 py-1.5 tabular-nums">{{ r.split.pf050 }}</td>
                                            <td class="px-1 py-1.5 tabular-nums">{{ r.split.gr2000 }}</td>
                                            <td class="px-1 py-1.5 tabular-nums">{{ r.split.gr1500 }}</td>
                                            <td class="px-1 py-1.5 tabular-nums">{{ r.split.gr1250 }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- 分页 -->
                            <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-muted-foreground">
                                <span>共 {{ calcResults.length }} 条，第 {{ currentPage }}/{{ totalPages }} 页</span>
                                <div class="flex items-center gap-1">
                                    <button
                                        class="rounded px-2 py-1 hover:bg-accent disabled:opacity-40 transition-colors"
                                        :disabled="currentPage === 1"
                                        @click="currentPage--">上一页</button>
                                    <button
                                        class="rounded px-2 py-1 hover:bg-accent disabled:opacity-40 transition-colors"
                                        :disabled="currentPage === totalPages"
                                        @click="currentPage++">下一页</button>
                                </div>
                            </div>
                            <p v-else class="text-xs text-muted-foreground">共 {{ calcResults.length }} 条</p>
                        </template>
                        <p v-else-if="calcDone" class="text-xs text-muted-foreground text-center py-2">没有符合条件的结果</p>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/ui/collapsible'
import { Button } from '@/components/shadcn/ui/button'
import type { SongDifficultyAny } from '@/types/songs'
import {
    calcTotal, enumerateBreakSplits, sortByTarget,
    type JudgmentMatrix, type CalcResult, type NoteKey,
    BASIC_WEIGHT, BREAK_BONUS,
} from '@/utils/achievementCalc'
import VerifyWorker from '@/utils/achievementVerifyWorker?worker'

type Judgment = 'perfect' | 'great' | 'good' | 'miss'
type Mode = '0+' | '100-' | '101-'
type MatrixCol = 'cp' | 'pf' | 'gr' | 'gd' | 'ms'

const props = defineProps<{ difficulty: SongDifficultyAny }>()
const open = defineModel<boolean>('open', { default: false })
const mode = ref<Mode>('101-')

// ── 原有达成率表 ────────────────────────────────────────────────────────────────
const judgments: Judgment[] = ['perfect', 'great', 'good', 'miss']
const basic = BASIC_WEIGHT
const breakBonus = BREAK_BONUS

const notes = computed(() => [
    { key: 'tap'   as const, label: 'TAP',   value: props.difficulty.tap_num },
    { key: 'hold'  as const, label: 'HOLD',  value: props.difficulty.hold_num },
    { key: 'slide' as const, label: 'SLIDE', value: props.difficulty.slide_num },
    { key: 'touch' as const, label: 'TOUCH', value: props.difficulty.touch_num },
    { key: 'break' as const, label: 'BREAK', value: props.difficulty.break_num },
])
const total = computed(() => notes.value.reduce((sum, note) => sum + note.value * basic.perfect[note.key], 0))

const format = (value: number) => Number.isFinite(value) ? `${value.toFixed(4)}%` : '-'
const lossBase = () => (basic.perfect.break / total.value) * 100

function calculate(key: NoteKey, judgment: Judgment): string[] {
    if (!total.value || (key === 'break' && !props.difficulty.break_num)) return ['-']

    if (key === 'break' && judgment === 'perfect') {
        const critical = breakBonus.criticalPerfect / props.difficulty.break_num
        if (mode.value === '100-') return [format(critical), format(breakBonus.perfect[0] / props.difficulty.break_num), format(critical - breakBonus.perfect[1] / props.difficulty.break_num)]
        if (mode.value === '101-') return [format(0), ...breakBonus.perfect.map(value => format(value / props.difficulty.break_num - critical))]
        const base = lossBase()
        return [format(base + critical), ...breakBonus.perfect.map(value => format(base + value / props.difficulty.break_num))]
    }

    if (key === 'break' && judgment === 'great') {
        return basic.great.break.map(value => {
            const percentage = (value / total.value) * 100 + breakBonus.great / props.difficulty.break_num
            if (mode.value === '0+') return format(percentage)
            return format(percentage - lossBase() - (mode.value === '101-' ? breakBonus.criticalPerfect / props.difficulty.break_num : 0))
        })
    }

    const nonBreakKey = key as 'tap' | 'hold' | 'slide' | 'touch'
    let value = basic[judgment][nonBreakKey] as number
    let bonus = key === 'break' ? (judgment === 'good' ? breakBonus.good : 0) : 0
    if (mode.value !== '0+') {
        if (judgment === 'perfect') value = 0
        if (judgment === 'great') value = basic.perfect[nonBreakKey] - (basic.great[nonBreakKey] as number)
        if (judgment === 'good') {
            value = basic.perfect[nonBreakKey] - (basic.good[nonBreakKey] as number)
            if (key === 'break') bonus = mode.value === '101-' ? breakBonus.criticalPerfect - breakBonus.good : -breakBonus.good
        }
        if (judgment === 'miss') {
            value = basic.perfect[nonBreakKey]
            if (key === 'break' && mode.value === '101-') bonus = breakBonus.criticalPerfect
        }
    }

    let percentage = (value / total.value) * 100
    if (key === 'break') percentage += bonus / props.difficulty.break_num
    return [format(mode.value === '0+' ? percentage : -percentage)]
}

// ── 达成率验证 ────────────────────────────────────────────────────────────────
const verifyOpen = ref(false)
const verifyInput = ref<number>(101)
const verifyDone = ref(false)
const verifyResult = ref(false)
const verifyLoading = ref(false)

// Worker 单例（懒创建）
let _verifyWorker: Worker | null = null
function getVerifyWorker(): Worker {
    if (!_verifyWorker) {
        _verifyWorker = new VerifyWorker()
        _verifyWorker.onmessage = ({ data }: MessageEvent<{ type: string; payload: { valid: boolean } }>) => {
            if (data.type === 'result') {
                verifyResult.value = data.payload.valid
                verifyDone.value = true
                verifyLoading.value = false
            }
        }
    }
    return _verifyWorker
}

function doVerify() {
    verifyDone.value = false
    verifyLoading.value = true
    const counts = {
        tap: props.difficulty.tap_num,
        hold: props.difficulty.hold_num,
        slide: props.difficulty.slide_num,
        touch: props.difficulty.touch_num,
        break: props.difficulty.break_num,
    }
    getVerifyWorker().postMessage({ type: 'verify', payload: { achievement: verifyInput.value, counts } })
}

// ── 绝赞分布计算 ────────────────────────────────────────────────────────────────
const breakCalcOpen = ref(false)
const matrixRows = [
    { key: 'tap'   as const, label: 'TAP' },
    { key: 'hold'  as const, label: 'HOLD' },
    { key: 'slide' as const, label: 'SLIDE' },
    { key: 'touch' as const, label: 'TOUCH' },
    { key: 'break' as const, label: 'BREAK' },
]
const matrixCols: MatrixCol[] = ['cp', 'pf', 'gr', 'gd', 'ms']

function makeRow(cp = 0) { return { cp, pf: 0, gr: 0, gd: 0, ms: 0 } }
const matrix = reactive<JudgmentMatrix>({
    tap: makeRow(), hold: makeRow(), slide: makeRow(), touch: makeRow(), break: makeRow(),
})

function resetMatrix() {
    const d = props.difficulty
    Object.assign(matrix.tap,   makeRow(d.tap_num))
    Object.assign(matrix.hold,  makeRow(d.hold_num))
    Object.assign(matrix.slide, makeRow(d.slide_num))
    Object.assign(matrix.touch, makeRow(d.touch_num))
    Object.assign(matrix.break, makeRow(d.break_num))
    calcResults.value = []
    calcDone.value = false
    currentPage.value = 1
}

watch(open, (val) => { if (val) resetMatrix() })

const targetAchievement = ref<number>(101)
const calcResults = ref<CalcResult[]>([])
const calcDone = ref(false)
const currentPage = ref(1)
const PAGE_SIZE = 20

function noteCount(key: NoteKey): number {
    const map: Record<NoteKey, number> = {
        tap: props.difficulty.tap_num,
        hold: props.difficulty.hold_num,
        slide: props.difficulty.slide_num,
        touch: props.difficulty.touch_num,
        break: props.difficulty.break_num,
    }
    return map[key]
}

function rowSum(key: NoteKey): number {
    const r = matrix[key]
    return r.cp + r.pf + r.gr + r.gd + r.ms
}

function rowError(key: NoteKey): boolean {
    return rowSum(key) !== noteCount(key)
}

const hasMatrixError = computed(() => matrixRows.some(r => rowError(r.key)))

function onMatrixInput(key: NoteKey, col: MatrixCol, event: Event) {
    const raw = (event.target as HTMLInputElement).value
    const val = parseInt(raw, 10)
    matrix[key][col] = Number.isFinite(val) && val >= 0 ? val : 0
}

function doCalc() {
    if (hasMatrixError.value) return
    const t = calcTotal({
        tap: props.difficulty.tap_num,
        hold: props.difficulty.hold_num,
        slide: props.difficulty.slide_num,
        touch: props.difficulty.touch_num,
        break: props.difficulty.break_num,
    })
    const raw = enumerateBreakSplits(matrix, t, props.difficulty.break_num)
    calcResults.value = sortByTarget(raw, targetAchievement.value)
    calcDone.value = true
    currentPage.value = 1
}

const totalPages = computed(() => Math.max(1, Math.ceil(calcResults.value.length / PAGE_SIZE)))
const pagedResults = computed(() =>
    calcResults.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)
</script>
