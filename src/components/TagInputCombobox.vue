<script setup lang="ts">
import { X } from "lucide-vue-next";
import { useFilter, type AcceptableValue, type ListboxItemSelectEvent } from "reka-ui";
import { computed, ref } from "vue";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/shadcn/ui/combobox";
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputClear
} from "@/components/shadcn/ui/tags-input";
import versionList from "@/assets/data/versions.json" with { type: 'json' };
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import { isValidAchievementRange, LEVEL_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN } from "@/utils/StrUtil"
import { toast } from "vue-sonner";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/store/appStore";
import { useScores } from "@/store/datasources/scores";
const modelValue = defineModel<Tag[]>("tags")
const { TagComboboxOpen } = storeToRefs(useAppStore())
const searchTerm = ref("");
export interface Tag {
  label: string;
  value: string;
  alias: string | null;
  needDs?: boolean;
}
const { contains } = useFilter({ sensitivity: "base" });
const versionListForTag: Tag[] = versionList.map((v) => {
  return {
    label: v.label_full,
    value: v.id,
    alias: v.alias,
  };
});

const RankingTag: Tag[] = [
  {
    label: "SSS+",
    value: "SSSp",
    alias: "鸟加"
  },
  {
    label: "SSS",
    value: "SSS",
    alias: "鸟"
  },
  {
    label: "SS+",
    value: "SSp",
    alias: "99.5"
  },
  {
    label: "SS",
    value: "SS",
    alias: "99"
  },
  {
    label: "S+",
    value: "Sp",
    alias: "98"
  },
  {
    label: "S",
    value: "S",
    alias: "97"
  },
  {
    label: "AAA",
    value: "AAA",
    alias: "94"
  },
  {
    label: "AA",
    value: "AA",
    alias: "90"
  },
  {
    label: "Clean",
    value: "clean",
    alias: "80"
  }
]
const addRankingPrefix = (prefix: "绿" | "黄" | "红" | "紫" | "白") => {
  return RankingTag.map(tag => {
    return {
      label: `${prefix}${tag.label}`,
      value: `${prefix}_${tag.value}`,
      alias: tag.alias,
      needDs: true
    }
  })
}
const filteredTags = computed(() => {
  const result = new Set<Tag>([]);
  let currentTagList: string[] = []
  if (modelValue.value) {
    currentTagList = modelValue.value.map(t => t.label)
  }
  if (!modelValue.value) return []
  //level matching
  if (LEVEL_MATCH_PATTEN.test(searchTerm.value)) {
    return [{
      label: searchTerm.value,
      value: searchTerm.value,
      alias: searchTerm.value
    }]
  }
  if (LEVEL_RANGE_MATCH_PATTEN.test(searchTerm.value)) {
    const [start, end] = searchTerm.value.split("-");
    const startLevel = Number(start);
    const endLevel = Number(end);
    if (startLevel < endLevel) {
      return [{
        label: searchTerm.value,
        value: searchTerm.value,
        alias: searchTerm.value
      }]
    }
  }
  //match with score ranking
  const searchPrefix = searchTerm.value.substring(0, 1)
  if (contains("绿黄红紫白", searchPrefix) && searchPrefix.length > 0) {
    const ranking_list = addRankingPrefix(searchPrefix as "绿" | "黄" | "红" | "紫" | "白")
    const ranking = searchTerm.value.substring(1, searchTerm.value.length);
    let tag_list;
    if (ranking) {
      tag_list = ranking_list.filter(r =>
        contains(r.label, searchTerm.value) ||
        contains(r.alias ?? '-', ranking)
      );
    } else {
      tag_list = ranking_list;
    }
    const filteredRankingTagList = tag_list.filter(r => !currentTagList.includes(r.label))
    filteredRankingTagList.forEach(r => result.add(r))
  }
  //match score achievement range
  if (isValidAchievementRange(searchTerm.value)) {
    return [{
      label: searchTerm.value,
      value: searchTerm.value,
      alias: searchTerm.value,
      needDs: true
    }]
  }
  //try to match version
  const versionFiltered = versionListForTag.filter(
    (v) =>
      (contains(v.label, searchTerm.value) ||
        contains(v.alias as string, searchTerm.value)) &&
      !currentTagList.includes(v.label)
  );
  if (versionFiltered.length > 0) versionFiltered.forEach((e) => result.add(e));
  return Array.from(result);
});
const ScoreStore = useScores()
const onSelectTag = (ev: ListboxItemSelectEvent<AcceptableValue>) => {
  if (typeof ev.detail.value === 'object') {
    if (ev.detail.value && ev.detail.value.needDs) {
      //check datasource is available
      if (ScoreStore.getSelectableSource.length === 0) {
        toast.error("请添加成绩数据源后再使用成绩相关Tag");
        return;
      }
    }
    searchTerm.value = '';
    modelValue.value?.push(ev.detail.value as Tag);
  }
  if (filteredTags.value.length === 0) {
    TagComboboxOpen.value = false;
  }
}
const onTagDelete = (item: Tag) => {
  if (modelValue.value) {
    const i = modelValue.value.findIndex(t => t.value == item.value);
    if (i !== -1) modelValue.value.splice(i, 1)
  }
};
const handelInteractOutSide = (event: Event) => {
  event.preventDefault();
  TagComboboxOpen.value = false
}
</script>

<template>
  <Combobox v-model="modelValue" v-model:open="TagComboboxOpen" :ignore-filter="true" :open-on-click="true">
    <ComboboxAnchor as-child>
      <TagsInput v-model="modelValue" class="px-2 gap-2 w-full flex-wrap">
        <div class="flex gap-2 flex-wrap items-center">
          <TagsInputItem v-for="item in modelValue" :key="item.label" :value="item.label">
            <TagsInputItemText />
            <TagsInputItemDelete @click="onTagDelete(item)" />
          </TagsInputItem>
        </div>

        <ComboboxInput v-model="searchTerm" as-child>
          <TagsInputInput placeholder="版本, 难度, 达成率..." class="flex-1 w-full p-0 border-none focus-visible:ring-0 h-auto"
            @keydown.enter.prevent />
          <TagsInputClear>
            <X />
          </TagsInputClear>
        </ComboboxInput>
      </TagsInput>

      <ComboboxList class="w-[var(--radix-combobox-trigger-width)]" @interact-outside="handelInteractOutSide">
        <ComboboxEmpty class="py-4 mx-8">
          没有符合的标签
        </ComboboxEmpty>
        <ComboboxGroup>
          <ScrollArea>
            <div class="max-h-72 w-full">
              <ComboboxItem v-for="tag in filteredTags" :key="tag.label" :value="tag" @select.prevent="onSelectTag">
                {{ tag.label }}
              </ComboboxItem>
            </div>
          </ScrollArea>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxAnchor>
  </Combobox>
</template>
