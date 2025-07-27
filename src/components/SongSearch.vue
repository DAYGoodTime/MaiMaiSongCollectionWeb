<template>
  <Combobox v-model="value" class="max-w-2xl" :ignore-filter="true">
    <ComboboxAnchor class="w-full">
      <div class="relative items-center shadow-md rounded-xl bg-white border-2 border-blue-100">
        <ComboboxInput
          class="pl-10 py-3 w-full rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
          :display-value="(val) => val?.title ?? ''" placeholder="搜索歌曲..." @update:model-value="onSearch"
          v-model:model-value="temp_search" />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3 text-blue-500">
          <Search class="size-5" />
        </span>
        <span
          class="absolute end-0 inset-y-0 flex items-center justify-center px-3 text-gray-500 hover:text-red-500 transition-colors">
          <ComboboxCancel @click="handelCleanSearch">
            <X class="size-5" />
          </ComboboxCancel>
        </span>
      </div>
    </ComboboxAnchor>

    <ComboboxList class="w-[var(--reka-combobox-trigger-width)]">
      <ComboboxEmpty class="mx-8"> 没有找到符合的歌曲 </ComboboxEmpty>
      <ComboboxGroup>
        <ScrollArea v-if="getFilteredSongs.length != 0">
          <div class="max-h-72 w-full">
            <DynamicScroller :items="getFilteredSongs" :min-item-size="72" class="w-full" key-field="id">
              <template #default="{ item, index }">
                <DynamicScrollerItem :item="item" :active="true" :index="index" :key="item.id">
                  <ComboboxItem :value="item" class="hover:bg-blue-50 transition-colors rounded-lg py-2 w-full">
                    <div class="flex items-center gap-3 p-3 w-full overflow-hidden">
                      <div class="shrink-0">
                        <img :src="getImageCoverUrl(item.id)"
                          class="w-14 h-14 rounded-lg object-cover border border-gray-200" loading="lazy"
                          :alt="item.title" />
                      </div>
                      <div class="flex-1 min-w-0 overflow-hidden">
                        <p class="text-lg font-semibold truncate text-gray-900">
                          {{ item.title }}
                        </p>
                        <p class="truncate text-gray-600 text-sm mt-1">
                          {{ item.artist }}
                        </p>
                      </div>
                    </div>
                    <ComboboxItemIndicator class="text-blue-600">
                      <Check class="size-5 font-bold" />
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                </DynamicScrollerItem>
              </template>
            </DynamicScroller>
            <ComboboxItem :value="null" class="hover:bg-gray-50 py-2">
              <div class="w-full text-center text-sm font-medium text-blue-600">
                清空选择
              </div>
            </ComboboxItem>
          </div>
        </ScrollArea>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
<script setup lang="ts">
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { Check, X, Search } from "lucide-vue-next";
import FlexSearch from 'flexsearch';
import { computed, ref } from "vue";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from "@/components/shadcn/ui/combobox";
import ScrollArea from "./shadcn/ui/scroll-area/ScrollArea.vue";
import { debounce, toLXNSStyleId } from "@/utils/functionUtil";
import { toHiragana } from 'wanakana';
import type { MaiMaiSong } from "@/types/songs";
import { getImageCoverUrl, rankingList } from "@/utils/urlUtils";
import { conventLevelPrefix, conventLevelTag, getNoteDesigners, LEVEL_MATCH_PATTEN, RANKING_MATCH_PATTEN } from "@/utils/StrUtil";
import { isAllFinal, versionList } from "@/utils/version";
import { ComboboxCancel } from "@/components/shadcn/ui/combobox";
import { useDataStore } from "@/store/datasource";
import type { Tag } from "./TagInputCombobox.vue";

const { getSongDataList, getScoreList } = useDataStore();

// 1. One-time data setup
const SONG_DATA = getSongDataList.list;
const songMap = new Map(SONG_DATA.map(s => [s.id, s]));

// 2. FlexSearch index setup
const songIndex = new FlexSearch.Document({
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
  },
});

// 3. Populate the index once
SONG_DATA.forEach(song => {
  // Create a separate object for indexing to avoid type conflicts
  const indexedDoc = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    titleHiragana: toHiragana(song.title).toLowerCase(),
    artistHiragana: toHiragana(song.artist).toLowerCase(),
    aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
    noteDesigners: getNoteDesigners(song)
  };
  songIndex.add(indexedDoc);
});


