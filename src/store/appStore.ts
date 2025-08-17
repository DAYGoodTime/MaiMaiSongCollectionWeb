import { useLocalStorage } from "@vueuse/core";
import FlexSearch from "flexsearch";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useDataStore } from "./datasource";
import { getNoteDesigners } from "@/utils/StrUtil";

export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "");
  const hasUserName = computed(() => UserName.value.length > 0);
  const ComboboxOpen = ref(false);
  const SongIndex = new FlexSearch.Document({
    document: {
      id: 'id',
      index: [
        { field: 'title', tokenize: 'forward', preset: 'match', priority: 10 },
        { field: 'aliasesLower', tokenize: 'forward', priority: 8 },
        { field: 'artist', tokenize: 'forward', priority: 5 },
        { field: 'noteDesigners', tokenize: 'forward', preset: 'match', priority: 9 }
      ]
    }
  })
  const { getSongDataList } = useDataStore()
  const SONG_DATA = getSongDataList.list
  //直接在这里加载索引
  SONG_DATA.forEach(song => {
    const indexedDoc = {
      id: song.id,
      title: song.title.toLocaleLowerCase(),
      artist: song.artist,
      aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
      noteDesigners: getNoteDesigners(song)
    };
    if (SongIndex) {
      SongIndex.add(indexedDoc);
    }
  });
  return {
    UserName,
    hasUserName,
    ComboboxOpen,
    SongIndex
  };
});
