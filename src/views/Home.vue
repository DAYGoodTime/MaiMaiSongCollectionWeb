<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { Filter, Search, CircleQuestionMark } from 'lucide-vue-next'
import SongSearch from "@/components/SongSearch.vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/shadcn/ui/hover-card";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Slider } from "@/components/shadcn/ui/slider";
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import { Label } from "@/components/shadcn/ui/label";
import TagInputCombobox from "@/components/TagInputCombobox.vue";
import type { Tag } from "@/components/TagInputCombobox.vue";
import type { MaiMaiSong, SongType } from "@/types/songs";
import SongInfo from "@/components/SongInfo.vue";
import ScoreInfo from "@/components/ScoreInfo.vue";
const bpmRangeValue = ref([0, 300]);
const enableBpmFilter = ref(false);
const tags = ref<Tag[]>([]);
const selectedSong = ref<MaiMaiSong>();
const bpmOption = reactive({
  enable: enableBpmFilter,
  range: bpmRangeValue
})

const SelectedType = ref<SongType>("standard")
const getScoreList = computed(() => selectedSong.value?.difficulties[SelectedType.value] ?? []);
</script>
<template>
  <div class="container mx-auto px-4 py-2">
    <div class="space-y-6 lg:mx-32">
      <Card>
        <Accordion type="single" collapsible class="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger class="px-6">
              <div class="flex items-center gap-2">
                <Filter class="h-5 w-5" />
                <span class="text-lg font-semibold">筛选条件</span>
              </div>
            </AccordionTrigger>
            <AccordionContent class="px-6 pt-4">
              <div class="grid gap-6 sm:grid-cols-2">
                <div class="space-y-2">
                  标签筛选:
                  <HoverCard :open-delay="10">
                    <HoverCardTrigger>
                      <CircleQuestionMark class="inline w-4 h-4" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div class="flex flex-col gap-2">
                        <p>通过标签来筛选需要搜索的歌曲范围:</p>
                        <p>版本: 任意maimai版本</p>
                        <p>铺面难度: 例如："红13"、"紫12"</p>
                        <p>达成率: 例如："红鸟加"、"白鸟"</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <Label>

                  </Label>
                  <TagInputCombobox v-model:tags="tags" />
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Search class="h-5 w-5" />
            歌曲搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <SongSearch class="mx-auto" v-model:selected="selectedSong" :selected_tags="tags" :bpm="bpmOption" />
          </div>
        </CardContent>
      </Card>

      <div v-if="selectedSong">
        <SongInfo :song="selectedSong" v-model:selected-type="SelectedType" />
        <div class="space-y-4">
          <ScoreInfo :difficulties="getScoreList" :song="selectedSong" />
        </div>
      </div>
    </div>
  </div>
</template>
