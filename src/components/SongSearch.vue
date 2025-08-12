<template>
  <Combobox v-model="selectedSong" class="max-w-2xl" :ignore-filter="true" :open-on-click="true">
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

    <ComboboxList class="w-[var(--reka-combobox-trigger-width)] max-h-[70svh] lg:max-h-[50dvh] overflow-y-auto">
      <ComboboxEmpty class="mx-8"> 没有找到符合的歌曲 </ComboboxEmpty>
      <ComboboxGroup>
        <ComboboxVirtualizer v-slot="{ option }" :options="getFilteredSongs" :text-content="(x) => x.title"
          :estimate-size="96" :overscan="10">
          <ComboboxItem :value="option" class="hover:bg-blue-50 transition-colors rounded-lg py-2 w-full">
            <div class="flex items-center gap-3 p-3 w-full overflow-hidden">
              <div class="shrink-0">
                <img :src="getImageCoverUrl(option.id)" class="w-14 h-14 rounded-lg object-cover border border-gray-200"
                  loading="lazy" :alt="option.title" />
              </div>
              <div class="flex-1 min-w-0 overflow-hidden">
                <p class="text-lg font-semibold truncate text-gray-900">
                  {{ option.title }}
                </p>
                <p class="truncate text-gray-600 text-sm mt-1">
                  {{ option.artist }}
                </p>
              </div>
            </div>
            <ComboboxItemIndicator class="text-blue-600">
              <Check class="size-5 font-bold" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxVirtualizer>
        <!-- <ComboboxItem :value="null" class="hover:bg-gray-50 py-2">
          <div class="w-full text-center text-sm font-medium text-blue-600">
            清空选择
          </div>
        </ComboboxItem> -->
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
<script setup lang="ts">
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { Check, X, Search } from "lucide-vue-next";
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
  ComboboxVirtualizer
} from "@/components/shadcn/ui/combobox";
import { debounce } from "@/utils/functionUtil";
import type { MaiMaiSong } from "@/types/songs";
import { getImageCoverUrl } from "@/utils/urlUtils";
import { ComboboxCancel } from "@/components/shadcn/ui/combobox";
import type { Tag } from "./TagInputCombobox.vue";
import { useSongSearch } from '@/utils/songSearch';

export interface SearchOptions {
  selected_tags: Tag[],
  bpm: {
    enable: boolean,
    range: number[]
  }
}
const props = defineProps<SearchOptions>();

const selectedSong = defineModel<MaiMaiSong>("selected");
const { searchSong, MAX_SEARCH_NUMBER, filterByTag } = useSongSearch()
//filter and search
const search = ref("")
const temp_search = ref("")
const onSearch = debounce((val: string) => {
  search.value = String(val);
}, 100);
const getFilteredSongs = computed(() => {
  const songsToShow = searchSong(search.value)
  const result: MaiMaiSong[] = [];
  for (const song of songsToShow) {
    if (result.length >= MAX_SEARCH_NUMBER) break;
    if (props.bpm.enable) {
      if (song.bpm > props.bpm.range[1] || song.bpm < props.bpm.range[0])
        continue;
    }
    //匹配标签
    const tagFilters = props.selected_tags.map(t => t.value);
    if (tagFilters.length > 0) {
      const matchesTags = filterByTag(tagFilters, song).success;
      if (!matchesTags) continue;
    }
    result.push(song);
  }
  return result;
});
const handelCleanSearch = (e: Event) => {
  e.preventDefault();
  selectedSong.value = undefined;
  search.value = ""
  temp_search.value = ""
}
</script>
