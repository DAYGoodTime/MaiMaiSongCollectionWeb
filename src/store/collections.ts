import { exportFile, useRouterHelper } from "@/utils/functionUtil";
import { getFromKey, putToStorage } from "@/utils/storage";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage, type RemovableRef } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
//test
const DEFAULT_LIST = [
  {
    label: "13分数列表",
    list: new Set<string>()
  },
  {
    label: "14分数列表",
    list: new Set<string>()
  }
]
export interface Collection {
  label: string,
  list: Set<string> //存难度id (${song_id}_${type}_${level_id})
}
export interface ScoreMessage {
  [key: string]: { message: string } //key为score id
}
const CollectionSerializer = {
  read: (raw: string) => {
    const objList = JSON.parse(raw);
    const result = []
    for (const obj of objList) {
      result.push({ label: obj.label, list: new Set<string>(obj.list) })
    }
    return result;
  },
  write: (objList: Collection[]) => {
    const list = []
    for (const obj of objList) {
      list.push({ label: obj.label, list: [...obj.list] })
    }
    return JSON.stringify(list);
  }
}
const MAX_LABEL_LENGTH = 30
export const useCollectionStore = defineStore("collections", () => {
  const UserCollectionList: Ref<Collection[]> = useLocalStorage("user_collections", DEFAULT_LIST, {
    serializer: CollectionSerializer
  })
  const CurrentCollectionLabel = ref("")
  const route = useRoute()
  const routerHelper = useRouterHelper()
  const getCollectionNames = computed(() => {
    return UserCollectionList.value.map(c => c.label);
  })
  const getCollectionByLabel = (label: string) => {
    return UserCollectionList.value.find(c => c.label === label)
  }
  const EditCollectionName = (index: number, name: string): { success: boolean, message: string } => {
    if (index >= UserCollectionList.value.length) return { success: false, message: "合集不存在" };
    if (hasCollection(name)) {
      return { success: false, message: "该合集已存在" }
    }
    if (name.length >= MAX_LABEL_LENGTH) {
      return { success: false, message: "合集名字过长" }
    }
    UserCollectionList.value[index].label = name;
    if (route.query.label == CurrentCollectionLabel.value) {
      routerHelper.JumpTo({
        name: "Collection",
        query: {
          label: name
        }
      })
    }
    toast.success("修改成功")
    return { success: true, message: "OK" };
  }
  const DeleteCollection = (index: number): { success: boolean, message: string } => {
    if (index >= UserCollectionList.value.length) return { success: false, message: "合集不存在" };
    UserCollectionList.value.splice(index, 1)
    if (route.query.label == CurrentCollectionLabel.value) {
      routerHelper.backHome();
      toast.info("当前合集被删除，已为你跳转回主页")
    }
    toast.success("删除成功")
    return { success: true, message: "OK" };
  }
  const newCollection = (label: string): { success: boolean, message: string } => {
    if (hasCollection(label)) {
      return { success: false, message: "该合集已存在" }
    }
    if (label.length >= MAX_LABEL_LENGTH) {
      return { success: false, message: "合集名字过长" }
    }
    UserCollectionList.value.push({
      label,
      list: new Set<string>()
    })
    toast.success("添加成功")
    return { success: true, message: "OK" }
  }
  const hasCollection = (name: string) => {
    return UserCollectionList.value.findIndex(c => c.label === name) !== -1
  }
  const pushScoreToCollection = (label: string, score_id: string): boolean => {
    const coll = UserCollectionList.value.find(c => c.label === label)
    if (!coll) return false;
    coll.list.add(score_id)
    return true;
  }
  const removeFromCollection = (score_id: string,): boolean => {
    const coll = getCollectionByLabel(CurrentCollectionLabel.value);
    if (!coll) return false;
    return coll.list.delete(score_id)
  }
  const exportCollectionData = () => {
    if (UserCollectionList.value.length > 0) {
      const fileNameColl = formatDate(new Date()) + "-collection.json";
      exportFile(CollectionSerializer.write(UserCollectionList.value), fileNameColl)
      const fileNameMessage = formatDate(new Date()) + "-messages.json";
      exportFile(JSON.stringify(CollectionMessageMap.value), fileNameMessage)
    }
  }
  const KEY_COLL_PATTEN = "_coll"
  const uploadCollectionData = async (name: string) => {
    const arr: any[] = []
    UserCollectionList.value.forEach(c => {
      arr.push({
        label: c.label,
        list: [...c.list]
      })
    })
    try {
      if (await putToStorage(`${name}${KEY_COLL_PATTEN}`, JSON.stringify({
        colls: arr,
        messages: CollectionMessageMap.value
      }))) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      toast.error("网络不佳，使用该功能需要加速器", { position: "top-center" })
      return false;
    }
  }
  const downloadCollectionData = async (name: string) => {
    try {
      const data = await getFromKey(`${name}${KEY_COLL_PATTEN}`)
      if (data) {
        CollectionMessageMap.value = data.messages
        UserCollectionList.value = CollectionSerializer.read(JSON.stringify(data.colls))
        return true;
      } else return false;
    } catch (error) {
      toast.error("网络不佳，使用该功能需要加速器", { position: "top-center" })
      return false;
    }
  }
  //
  const CollectionMessageMap: RemovableRef<ScoreMessage> = useLocalStorage("user_score_message", {})
  return {
    UserCollectionList,
    CurrentCollectionLabel,
    getCollectionNames,
    EditCollectionName,
    getCollectionByLabel,
    DeleteCollection,
    newCollection,
    pushScoreToCollection,
    removeFromCollection,
    hasCollection,
    CollectionMessageMap,
    exportCollectionData,
    uploadCollectionData,
    downloadCollectionData
  };
});
