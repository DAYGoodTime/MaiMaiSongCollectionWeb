import { useLocalStorage } from "@vueuse/core";
import FlexSearch from "flexsearch";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useDataStore } from "./datasource";
import { getNoteDesigners } from "@/utils/StrUtil";
import { pinyin } from "pinyin-pro";

export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "");
  const hasUserName = computed(() => UserName.value.length > 0);
  const ComboboxOpen = ref(false);
  const shouldShowFloatingSideBarTrigger = ref(true)
  const SongIndex = new FlexSearch.Document({
    document: {
      id: 'id',
      index: [
        { field: 'title', tokenize: 'forward', preset: 'match', priority: 10 },
        { field: 'titlePinYin', tokenize: 'forward', preset: 'match', priority: 8 },
        { field: 'aliasesLower', tokenize: 'forward', priority: 8 },
        { field: 'aliasesPinYin', tokenize: 'forward', priority: 7 },
        { field: 'artist', tokenize: 'forward', priority: 6 },
        { field: 'noteDesigners', tokenize: 'forward', preset: 'match', priority: 9 }
      ]
    }
  })
  const { getSongDataList } = useDataStore()
  const SONG_DATA = getSongDataList.list
  //直接在这里加载索引
  SONG_DATA.forEach(song => {
    const noteDesigners = getNoteDesigners(song)
    const indexedDoc = {
      id: song.id,
      title: song.title.toLocaleLowerCase(),
      titlePinYin: pinyin(song.title, { toneType: 'none', nonZh: "removed", separator: "", v: true }),
      artist: song.artist,
      aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
      aliasesPinYin: song.aliases?.flatMap(v => {
        const py = pinyin(v as string, { toneType: 'none', nonZh: "removed", separator: "", v: true });
        return py ? [py] : []
      }) || [],
      noteDesigners,
    };
    if (SongIndex) {
      SongIndex.add(indexedDoc);
    }
  });
  return {
    UserName,
    hasUserName,
    ComboboxOpen,
    SongIndex,
    shouldShowFloatingSideBarTrigger
  };
});
