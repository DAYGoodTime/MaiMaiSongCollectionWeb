<template>
  <Combobox v-model="selectedSong" v-model:open="appStore.ComboboxOpen" class="w-full md:w-3/4" :ignore-filter="true"
    :open-on-click="true">
    <ComboboxAnchor class="w-full">
      <div class="relative items-center shadow-md rounded-xl border-2">
        <ComboboxInput class="pl-10 py-3 w-full rounded-xl focus:ring-2 transition-all text-base"
          :display-value="(val) => val?.title ?? ''" placeholder="支持标题|曲师|谱师|别名甚至拼音" @update:model-value="onSearch"
          v-model:model-value="temp_search" />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
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

    <ComboboxList class="w-[var(--reka-combobox-trigger-width)] max-h-60svh lg:max-h-50svh overflow-y-auto"
      @interact-outside="handelInteractOutSide">
      <ComboboxEmpty class="mx-8">
        <div v-if="isLoading" class="col-span-full flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
        <span v-else>没有找到符合的歌曲</span>
      </ComboboxEmpty>
      <ComboboxGroup>
        <ComboboxVirtualizer v-slot="{ option }" :options="searchResults.slice(0, MAX_SEARCH_NUMBER)"
          :text-content="(x) => x.title" :estimate-size="96" :overscan="10">
          <ComboboxItem :value="option" class=" transition-colors rounded-lg py-2 w-full">
            <div class="flex items-center gap-3 p-3 w-full overflow-hidden">
              <div class="shrink-0">
                <CoverImage :id="option.id" class="w-14 h-14 rounded-lg object-cover border border-gray-200"
                  :alt="option.title" />
              </div>
              <div class="flex-1 min-w-0 overflow-hidden">
                <p class="text-lg font-semibold truncate">
                  {{ option.title }}
                </p>
                <p class="truncate text-gray-600 dark:text-gray-300 text-sm mt-1">
                  {{ option.artist }}
                </p>
              </div>
            </div>
            <ComboboxItemIndicator>
              <Check class="size-8  font-bold" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxVirtualizer>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
<script setup lang="ts">
import { Check, X, Search } from "lucide-vue-next";
import { ref } from "vue";
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
import CoverImage from "@/components/CoverImage.vue";
import { ComboboxCancel } from "@/components/shadcn/ui/combobox";
import type { TagOption } from "./TagInputCombobox.vue";
import { useAppStore } from '@/store/appStore';
import { useSongSearchWorker } from "@/utils/workerHelper";
import { MAX_SEARCH_NUMBER } from "@/utils/consts";

export interface SearchOptions {
  tagOption: TagOption,
  bpm: {
    enable: boolean,
    range: number[]
  }
}
const props = defineProps<SearchOptions>();
const appStore = useAppStore();
const selectedSong = defineModel<MaiMaiSong>("selected");
//filter and search
const searchValue = ref("")
const temp_search = ref("")
const onSearch = debounce((val: string) => {
  searchValue.value = String(val);
}, 100, true);
const { searchResults, search, isLoading } = useSongSearchWorker(searchValue, props)
const handelCleanSearch = (e: Event) => {
  e.preventDefault();
  selectedSong.value = undefined;
  searchValue.value = ""
  temp_search.value = ""
}
const handelInteractOutSide = (event: Event) => {
  event.preventDefault();
  appStore.ComboboxOpen = false
}
defineExpose({
  results: searchResults,
  triggerSearch: (number?: number) => {
    search(number)
  }
})
</script>
