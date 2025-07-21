import { defineStore } from "pinia";
import { computed, ref, toValue, type Ref } from "vue";
import type { BasicScore, DataSource } from "@/types/datasource";
import SONG_DATA from "@/assets/data/song_data_extra.json" with { type: 'json' };
import type { MaiMaiSong } from "@/types/songs";
import type { LXNSScore } from "@/types/lxns";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage } from "@vueuse/core";
const DEFAULT_DS = {
  list: new Map<number, any[]>(),
  update_time: '从未获取'
}
interface HasId {
  id: number
}
const serializerMap = {
  read: (v: string): DataSource<Map<number, LXNSScore[]>> => {
    if (v) {
      const obj = JSON.parse(v);
      return {
        list: new Map<number, any>(obj.list),
        update_time: obj.update_time
      }
    }
    return DEFAULT_DS;
  },
  write: (v: DataSource<any>) => JSON.stringify({
    list: [...v.list],
    update_time: v.update_time
  }),
}
function flatMapById<T extends HasId>(list: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of list) {
    if (!map.has(item.id)) {
      map.set(item.id, []);
    }
    map.get(item.id)!.push(item);
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
  const DivingFishSource = useLocalStorage('fish_local_ds', DEFAULT_DS)
  const getDivingFishScoreList = computed(() => {
    return DivingFishSource;
  })
  const updateDivingFishData = (data: BasicScore[]) => {
    DivingFishSource.value.list = flatMapById(data);
    DivingFishSource.value.update_time = formatDate(new Date())
  }
  const hasDivingFishData = computed(() => {
    return DivingFishSource.value.list.size > 0
  })
  const exportDivingFishData = () => {
    if (hasDivingFishData.value) {
      const blob = new Blob([JSON.stringify(DivingFishSource.value.list)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = formatDate(DivingFishSource.value.update_time) + "-divingFish.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
  //LXNS
  const LXNSSource: Ref<DataSource<Map<number, LXNSScore[]>>> = useLocalStorage('lxns_local_ds', DEFAULT_DS, {
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
      const blob = new Blob([JSON.stringify([...LXNSSource.value.list])], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = formatDate(LXNSSource.value.update_time) + "-LXNS.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
  //auto
  const selectedSource = ref<"divingfish" | "lxns">("lxns");
  const getDataSource = computed(() => {
    return selectedSource.value === "divingfish" ? toValue(DivingFishSource) : toValue(LXNSSource)
  })
  const getSelectableSource = computed(() => {
    let arr = []
    if (hasLXNSData.value) arr.push("lxns")
    if (hasDivingFishData.value) arr.push("divingfish")
    return arr;
  })
  const getScoreList = (id: number) => {
    return getDataSource.value.list.get(id) ?? [];
  }
  const getScore = (id: number, type: "standard" | "dx" | "utage", level_index: number) => {
    const scoreList = getDataSource.value.list.get(id)
    if (!scoreList || scoreList.length === 0) return null;
    return scoreList.find(s => s.type === type && s.level_index === level_index)
  }
  return {
    selectedSource,
    getSongDataList,
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
    getSongListAsMap
  };
});
