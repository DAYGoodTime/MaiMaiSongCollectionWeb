import { defineStore } from "pinia";
import { computed, toValue, type Ref } from "vue";
import type { AnyScore, DataSource, Score } from "@/types/datasource";
import SONG_DATA from "@/assets/data/song_data_extra.json" with { type: 'json' };
import type { MaiMaiSong, SongType } from "@/types/songs";
import type { LXNSScore } from "@/types/lxns";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage, type RemovableRef } from "@vueuse/core";
import { conventToScore, exportFile, toLXNSStyleId } from "@/utils/functionUtil";
import type { FishScore } from "@/types/divingfish";
import { toast } from "vue-sonner";
import type { UsagiScore } from "@/types/usagi";

export type DataSourceType = "divingfish" | "lxns" | "usagi" | "empty";

const CURRENT_SONG_VERSION = 2

const CURRENT_SCORE_VERSION = 4

const DEFAULT_DS = {
  list: new Map<number, Score[]>(),
  update_time: '从未获取',
  version: CURRENT_SCORE_VERSION
}
const serializerMap = {
  read: (v: string): DataSource<Map<number, Score[]>> => {
    if (v) {
      const obj = JSON.parse(v);
      let list = Array.isArray(obj.list) ? obj.list : []
      return {
        list: new Map<number, Score[]>(list),
        update_time: obj.update_time,
        version: obj.version
      }
    }
    return DEFAULT_DS;
  },
  write: (v: DataSource<Map<number, Score[]>>) => JSON.stringify({
    list: [...v.list],
    update_time: v.update_time,
    version: v.version
  }),
}
export function flatMapById(list: AnyScore[], songMap: Map<number, MaiMaiSong>): Map<number, Score[]> {
  const map = new Map<number, Score[]>();
  for (const item of list) {
    //转换为通用类型
    const song_id = ("song_id" in item) ? toLXNSStyleId(item.song_id) : item.id;
    if (songMap.has(song_id)) {
      const score = conventToScore(item, songMap.get(song_id) as MaiMaiSong);
      if (map.has(score.id)) {
        map.get(score.id)?.push(score);
      } else {
        map.set(score.id, [score]);
      }
    } else {
      //不存在与数据源的歌曲通常为删除曲，则该成绩舍去。
      continue;
    }
  }
  return map;
}

export const useDataStore = defineStore("datasource", () => {
  const getSongDataList = computed(() => {
    const source: DataSource<MaiMaiSong[]> = {
      list: SONG_DATA as MaiMaiSong[],
      update_time: "2025-07-20 23:00:00",
      version: CURRENT_SONG_VERSION
    }
    return source;
  })
  const SONG_MAP = new Map<number, MaiMaiSong>();
  SONG_DATA.forEach(song => {
    SONG_MAP.set(song.id, song as MaiMaiSong)
  })
  const getSongListAsMap = () => {
    return SONG_MAP;
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
      list: flatMapById(data, SONG_MAP),
      update_time: formatDate(new Date()),
      version: CURRENT_SCORE_VERSION
    };
    DivingFishSource.value = source;
    if (selectedSource.value === "empty") {
      selectedSource.value = "divingfish"
    }
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
      list: flatMapById(data, SONG_MAP),
      update_time: formatDate(new Date()),
      version: CURRENT_SCORE_VERSION
    };
    LXNSSource.value = source
    if (selectedSource.value === "empty") {
      selectedSource.value = "lxns"
    }
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
  //Usagi
  const UsagiSource: Ref<DataSource<Map<number, Score[]>>> = useLocalStorage('usagi_local_ds', DEFAULT_DS, {
    serializer: serializerMap
  })
  const getUsagiScoreList = computed(() => {
    return UsagiSource;
  })
  const updateUsagiData = (data: UsagiScore[]) => {
    const source = {
      list: flatMapById(data, SONG_MAP),
      update_time: formatDate(new Date()),
      version: CURRENT_SCORE_VERSION
    };
    UsagiSource.value = source
    if (selectedSource.value === "empty") {
      selectedSource.value = "usagi"
    }
  }
  const hasUsagiData = computed(() => {
    return UsagiSource.value.list.size > 0
  })
  const exportUsagiData = () => {
    if (hasLXNSData.value) {
      const fileName = formatDate(UsagiSource.value.update_time) + "-Usagi.json";
      exportFile(JSON.stringify([...UsagiSource.value.list]), fileName)
    }
  }
  //auto
  const selectedSource: RemovableRef<DataSourceType> = useLocalStorage("selected_datasource", "empty") as RemovableRef<DataSourceType>
  const getDataSource = computed(() => {
    let source;
    switch (selectedSource.value) {
      case "divingfish": source = toValue(DivingFishSource); break;
      case "lxns": source = toValue(LXNSSource); break;
      case "usagi": source = toValue(UsagiSource); break;
      case "empty": source = null
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
  const ClearDataSource = (type: DataSourceType) => {
    if (type === "lxns") {
      LXNSSource.value = DEFAULT_DS;
    }
    if (type === "divingfish") {
      DivingFishSource.value = DEFAULT_DS;
    }
    if (type === "usagi") {
      UsagiSource.value = DEFAULT_DS
    }
    if (getSelectableSource.value.length === 0) {
      selectedSource.value = "empty"
    } else {
      selectedSource.value = getSelectableSource.value[0]
    }
    const message = selectedSource.value === 'empty' ? ',当前没有可用的数据源了' : `当前默认数据源为 ${selectedSource.value}`
    toast.success(`成功删除数据源 ${type} ${message}`, { position: "top-center" })
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
    switchDataSource,
    CURRENT_SCORE_VERSION,
    CURRENT_SONG_VERSION,
    ClearDataSource,
    UsagiSource,
    updateUsagiData,
    getUsagiScoreList,
    hasUsagiData,
    exportUsagiData,
  };
});
