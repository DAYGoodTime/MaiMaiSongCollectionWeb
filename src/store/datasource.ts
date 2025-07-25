import { defineStore } from "pinia";
import { computed, toValue, type Ref } from "vue";
import type { DataSource, Score } from "@/types/datasource";
import SONG_DATA from "@/assets/data/song_data_extra.json" with { type: 'json' };
import type { MaiMaiSong, SongType } from "@/types/songs";
import type { LXNSScore } from "@/types/lxns";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage } from "@vueuse/core";
import { conventToScore, exportFile } from "@/utils/functionUtil";
import type { FishScore } from "@/types/divingfish";
import { toast } from "vue-sonner";

export type DataSourceType = "divingfish" | "lxns";

const DEFAULT_DS = {
  list: new Map<number, Score[]>(),
  update_time: '从未获取'
}
const serializerMap = {
  read: (v: string): DataSource<Map<number, Score[]>> => {
    if (v) {
      const obj = JSON.parse(v);
      return {
        list: new Map<number, Score[]>(obj.list),
        update_time: obj.update_time
      }
    }
    return DEFAULT_DS;
  },
  write: (v: DataSource<Map<number, Score[]>>) => JSON.stringify({
    list: [...v.list],
    update_time: v.update_time
  }),
}
export function flatMapById(list: LXNSScore[] | FishScore[]): Map<number, Score[]> {
  const map = new Map<number, Score[]>();
  for (const item of list) {
    //转换为通用类型
    const score = conventToScore(item);
    if (map.has(score.id)) {
      map.get(score.id)?.push(score);
    } else {
      map.set(score.id, [score]);
    }

  }
  return map;
}

export const useDataStore = defineStore("datasource", () => {
  const getSongDataList = computed(() => {
    const source: DataSource<MaiMaiSong[]> = {
      list: SONG_DATA as MaiMaiSong[],
      update_time: "2025-07-20 23:00:00"
    }
    return source;
  })
  const getSongListAsMap = () => {
    const map = new Map<number, MaiMaiSong>();
    SONG_DATA.forEach(song => {
      map.set(song.id, song as MaiMaiSong)
    })
    return map;
  }
  //DivingFish
  const DivingFishSource: Ref<DataSource<Map<number, Score[]>>> = useLocalStorage('fish_local_ds', DEFAULT_DS, {
    serializer: serializerMap
  })
  const getDivingFishScoreList = computed(() => {
    return DivingFishSource;
  })
  const updateDivingFishData = (data: FishScore[]) => {
    const source = {
      list: flatMapById(data),
      update_time: formatDate(new Date())
    };
    DivingFishSource.value = source;
  }
  const hasDivingFishData = computed(() => {
    return DivingFishSource.value.list.size > 0
  })
  const exportDivingFishData = () => {
    if (hasDivingFishData.value) {
      const fileName = formatDate(DivingFishSource.value.update_time) + "-divingFish.json";
      exportFile(JSON.stringify(DivingFishSource.value.list), fileName)
    }
  }
  //LXNS
  const LXNSSource: Ref<DataSource<Map<number, Score[]>>> = useLocalStorage('lxns_local_ds', DEFAULT_DS, {
    serializer: serializerMap
  })
  const getLXNSScoreList = computed(() => {
    return LXNSSource;
  })
  const updateLXNSData = (data: LXNSScore[]) => {
    const source = {
      list: flatMapById(data),
      update_time: formatDate(new Date())
    };
    LXNSSource.value = source
  }
  const hasLXNSData = computed(() => {
    return LXNSSource.value.list.size > 0
  })
  const exportLXNSData = () => {
    if (hasLXNSData.value) {
      const fileName = formatDate(LXNSSource.value.update_time) + "-LXNS.json";
      exportFile(JSON.stringify([...LXNSSource.value.list]), fileName)
    }
  }
  //auto
  const selectedSource: Ref<DataSourceType> = useLocalStorage("selected_datasource", "lxns") as Ref<DataSourceType>
  const getDataSource = computed(() => {
    return selectedSource.value === "divingfish" ? toValue(DivingFishSource) : toValue(LXNSSource)
  })
  const getSelectableSource = computed(() => {
    let arr: DataSourceType[] = []
    if (hasLXNSData.value) arr.push("lxns")
    if (hasDivingFishData.value) arr.push("divingfish")
    return arr;
  })
  const switchDataSource = (type: DataSourceType) => {
    if (getSelectableSource.value.includes(type)) {
      toast.success(`已将默认数据源设置为 ${type}`, { position: "top-center" })
      selectedSource.value = type
    }
  }
  const getScoreList = (id: number) => {
    return getDataSource.value.list.get(id) ?? [];
  }
  const getScore = (id: number, type: SongType, level_index: number) => {
    const scoreList = getDataSource.value.list.get(id)
    if (!scoreList || scoreList.length === 0) return null;
    return scoreList.find(s => s.type === type && s.level_index === level_index)
  }
  return {
    selectedSource,
    getSongDataList,
    DivingFishSource,
    getDivingFishScoreList,
    updateDivingFishData,
    getLXNSScoreList,
    updateLXNSData,
    getDataSource,
    hasDivingFishData,
    hasLXNSData,
    exportLXNSData,
    exportDivingFishData,
    getSelectableSource,
    getScore,
    getScoreList,
    LXNSSource,
    getSongListAsMap,
    switchDataSource
  };
});
