import { useLocalStorage } from "@vueuse/core";
import FlexSearch from "flexsearch";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getNoteDesigners } from "@/utils/StrUtil";
import { pinyin } from "pinyin-pro";
import { useSongStore } from "./datasources/song";

export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "");
  const hasUserName = computed(() => UserName.value.length > 0);
  const ComboboxOpen = ref(false);
  const TagComboboxOpen = ref(false);
  const showGlobalSideBarTrigger = ref(true)
  const showCustomSideBarTrigger = ref(true)
  const NFCData = ref("")
  //Song Data
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
  const SongStore = useSongStore()
  const SONG_DATA = SongStore.getSongList()
  //直接在这里加载索引
  new Promise(() => {
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

  })
  const updateSongIndex = async () => {
    SongIndex.clear()
    new Promise(() => {
      for (const song of SONG_DATA) {
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
      }
    })
  }
  return {
    UserName,
    hasUserName,
    ComboboxOpen,
    TagComboboxOpen,
    SongIndex,
    showGlobalSideBarTrigger,
    showCustomSideBarTrigger,
    NFCData,
    updateSongIndex
  };
});
