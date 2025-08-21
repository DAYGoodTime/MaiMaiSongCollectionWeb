<template>
    <slot name="trigger">
        <div v-if="showTrigger" class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            @click="isExpanded = !isExpanded">
            <h3 class="text-lg font-medium text-gray-900">高级筛选设置</h3>
            <ChevronUp v-if="isExpanded" :size="20" />
            <ChevronDown v-else :size="20" />
        </div>
    </slot>
    <slot name="default">
        <div v-if="isExpanded" class="p-4 border-t border-gray-200 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 筛选难度 -->
                <div>
                    <Label class="block text-sm font-medium text-gray-700 mb-2">
                        筛选难度
                    </Label>
                    <MultiSelectTags :options="difficultyOptions" :selected="filters.difficulty"
                        @selection-change="(selected) => updateFilters({ difficulty: selected })" placeholder="请选择难度">
                        <template #option-item="{ option }">
                            <div class="flex justify-between items-center gap-1">
                                <div :class="getLevelClass(option.value)"></div>
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                        <template #selected-item="{ item }">
                            <div class="flex justify-between items-center gap-1">
                                <div :class="getLevelClass(item.value)"></div>
                                <span>{{ item.label }}</span>
                            </div>
                        </template>
                    </MultiSelectTags>
                </div>

                <!-- 筛选乐曲分类 -->
                <div>
                    <Label class="block text-sm font-medium text-gray-700 mb-2">
                        筛选乐曲分类
                    </Label>
                    <MultiSelectTags :options="musicCategoryOptions" :selected="filters.musicCategories"
                        @selection-change="(selected) => updateFilters({ musicCategories: selected })"
                        placeholder="请选择乐曲分类" />
                </div>

                <!-- 筛选版本 -->
                <div>
                    <Label class="block text-sm font-medium text-gray-700 mb-2">
                        筛选版本
                    </Label>
                    <MultiSelectTags :options="versionOptions" :selected="filters.version"
                        @selection-change="(selected) => updateFilters({ version: selected })" placeholder="请选择版本" />
                </div>

                <!-- 筛选上传时间 -->
                <div>
                    <Label class="block text-sm font-medium text-gray-700 mb-2">
                        筛选区域
                    </Label>
                    <MultiSelectTags :options="mapCategoryOptions" :selected="filters.mapCategories"
                        @selection-change="(selected) => updateFilters({ mapCategories: selected })"
                        placeholder="请选择归属区域" />
                </div>
            </div>

            <!-- 筛选谱面定数 -->
            <div class="w-96">
                <Label class="block text-sm font-medium text-gray-700 mb-3">
                    筛选谱面定数 <span class="text-xs font-light">滑块可以快速选定常用的定数范围，如果需要其他范围，可以从左右两边手动输入你想要的定数</span>
                </Label>
                <div class="flex items-center space-x-4 pt-2">
                    <Input type="number" :step="0.1" :min="1.0" :max="filters.difficultyRange[1]"
                        class="w-12 text-center h-8 text-xs pr-0 pl-1"
                        :model-value="filters.difficultyRange[0].toFixed(1)"
                        @update:model-value="handleRangeChange($event, 0)" />
                    <Slider :model-value="filters.difficultyRange"
                        @update:model-value="(value) => updateFilters({ difficultyRange: value as [number, number] || [1.0, 15.0] })"
                        :min="12.0" :max="15.0" :step="0.1" :show-min-max="false" :show-ticks="true" class="flex-1" />
                    <Input type="number" :step="0.1" :min="filters.difficultyRange[0]" :max="15.0"
                        class="w-12 text-center h-8 text-xs pr-0 pl-1"
                        :model-value="filters.difficultyRange[1].toFixed(1)"
                        @update:model-value="handleRangeChange($event, 1)" />
                </div>
            </div>

            <!-- 筛选 FULL COMBO -->
            <div>
                <Label class="block text-sm font-medium text-gray-700 mb-2">
                    筛选 FULL COMBO
                </Label>
                <MultiSelectButtons :options="fullComboOptions" :selected="filters.fullCombo"
                    @selection-change="(selected) => updateFilters({ fullCombo: selected })" />
            </div>

            <!-- 筛选 FULL SYNC -->
            <div>
                <Label class="block text-sm font-medium text-gray-700 mb-2">
                    筛选 FULL SYNC
                </Label>
                <MultiSelectButtons :options="fullSyncOptions" :selected="filters.fullSync"
                    @selection-change="(selected) => updateFilters({ fullSync: selected })" />
            </div>

            <!-- 筛选谱面类型 -->
            <div>
                <Label class="block text-sm font-medium text-gray-700 mb-2">
                    筛选谱面类型
                </Label>
                <MultiSelectButtons :options="TypeOptions" :selected="filters.Type"
                    @selection-change="(selected) => updateFilters({ Type: selected })" />
            </div>

            <!-- 底部控制 -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div class="flex items-center space-x-3">
                    <Label class="flex items-center space-x-2 cursor-pointer">
                        <Checkbox :model-value="filters.showUnplayed"
                            @update:model-value="(checked: boolean | 'indeterminate') => updateFilters({ showUnplayed: checked === 'indeterminate' ? false : checked })" />
                        <span class="text-sm text-gray-700">显示未游玩谱面</span>
                    </Label>
                </div>
                <Button @click="resetAllFilters" variant="outline"
                    class="flex items-center space-x-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <RotateCcw :size="16" />
                    <span>重置筛选条件</span>
                </Button>
            </div>
        </div>
    </slot>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-vue-next'
