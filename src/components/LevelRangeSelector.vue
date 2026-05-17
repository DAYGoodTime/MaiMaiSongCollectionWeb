<template>
    <div class="flex items-center gap-2">
        <Input type="number" :step="0.1" v-model:model-value="modelValue[0]"
            @update:model-value="val => handleInputChange(val, 0)" class="w-12 text-center h-8 text-xs pr-0 pl-1" />
        <Slider v-model:model-value="clampedSliderValue" :min="COMMON_MIN" :max="COMMON_MAX" :step="0.1"
            :show-min-max="false" :show-ticks="true" class="flex-1" />
        <Input type="number" :step="0.1" v-model:model-value="modelValue[1]"
            @update:model-value="val => handleInputChange(val, 1)" class="w-12 text-center h-8 text-xs pr-0 pl-1" />
    </div>
</template>
<script setup lang="ts">
import { Input } from '@/components/shadcn/ui/input'
import Slider from '@/components/shadcn/ui/slider/Slider.vue'
import { computed } from 'vue';
const GLOBAL_MAX = 15.0
const GLOBAL_MIN = 1.0
const COMMON_MIN = 12.0;
const COMMON_MAX = 15.0;

const modelValue = defineModel<[number, number]>({ default: [GLOBAL_MIN, GLOBAL_MAX], required: true })
const clampedSliderValue = computed({
    get() {
        const [realMin, realMax] = modelValue.value;
        return [
            Math.max(COMMON_MIN, Math.min(realMin, COMMON_MAX)),
            Math.max(COMMON_MIN, Math.min(realMax, COMMON_MAX))
        ] as [number, number];
    },
    set(val: [number, number]) {
        modelValue.value = val;
    }
});
const handleInputChange = (v: string | number, index: 0 | 1) => {
    // 转换数值 (处理空字符串或非法字符)
    let val = parseFloat(v.toString());
    if (isNaN(val)) return;
    const currentMin = modelValue.value[0];
    const currentMax = modelValue.value[1];
    if (index === 0) {
        val = Math.max(GLOBAL_MIN, Math.min(val, currentMax));
        val = Math.round(val * 10) / 10;
        modelValue.value = [val, currentMax];
    } else {
        val = Math.min(GLOBAL_MAX, Math.max(val, currentMin));
        val = Math.round(val * 10) / 10;
        modelValue.value = [currentMin, val];
    }
};
const reset = () => {
    modelValue.value = [GLOBAL_MIN, GLOBAL_MAX]
}
defineExpose({
    reset
})
</script>