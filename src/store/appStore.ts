import { useLocalStorage } from "@vueuse/core";
import FlexSearch, { Document } from "flexsearch";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useDataStore } from "./datasource";
import { toHiragana } from "wanakana";
import { getNoteDesigners } from "@/utils/StrUtil";

export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "");
  const hasUserName = computed(() => UserName.value.length > 0);
  const ComboboxOpen = ref(false);
  const SongIndex = ref(new FlexSearch.Document({
    document: {
      id: 'id',
      index: [
        { field: 'title', tokenize: 'forward', priority: 10 },
        { field: 'titleHiragana', tokenize: 'forward', priority: 9 },
        { field: 'aliasesLower', tokenize: 'forward', priority: 8 },
        { field: 'artist', tokenize: 'forward', priority: 5 },
        { field: 'artistHiragana', tokenize: 'forward', priority: 4 },
        { field: 'noteDesigners', tokenize: 'forward', priority: 1 }
      ]
    }
  }))
  const { getSongDataList } = useDataStore()
  const SONG_DATA = getSongDataList.list
  //直接在这里加载索引
  SONG_DATA.forEach(song => {
    const indexedDoc = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      titleHiragana: toHiragana(song.title).toLowerCase(),
      artistHiragana: toHiragana(song.artist).toLowerCase(),
      aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
      noteDesigners: getNoteDesigners(song)
    };
    if (SongIndex.value) {
      SongIndex.value.add(indexedDoc);
    }
  });
  return {
    UserName,
    hasUserName,
    ComboboxOpen,
    SongIndex
  };
});
