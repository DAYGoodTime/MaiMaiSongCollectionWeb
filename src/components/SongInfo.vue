<template>
    <Card class="mb-6 bg-white/90 shadow-lg backdrop-blur-md rounded-xl">
        <CardContent class="p-6">
            <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
                <!-- 歌曲封面 -->
                <div class="flex-shrink-0">
                    <img :src="getImageCoverUrl(song.id)" alt="歌曲封面"
                        class="w-28 h-28 rounded-xl object-cover shadow-md border border-gray-200" loading="lazy">
                </div>
                <!-- 歌曲详情 -->
                <div class="flex-1 w-full">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="bg-pink-500 text-white text-xs px-3 py-1 rounded-full shadow inline-block cursor-pointer hover:opacity-50"
                            @click="() => handelCopy(String(showCurrentStyleId(song.id)), '已成功复制歌曲id到剪切板中')">
                            {{ `No ${showCurrentStyleId(song.id)}` }}
                        </div>
                    </div>
                    <h2 class="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight hover:opacity-50 cursor-pointer"
                        @click="() => handelCopy(song.title, '已成功复制歌曲名到剪切板中')">
                        {{ song.title }}
                    </h2>
                    <p class="text-base text-gray-600 mb-4">{{ song.artist }}</p>
                    <!-- 歌曲信息 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm mb-2">
                        <div>
                            <span class="text-gray-500">BPM</span>
                            <div class="font-semibold">{{ song.bpm }}</div>
                        </div>
                        <div>
                            <span class="text-gray-500">分类</span>
                            <div class="font-semibold">{{ song.genre }}</div>
                        </div>
                        <div v-if="song.map">
                            <span class="text-gray-500">所属区域</span>
                            <div class="font-semibold">{{ song.map }}</div>
                        </div>
                        <div>
                            <span class="text-gray-500">首次出现版本</span>
                            <div class="font-semibold">{{ song.version }}</div>
                        </div>
                    </div>
                    <!-- 曲目别名 -->
                    <div v-if="song.aliases && song.aliases.length" class="mt-2">
                        <span class="text-gray-500 text-sm">曲目别名</span>
                        <div class="flex flex-wrap items-center gap-2 mt-1">
                            <Badge v-for="(alia, index) in song.aliases" :key="index" variant="outline"
                                class="text-xs cursor-pointer hover:opacity-50"
                                @click="() => handelCopy(alia as string, '已成功复制别名到剪切板中')">
                                {{ alia }}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 难度选择与数据源 -->
            <div class="flex flex-col md:flex-row justify-between items-center mt-6 gap-4" v-if="!infoOnly">
                <div class="flex-1 flex justify-center md:justify-start gap-2">
                    <Button v-for="type in availableTypeList" :key="type.value"
                        :variant="isSelectedType(type.value) ? 'default' : 'outline'" size="sm"
                        :class="isSelectedType(type.value) ? 'bg-orange-500 hover:bg-orange-600 text-white shadow' : ''"
                        @click="SelectedType = type.value">
                        {{ isSelectedType(type.value) ? '✓' : '' }} {{ type.label }}
                    </Button>
                </div>
                <div class="flex items-center gap-2">
                    <Select :disabled="getSelectableSource.length === 0" :model-value="selectedSource"
                        @update:model-value="handelDataSourceSwitch">
                        <SelectTrigger class="w-36">
                            <SelectValue placeholder="成绩数据源" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectLabel>成绩数据源选择</SelectLabel>
                            <SelectItem :value="ds" v-for="ds in getSelectableSource" :key="ds">
                                {{ ds }}
                            </SelectItem>
                            <SelectItem v-if="getSelectableSource.length === 0" value="empty">
                                没有可用数据源
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { getImageCoverUrl } from '@/utils/urlUtils'

import type { MaiMaiSong, SongType } from '@/types/songs'
import { onMounted, reactive, ref, watch } from 'vue'
import { SelectItem, SelectLabel, SelectTrigger, Select, SelectValue, SelectContent } from './shadcn/ui/select'
import { useDataStore, type DataSourceType } from '@/store/datasource'
import { toFishStyleId, useCopyHelper } from '@/utils/functionUtil'
import type { AcceptableValue } from 'reka-ui'
import { storeToRefs } from 'pinia'

const { switchDataSource } = useDataStore();
const { getSelectableSource, selectedSource } = storeToRefs(useDataStore())
const { song, infoOnly } = defineProps<{
    song: MaiMaiSong,
    infoOnly?: boolean
}>();
const SelectedType = defineModel<SongType>("selectedType", { default: "standard" });
const hasType = reactive({
    standard: false,
    dx: false,
    utage: false
});
const typeList = [
    { value: "standard", label: "标准" },
    { value: "dx", label: "DX" },
    { value: "utage", label: "宴会场" }
] as const;
const availableTypeList = ref<{ value: TypeValue, label: string }[]>([])
type TypeValue = typeof typeList[number]["value"];

const isSelectedType = (type: TypeValue) => {
    return type === SelectedType.value;
}
const showCurrentStyleId = (id: number) => {
    if (selectedSource.value === 'divingfish') return toFishStyleId(id);
    else return id
}
const handelDataSourceSwitch = (ds: AcceptableValue) => {
    switchDataSource(ds as DataSourceType);
}

const init = () => {
    availableTypeList.value = []
    hasType.standard = Array.isArray(song.difficulties.standard) && song.difficulties.standard.length > 0;
    hasType.dx = Array.isArray(song.difficulties.dx) && song.difficulties.dx.length > 0;
    hasType.utage = Array.isArray(song.difficulties.utage) && song.difficulties.utage.length > 0;
    // 优先选择standard > dx > utage
    let selected = false
    if (hasType.standard) {
        SelectedType.value = "standard";
        selected = true
        availableTypeList.value.push(typeList[0]);
    }
    if (hasType.dx) {
        if (!selected) {
            SelectedType.value = "dx";
        }
        selected = true
        availableTypeList.value.push(typeList[1]);
    }
    if (hasType.utage) {
        if (!selected) {
            SelectedType.value = "utage";
        }
        selected = true
        availableTypeList.value.push(typeList[2]);
    }
}

watch(() => song, init, { immediate: true });
onMounted(() => {
    init()
});
//copy
const { handelCopy } = useCopyHelper()
</script>
