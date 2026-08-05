<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/ui/dialog'
import { reactive, ref, useTemplateRef } from "vue";
import { Filter, Search, CircleQuestionMark } from '@lucide/vue'
import SongSearch from "@/components/SongSearch.vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/shadcn/ui/hover-card";
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Slider } from "@/components/shadcn/ui/slider";
import { Button } from "@/components/shadcn/ui/button";
import { Switch } from '@/components/shadcn/ui/switch'
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import { Label } from "@/components/shadcn/ui/label";
import TagInputCombobox from "@/components/TagInputCombobox.vue";
import type { TagOption } from "@/components/TagInputCombobox.vue";
import type { MaiMaiSong, SongDifficultyAny, SongType } from "@/types/songs";
import SongInfo from "@/components/SongInfo.vue";
import ImportFromResult from "./ImportFromResult.vue";
import { toast } from "vue-sonner";
import { useAppStore } from "@/store/appStore";
import type { GroupInfo } from '@/types/tag';
import DiffTagInfo from '@/components/DiffTagInfo.vue';
import { getDiffTag } from '@/utils/tagUtils';
const bpmRangeValue = ref([0, 300]);
const enableBpmFilter = ref(false);
const appStore = useAppStore()
const TagOptions = ref<TagOption>({
  matchEvery: true,
  tags: []
})
const selectedSong = ref<MaiMaiSong>();
const bpmOption = reactive({
  enable: enableBpmFilter,
  range: bpmRangeValue
})
const tooltipsOpen = ref(false)

const selectedType = ref<SongType>("standard")
const SearchRef = useTemplateRef("search")
const SEARCH_NUMBER_LIMIT = 300;
const openImportDialog = ref(false)
const handelOpenImportDialog = () => {
  if (SearchRef.value && SearchRef.value.results.length > 0) {
    appStore.TagComboboxOpen = false;
    SearchRef.value.triggerSearch()
    //only timeout to prevent process crash
    setTimeout(() => {
      openImportDialog.value = true;
    }, 100)
  } else {
    toast.warning("没有歌曲可供导入")
  }
}
const DiffInfoMenuModal = ref(false)
const DiffInfo = ref<{
  song: MaiMaiSong,
  diff: SongDifficultyAny,
  tags: GroupInfo[]
} | null>(null)
const handelScoreInfoMenu = (song: MaiMaiSong, diff: SongDifficultyAny) => {
  DiffInfo.value = {
    tags: getDiffTag(song.title, diff.level_index, diff.type),
    song,
    diff,
  }
  DiffInfoMenuModal.value = true
}
</script>
<template>
  <div class="container mx-auto px-4 py-2">
    <ImportFromResult :list="SearchRef?.results ?? []" :tag-option="TagOptions" v-model:open="openImportDialog"
      :max_limit="SEARCH_NUMBER_LIMIT" />
    <div class="space-y-6 lg:mx-32">
      <Card>
        <CardContent class="flex flex-col gap-4 md:flex-col-reverse">
          <div class="flex flex-col gap-4 pt-4">
            <div class="flex justify-between">
              <div class="flex items-center gap-2">
                <Search class="h-5 w-5" />
                <span class="text-lg font-semibold">歌曲搜索</span>
              </div>
              <div>
                <Button variant="outline" @click="handelOpenImportDialog">导入到合集</Button>
              </div>
            </div>
            <SongSearch ref="search" class="mx-auto" v-model:selected="selectedSong" :tag-option="TagOptions"
              :bpm="bpmOption" />
          </div>
          <Accordion type="single" collapsible class="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <div class="flex items-center gap-2">
                  <Filter class="h-5 w-5" />
                  <span class="text-lg font-semibold">筛选条件</span>
                </div>
              </AccordionTrigger>
              <AccordionContent class="px-6 pt-4">
                <div class="grid gap-6 sm:grid-cols-2">
                  <div class="space-y-2">
                    <div class="flex flex-col space-y-2">
                      <p>
                        标签筛选:
                        <HoverCard :open-delay="10" v-model:open="tooltipsOpen">
                          <HoverCardTrigger>
                            <CircleQuestionMark @click="tooltipsOpen = true" class=" cursor-pointer inline w-4 h-4" />
                          </HoverCardTrigger>
                          <HoverCardContent class="w-fit">
                            <div class="flex flex-col gap-2">
                              <p>通过标签来筛选需要搜索的歌曲范围:</p>
                              <p>版本: 任意maimai版本</p>
                              <p>铺面难度: 例如："红13"、"紫12"</p>
                              <p>达成率: 例如："红鸟加"、"白鸟"</p>
                              <p>定数范围: 例如："12-14"、"14.6-14.9"</p>
                              <p>达成率范围: 例如："100.4-100.4999"、"99.9-99.9999"</p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </p>
                      <div class="flex items-center space-x-2">
                        <Switch id="match-every" v-model:model-value="TagOptions.matchEvery" />
                        <Label for="match-every">{{ TagOptions.matchEvery ? '满足所有标签' : '满足部分标签' }}</Label>
                      </div>
                    </div>
                    <TagInputCombobox v-model:tags="TagOptions.tags" />
                  </div>
                  <div class="space-y-2">
                    <Label>BPM 筛选</Label>
                    <div class="flex items-center space-x-2">
                      <Checkbox v-model="enableBpmFilter" />
                      <label for="bpmfilter"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        启用BPM筛选
                      </label>
                    </div>
                    <div class="pt-2">
                      <Slider v-model="bpmRangeValue" :disabled="!enableBpmFilter" :max="350" :min="1" :step="1" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      <div v-if="selectedSong">
        <SongInfo :song="selectedSong" v-model:selected-type="selectedType" @menu="handelScoreInfoMenu" />
      </div>
    </div>
  </div>
  <!-- Song Info Menu -->
  <Dialog v-model:open="DiffInfoMenuModal">
    <DialogContent class="lg:!max-w-fit max-h-full overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          <p>{{ DiffInfo?.song.title }}</p>
        </DialogTitle>
      </DialogHeader>
      <SongInfo v-if="DiffInfo?.song" :song="DiffInfo.song" :infoOnly="true" />
      <DiffTagInfo :tag-info="DiffInfo?.tags"></DiffTagInfo>
    </DialogContent>
  </Dialog>
</template>