export interface SearchOptions {
  selected_tags: Tag[],
  bpm: {
    enable: boolean,
    range: number[]
  }
}

const props = defineProps<SearchOptions>();
const MAX_SEARCH_NUMBER = 100;

const filterByTag = (tagFilters: string[], _song?: MaiMaiSong) => {
  let songs: MaiMaiSong[] = []
  if (_song) {
    songs.push(_song)
  } else {
    // Use the static SONG_DATA
    songs = SONG_DATA;
  }
  let count = 0;
  let result: MaiMaiSong[] = []
  let success = false;
  for (const song of songs) {
    // 标签过滤
    const matchesTags = tagFilters.length === 0 ? true : tagFilters.every(tag => {
      // 定数tag过滤
      if (LEVEL_MATCH_PATTEN.test(tag)) {
        const level_filter = conventLevelTag(tag);
        if (level_filter) {
          const index_key = `level_${level_filter.level_index}` as keyof MaiMaiSong;
          const index_list = song[index_key];
          // 将level_value转换为数字类型进行匹配
          const levelValue = Number(level_filter.level_value);
          return Array.isArray(index_list) && !isNaN(levelValue) && index_list.includes(levelValue as never);
        }
      }

      // 成绩标签过滤
      if (RANKING_MATCH_PATTEN.test(tag)) {
        const splits = tag.split("_");
        if (splits.length === 2) {
          const level_index_tag = conventLevelPrefix(splits[0]);
          const ranking_target = rankingList.find(r => r.id === splits[1]);
          if (ranking_target) {
            const scoreList = getScoreList(song.id);
            return scoreList.some(
              s => s.level_index === level_index_tag &&
                s.achievements > ranking_target.min &&
                s.achievements < ranking_target.max
            );
          }
        }
      }

      // 旧框版本特判
      if (tag === "ALL FiNALE") {
        return isAllFinal(song.version);
      }
      // 版本标签过滤
      const versionMatch = versionList.find(v => v.id === tag);
      if (versionMatch) {
        return song.version === tag;
      }

      return false;
    });
    if (matchesTags) {
      success = true;
      count++;
      result.push(song)
    }
  }
  return {
    success,
    result,
    count
  }
}

const getFilteredSongs = computed(() => {
  const searchLower = toHiragana(search.value.toLowerCase());
  const searchNumber = !isNaN(Number(search.value)) ? toLXNSStyleId(Number(search.value)) : null;

  let songsToShow: MaiMaiSong[] = [];

  if (search.value.trim().length > 0) {
    const searchResults = songIndex.search(searchLower, { limit: MAX_SEARCH_NUMBER });
    const orderedIds: number[] = [];
    const addedIds = new Set<number>();

    searchResults.forEach(fieldResult => {
      fieldResult.result.forEach(id => {
        if (!addedIds.has(id as number)) {
          orderedIds.push(id as number);
          addedIds.add(id as number);
        }
      });
    });
    // Use the pre-computed songMap
    songsToShow = orderedIds.map(id => songMap.get(id)).filter(Boolean) as MaiMaiSong[];
  } else {
    // Use the static SONG_DATA
    songsToShow = SONG_DATA;
  }

  if (searchNumber !== null) {
    // Use the pre-computed songMap
    const songById = songMap.get(searchNumber);
    if (songById) {
      const existingIndex = songsToShow.findIndex(s => s.id === searchNumber);
      if (existingIndex !== -1) {
        songsToShow.splice(existingIndex, 1);
      }
      songsToShow.unshift(songById);
    }
  }

  const result: MaiMaiSong[] = [];
  for (const song of songsToShow) {
    if (result.length >= MAX_SEARCH_NUMBER) break;

    if (props.bpm.enable) {
      if (song.bpm > props.bpm.range[1] || song.bpm < props.bpm.range[0])
        continue;
    }
    const tagFilters = props.selected_tags.map(t => t.value);
    if (tagFilters.length > 0) {
      const matchesTags = filterByTag(tagFilters, song).success;
      if (!matchesTags) continue;
    }

    result.push(song);
  }

  return result;
});

const onSearch = debounce((val: string) => {
  search.value = String(val);
}, 100);

const search = ref("")
const temp_search = ref("")
const value = defineModel<MaiMaiSong>("selected");

const handelCleanSearch = (e: Event) => {
  e.preventDefault();
  value.value = undefined;
  search.value = ""
  temp_search.value = ""
}
</script>
