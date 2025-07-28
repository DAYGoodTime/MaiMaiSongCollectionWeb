<script setup lang="ts">
import {
  Search,
  Settings,
  Plus,
  ChevronDown,
  MoreHorizontal
} from "lucide-vue-next";
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
} from "@/components/shadcn/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { computed, ref } from "vue";
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
const { JumpToFromEvent, JumpTo } = useRouterHelper()
const { EditCollectionName, DeleteCollection, newCollection } = useCollectionStore();
const CollectionStore = useCollectionStore();
//Dialog
const DialogStatus = ref<"none" | "add" | "edit" | "delete">("none")
const showDialog = computed(() => DialogStatus.value !== 'none');
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
const handelDialogOpen = (type: "add" | "edit" | "delete", index?: number) => {
  DialogStatus.value = type;
  if (index) targetIndex.value = index;
}
const handelDialogSubmit = () => {
  if (targetIndex.value === -1 && DialogStatus.value !== 'add') return;
  if (dialogInput.value.trim().length === 0 && DialogStatus.value !== 'delete') toast("请输入合集名称")
  let success = true;
  switch (DialogStatus.value) {
    case "add":
      newCollection(dialogInput.value); break;
    case "edit":
      success = EditCollectionName(targetIndex.value, dialogInput.value); break;
    case "delete":
      success = DeleteCollection(targetIndex.value); break;
  }
  if (!success) {
    toast("修改失败")
  } {
    DialogStatus.value = 'none'
    targetIndex.value = -1;
    dialogInput.value = ""
  }
}
const handelCollectionJump = (coll: Collection) => {
  JumpTo({
    name: "Collection",
    query: {
      label: coll.label
    }
  })
}

</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>🐖查歌器</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
              <SidebarMenuButton asChild class="cursor-pointer">
                <a @click="e => JumpToFromEvent(e, { name: item.url })">
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
                    <SidebarMenuSubItem v-for="(collection, index) in CollectionStore.UserCollectionList"
                      :key="collection.label">
                      <SidebarMenuSubButton class="cursor-pointer group/item relative"
                        @click="handelCollectionJump(collection)">
                        <span>{{ collection.label }}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button @click.stop
                              class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center">
                              <MoreHorizontal class="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
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
</template>
