import type { AnyScore, AvailableDataSourceType, DataSource, DataSourceType, Score } from "@/types/datasource"
import type { MaiMaiSong, SongType } from "@/types/songs"
import { conventToScore, exportFile, toLXNSStyleId } from "@/utils/functionUtil"
import { formatDate } from "@/utils/StrUtil"
import { useLocalStorage, type RemovableRef } from "@vueuse/core"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { toast } from "vue-sonner"
import { useSongStore } from "./song"

export const CURRENT_SCORE_VERSION = 6
export const MAX_ERROR_COUNT = 3
export const DEFAULT_DS: DataSource<Record<string, Score>> = {
    list: {},
    update_time: '从未获取',
    version: CURRENT_SCORE_VERSION
}
export function flatMapById(list: AnyScore[], songMap: Record<number, MaiMaiSong>): Record<string, Score> {
    let skipCount = 0;
    const scoreMap: Record<string, Score> = {}
    for (const item of list) {
        const song_id = ("song_id" in item) ? toLXNSStyleId(item.song_id) : toLXNSStyleId(item.id);
        if (songMap[song_id]) {
            const uni_link = `${song_id}_${item.type}_${item.level_index}`
            const score = conventToScore(item, songMap[song_id]);
            scoreMap[uni_link] = score
        } else {
            //不存在与数据源的歌曲通常为删除曲，则舍去。
            skipCount++;
            if (skipCount <= 5) {
                console.warn("存在删除曲 id:", song_id);
            }
        }
    }
    if (skipCount > 0) {
        console.warn("存在多个被跳过的曲目，数量:", skipCount);
    }
    return scoreMap;
}
export const useScores = defineStore("scores", () => {
    const SongStore = useSongStore()
    //Usagi
    const UsagiScores = useLocalStorage('usagi_local_ds', DEFAULT_DS)
    const hasUsagiData = computed(() => {
        return Object.keys(UsagiScores.value.list).length > 0
    })
    const updateScores = (data: AnyScore[], type: AvailableDataSourceType) => {
        switch (type) {
            case "divingfish": DivingFishScores.value = toUniverseScore(data); break;
            case "lxns": LXNSScores.value = toUniverseScore(data); break;
            case "usagi": UsagiScores.value = toUniverseScore(data); break;
        }
        if (selectedSource.value === "empty") {
            selectedSource.value = type;
        }
    }
    //DivingFish
    const DivingFishScores = useLocalStorage('fish_local_ds', DEFAULT_DS)
    const hasDivingFishData = computed(() => {
        return Object.keys(DivingFishScores.value.list).length > 0
    })
    //LXNS
    const LXNSScores = useLocalStorage('lxns_local_ds', DEFAULT_DS)
    const hasLXNSData = computed(() => {
        return Object.keys(LXNSScores.value.list).length > 0
    })
    //universe
    const selectedSource = useLocalStorage("selected_datasource", "empty") as RemovableRef<DataSourceType>
    const getDataSource = computed(() => {
        let source;
        switch (selectedSource.value) {
            case "divingfish": source = DivingFishScores; break;
            case "lxns": source = LXNSScores; break;
            case "usagi": source = UsagiScores; break;
            case "empty": source = ref(DEFAULT_DS)
        }
        return source
    })
    const getSelectableSource = computed(() => {
        let arr: DataSourceType[] = []
        if (hasLXNSData.value) arr.push("lxns")
        if (hasUsagiData.value) arr.push("usagi")
        if (hasDivingFishData.value) arr.push("divingfish")
        return arr;
    })
    const ClearDataSource = (type: AvailableDataSourceType) => {
        switch (type) {
            case "divingfish": DivingFishScores.value = DEFAULT_DS; break;
            case "lxns": LXNSScores.value = DEFAULT_DS; break;
            case "usagi": UsagiScores.value = DEFAULT_DS; break;
        }
        if (getSelectableSource.value.length === 0) {
            selectedSource.value = "empty"
        } else {
            selectedSource.value = getSelectableSource.value[0]
        }
        const message = selectedSource.value === 'empty' ? ',当前没有可用的数据源了' : `当前默认数据源为 ${selectedSource.value}`
        toast.success(`成功删除数据源 ${type} ${message}`, { position: "top-center" })
    }
    const switchDataSource = (type: DataSourceType) => {
        if (getSelectableSource.value.includes(type)) {
            toast.success(`已将默认数据源设置为 ${type}`, { position: "top-center" })
            selectedSource.value = type
        }
    }
    const exportScores = (type: AvailableDataSourceType) => {
        switch (type) {
            case "usagi":
                if (hasUsagiData.value) {
                    const fileName = formatDate(UsagiScores.value.update_time) + "-Usagi.json";
                    exportFile(JSON.stringify(UsagiScores.value.list), fileName)
                } else toast.error("数据源为空，无法导出"); break;
            case "divingfish":
                if (hasDivingFishData.value) {
                    const fileName = formatDate(DivingFishScores.value.update_time) + "-divingFish.json";
                    exportFile(JSON.stringify(DivingFishScores.value.list), fileName)
                } else toast.error("数据源为空，无法导出"); break;
            case "lxns":
                if (hasLXNSData.value) {
                    const fileName = formatDate(LXNSScores.value.update_time) + "-LXNS.json";
                    exportFile(JSON.stringify(LXNSScores.value.list), fileName)
                } else toast.error("数据源为空，无法导出"); break;
        }
    }
    const toUniverseScore = (data: AnyScore[]) => {
        return {
            list: flatMapById(data, SongStore.SONG_LIST.list),
            update_time: formatDate(new Date()),
            version: CURRENT_SCORE_VERSION
        };
    }
    const checkScoreVersion = () => {
        const list = [
            { source: UsagiScores, type: "usagi" },
            { source: LXNSScores, type: "lxns" },
            { source: UsagiScores, type: "divingfish" }
        ]
        return list.some(score => {
            const b = score.source.value.version != CURRENT_SCORE_VERSION
            if (b) {
                console.warn(`数据源:${score.type}版本不一致，已重置`);
                ClearDataSource(score.type as AvailableDataSourceType)
            }
            return b;
        })
    }
    const getScoreList = (song_id: number) => {
        const uni_ids = []
        const result: Score[] = []
        uni_ids.push(`${song_id}_utage_0`)
        for (let i = 0; i <= 4; i++) {
            uni_ids.push(`${song_id}_standard_${i}`)
            uni_ids.push(`${song_id}_dx_${i}`)
        }
        for (const uni_id of uni_ids) {
            const score = getDataSource.value.value.list[uni_id]
            if (score) {
                result.push(score)
            }
        }
        return result;
    }
    const getScoreByUni = (id: number, type: SongType, level_index: number) => {
        return getDataSource.value.value.list[`${id}_${type}_${level_index}`]
    }
    return {
        UsagiScores,
        hasUsagiData,
        DivingFishScores,
        hasDivingFishData,
        LXNSScores,
        hasLXNSData,
        selectedSource,
        checkScoreVersion,
        getScoreList,
        getScoreByUni,
        updateScores,
        exportScores,
        getDataSource,
        getSelectableSource,
        switchDataSource,
        ClearDataSource
    }
})

export type ScoreStore = ReturnType<typeof useScores>