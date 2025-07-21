import { exportFile } from "@/utils/functionUtil";
import { getFromKey, putToStorage } from "@/utils/storage";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage, type RemovableRef } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
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
export const useCollectionStore = defineStore("collections", () => {
  const UserCollectionList: Ref<Collection[]> = useLocalStorage("user_collections", DEFAULT_LIST, {
    serializer: CollectionSerializer
  })
  const CurrentCollectionLabel = ref("")
  const getCollectionNames = computed(() => {
    return UserCollectionList.value.map(c => c.label);
  })
  const getCollectionByLabel = (label: string) => {
    return UserCollectionList.value.find(c => c.label === label)
  }
  const EditCollectionName = (index: number, name: string): boolean => {
    if (index >= UserCollectionList.value.length) return false;
    UserCollectionList.value[index].label = name;
    return true;
  }
  const DeleteCollection = (index: number) => {
    if (index >= UserCollectionList.value.length) return false;
    UserCollectionList.value.splice(index, 1)
    return true;
  }
  const newCollection = (label: string) => {
    UserCollectionList.value.push({
      label,
      list: new Set<string>()
    })
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
    if (await putToStorage(`${name}${KEY_COLL_PATTEN}`, JSON.stringify({
      colls: arr,
      messages: CollectionMessageMap.value
    }))) {
      return true;
    } else {
      return false;
    }
  }
  const downloadCollectionData = async (name: string) => {
    const data = await getFromKey(`${name}${KEY_COLL_PATTEN}`)
    if (data) {
      CollectionMessageMap.value = data.messages
      UserCollectionList.value = CollectionSerializer.read(JSON.stringify(data.colls))
      return true;
    } else return false;
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