import { Label } from '@/components/shadcn/ui/label'
import { Button } from '@/components/shadcn/ui/button'
import { Checkbox } from '@/components/shadcn/ui/checkbox'
import { Input } from '@/components/shadcn/ui/input'
import MultiSelectButtons from '@/components/MultiSelectButtons.vue'
import MultiSelectTags from '@/components/MultiSelectTags.vue'
import Slider from '@/components/shadcn/ui/slider/Slider.vue'
import type { AdvanceFilterEmits, AdvanceFilterProps, AdvanceFilterFilters, FilterProps } from '@/types/component'
import { SongGenreList, SongMapList, SongVersionList } from '@/utils/StrUtil'


// Model
const props = defineProps<AdvanceFilterProps>()

// Emits
const emit = defineEmits<AdvanceFilterEmits>()

// 响应式数据
const isExpanded = defineModel("isExpanded")

// 默认值
const defaultFilters: AdvanceFilterFilters = {
    difficulty: [],
    musicCategories: [],
    version: [],
    mapCategories: [],
    difficultyRange: [1.0, 15.0],
    fullCombo: [],
    fullSync: [],
    Type: [],
    showUnplayed: false
}
//diff
const getLevelClass = (level_index: number) => {
    const base = `rounded-full w-4 h-4`;
    switch (level_index) {
        case 0: return `${base} bg-BASIC`;
        case 1: return `${base} bg-ADVANCED`;
        case 2: return `${base} bg-EXPERT`;
        case 3: return `${base} bg-MASTER`;
        case 4: return `${base} bg-REMASTER`;
        case -1: return `${base} bg-UTAGE`;
    }
}

// 筛选条件
const filters = reactive<AdvanceFilterFilters>({
    ...defaultFilters,
    ...props.modelValue
})

// 选项数据
//难度
const difficultyOptions: FilterProps<number>[] = [{ label: 'BASIC', value: 0 }, { label: 'ADVANCED', value: 1 }, { label: 'EXPERT', value: 2 }, { label: 'MASTER', value: 3 }, { label: 'Re:MASTER', value: 4 }, { label: 'U•TA•GE', value: -1 }]
const musicCategoryOptions: FilterProps<string>[] = SongGenreList
const versionOptions: FilterProps<string>[] = SongVersionList
const mapCategoryOptions: FilterProps<string>[] = SongMapList
const fullComboOptions: FilterProps<string>[] = [{ label: 'FC', value: 'fc' }, { label: 'FC+', value: 'fcp' }, { label: 'AP', value: 'ap' }, { label: 'AP+', value: 'app' }]
const fullSyncOptions: FilterProps<string>[] = [{ label: 'Sync', value: 'sync' }, { label: 'FS', value: 'fs' }, { label: 'FS+', value: 'fsp' }, { label: 'FDX', value: 'fsd' }, { label: 'FDX+', value: 'fsdp' }]
const TypeOptions: FilterProps<string>[] = [{ label: '标准', value: 'standard' }, { label: 'DX', value: 'dx' }]

// 更新筛选条件
const updateFilters = (updates: Partial<AdvanceFilterFilters>) => {
    Object.assign(filters, updates)
    emit('update:modelValue', { ...filters })
}

const handleRangeChange = (value: string | number, index: 0 | 1) => {
    const parsedValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(parsedValue)) return

    const newRange: [number, number] = [...filters.difficultyRange]
    newRange[index] = parsedValue

    // 保证 min <= max
    if (index === 0 && newRange[0] > newRange[1]) {
        newRange[0] = newRange[1]
    }
    if (index === 1 && newRange[1] < newRange[0]) {
        newRange[1] = newRange[0]
    }

    // 保证在范围内
    newRange[0] = Math.max(1.0, newRange[0])
    newRange[1] = Math.min(15.0, newRange[1])

    updateFilters({ difficultyRange: newRange })
}

// 重置所有筛选条件
const resetAllFilters = () => {
    Object.assign(filters, defaultFilters)
    emit('update:modelValue', { ...defaultFilters })
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
    Object.assign(filters, { ...defaultFilters, ...newValue })
}, { deep: true })
</script>
