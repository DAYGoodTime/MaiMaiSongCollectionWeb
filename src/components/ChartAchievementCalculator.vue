<template>
    <Dialog v-model:open="open">
        <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-xl">
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
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import type { SongDifficultyAny } from '@/types/songs'

type NoteKey = 'tap' | 'hold' | 'slide' | 'touch' | 'break'
type Judgment = 'perfect' | 'great' | 'good' | 'miss'
type Mode = '0+' | '100-' | '101-'

const props = defineProps<{ difficulty: SongDifficultyAny }>()
const open = defineModel<boolean>('open', { default: false })
const mode = ref<Mode>('101-')

const judgments: Judgment[] = ['perfect', 'great', 'good', 'miss']
const basic = {
    perfect: { tap: 1, hold: 2, slide: 3, touch: 1, break: 5 },
    great: { tap: 0.8, hold: 1.6, slide: 2.4, touch: 0.8, break: [4, 3, 2.5] },
    good: { tap: 0.5, hold: 1, slide: 1.5, touch: 0.5, break: 2 },
    miss: { tap: 0, hold: 0, slide: 0, touch: 0, break: 0 },
} as const
const breakBonus = { criticalPerfect: 1, perfect: [0.75, 0.5], great: 0.4, good: 0.3 }

const notes = computed(() => [
    { key: 'tap' as const, label: 'TAP', value: props.difficulty.tap_num },
    { key: 'hold' as const, label: 'HOLD', value: props.difficulty.hold_num },
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

    let value = basic[judgment][key] as number
    let bonus = key === 'break' ? (judgment === 'good' ? breakBonus.good : 0) : 0
    if (mode.value !== '0+') {
        if (judgment === 'perfect') value = 0
        if (judgment === 'great') value = basic.perfect[key] - (basic.great[key] as number)
        if (judgment === 'good') {
            value = basic.perfect[key] - (basic.good[key] as number)
            if (key === 'break') bonus = mode.value === '101-' ? breakBonus.criticalPerfect - breakBonus.good : -breakBonus.good
        }
        if (judgment === 'miss') {
            value = basic.perfect[key]
            if (key === 'break' && mode.value === '101-') bonus = breakBonus.criticalPerfect
        }
    }

    let percentage = (value / total.value) * 100
    if (key === 'break') percentage += bonus / props.difficulty.break_num
    return [format(mode.value === '0+' ? percentage : -percentage)]
}
</script>
