<script setup lang="ts">
import {
  Search,
  Settings,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Sun,
  Moon,
} from "@lucide/vue";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/shadcn/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/ui/collapsible";
import { Button } from '@/components/shadcn/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { toast } from 'vue-sonner'
import { useRouterHelper } from "@/utils/functionUtil";
import { useCollectionStore, type Collection } from "@/store/collections";
import { computed, ref, watch } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { Capacitor } from '@capacitor/core';
import { storeToRefs } from "pinia";
import ImportLevel from "./ImportLevel.vue";
import { useColorMode } from "@vueuse/core";
// Menu items.
const items = [
  {
    title: "歌曲搜索",
    url: "Home",
    icon: Search,
  },
  {
    title: "设置",
    url: "Settings",
    icon: Settings,
  },
];
const mode = useColorMode({ initialValue: 'light' });
const { JumpToFromEvent, JumpTo } = useRouterHelper()
const { EditCollectionName, DeleteCollection, newCollection } = useCollectionStore();
const { UserCollectionList, CurrentCollectionLabel } = storeToRefs(useCollectionStore());
//Dialog
const DialogStatus = ref<"none" | "add" | "edit" | "delete">("none")
const showDialogCompute = computed(() => DialogStatus.value !== 'none');
const showDialog = ref(false)
watch(() => showDialogCompute.value, () => {
  showDialog.value = showDialogCompute.value
})
const getCardInfo = computed(() => {
  switch (DialogStatus.value) {
    case "add":
      return { title: "添加新的合集", description: "", inputLabel: "合集名称", placeholder: "请输入合集名称" }
    case "edit":
      return { title: "修改合集名字", description: "", inputLabel: "合集名称", placeholder: "请输入合集名称" }
    case "delete":
      return { title: "删除该合集", description: "你确认删除该合集吗?", inputLabel: "", placeholder: "" }
    case "none":
      return { title: "", description: "", inputLabel: "", placeholder: "" }
  }
})
const dialogInput = ref("");
const targetIndex = ref(-1);
const importDialogShow = ref(false)
const ImportDialogTitle = "给合集批量导入成绩"
const ImportDialogDesc = ref("你可以根据定数批量导入一些成绩,如果你不需要，也可以关闭该对话。")
const ImportDescForAfterAdded = "你可以根据定数批量导入一些成绩,如果你不需要，也可以关闭该对话。"
const handelDialogOpen = (type: "add" | "edit" | "delete", index?: number) => {
  DialogStatus.value = type;
  dialogInput.value = ""
  if (index || index === 0) targetIndex.value = index
  showDialog.value = true
}
const handelDialogSubmit = () => {
  if (targetIndex.value === -1 && DialogStatus.value !== 'add') return;
  if (dialogInput.value.trim().length === 0 && DialogStatus.value !== 'delete') { toast("请输入合集名称"); return; }
  let result = { success: false, message: "修改失败" };
  switch (DialogStatus.value) {
    case "add":
      result = newCollection(dialogInput.value); break;
    case "edit":
      result = EditCollectionName(targetIndex.value, dialogInput.value); break;
    case "delete":
      result = DeleteCollection(targetIndex.value); break;
  }
  if (!result.success) {
    toast.error(result.message)
    return;
  }
  if (DialogStatus.value === 'add') {
    //open import score dialog
    ImportDialogDesc.value = ImportDescForAfterAdded
    CurrentCollectionLabel.value = dialogInput.value
    importDialogShow.value = true
  }
  DialogStatus.value = 'none'
  targetIndex.value = -1;
  dialogInput.value = ""
  showDialog.value = false

}
const { toggleSidebar } = useSidebar()
const handelCollectionJump = (coll: Collection) => {
  JumpTo({
    name: "Collection",
    query: {
      label: coll.label
    }
  }).then((_result) => {
    if (Capacitor.getPlatform() !== "web" || isSmallDevice.value) {
      toggleSidebar()
    }

  })
}
const handelPageJump = (e: Event, route: RouteLocationRaw) => {
  JumpToFromEvent(e, route).then((_result) => {
    if (Capacitor.getPlatform() !== "web" || isSmallDevice.value) {
      toggleSidebar()
    }
  })
}
//
const handelLevelImportDialog = (label: string) => {
  ImportDialogDesc.value = "你可以根据定数批量导入一些成绩,注意！！这会覆盖掉合集原有的内容。"
  CurrentCollectionLabel.value = label;
  importDialogShow.value = true
}
const isSmallDevice = ref(true);
watch(() => window.innerWidth, (newWidth) => {
  isSmallDevice.value = newWidth < 1024
}, { immediate: true })
</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel class="flex justify-between items-center pr-2">
          <span>🐖查歌器</span>
          <Button variant="ghost" size="icon" @click="mode = mode === 'dark' ? 'light' : 'dark'">
            <Sun class="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon class="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span class="sr-only">Toggle theme</span>
          </Button>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
              <SidebarMenuButton asChild class="cursor-pointer">
                <a @click="e => handelPageJump(e, { name: item.url })">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Collapsible defaultOpen class="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton class="flex items-center justify-between w-full">
                    <span>个人合集</span>
                    <ChevronDown
                      class="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub class="mr-0 px-0">
                    <SidebarMenuSubItem v-for="(collection, index) in UserCollectionList" :key="collection.label">
                      <SidebarMenuSubButton class="cursor-pointer group/item relative"
                        @click="handelCollectionJump(collection)">
                        <span class="truncate">{{ collection.label }}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button @click.stop
                              class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center">
                              <MoreHorizontal class="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>批量导入</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem @click="handelLevelImportDialog(collection.label)">定数导入
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem @click="handelDialogOpen('edit', index)">
                              <span>修改合集名字</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="handelDialogOpen('delete', index)">
                              <span class="text-red-600">删除合集</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton class="cursor-pointer" @click="handelDialogOpen('add')">
                        <div class="flex w-full items-center text-center">
                          <Plus />添加合集
                        </div>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <Dialog v-model:open="showDialog">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ getCardInfo?.title }}</DialogTitle>
        <DialogDescription>
          {{ getCardInfo?.description }}
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handelDialogSubmit" class="space-y-4">
        <div class="space-y-2" v-if="DialogStatus !== 'delete'">
          <Label for="input">{{ getCardInfo?.inputLabel }}</Label>
          <Input id="input" v-model="dialogInput" :placeholder="getCardInfo?.placeholder" required />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="DialogStatus = 'none'">
            取消
          </Button>
          <Button type="submit" class="bg-red-600" v-if="DialogStatus === 'delete'">
            确认
          </Button>
          <Button type="submit" class="" v-else>
            确认
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  <ImportLevel :title="ImportDialogTitle" :description="ImportDialogDesc" v-model:open="importDialogShow"></ImportLevel>
</template>
