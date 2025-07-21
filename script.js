import json from "./public/song_data_raw.json" with { type: 'json' };
import { conventVersionByInt } from "./src/utils/version"
import path from "path";
import fs from 'fs/promises'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const search_index = []
const getLevelValue = (index, map) => {
  const getLevelValueInternal = (_index, _map, type) => {
    let arr = _map["difficulties"][type]
    let result = []
    if (Array.isArray(arr) && index > arr.length - 1) return []
    if (Array.isArray(arr) && arr.length > 0) {
      if (arr[_index]["level_index"] === _index) {
        result.push(arr[_index].level_value)
        result.push(arr[_index].level)
      } else {
        let right = arr.find(a => a.level_index === _index);
        if (right) {
          result.push(right.level_value)
          result.push(right.level)
        }
      }
    }
    return result
  }
  let result = getLevelValueInternal(index, map, "standard")
  result.push(...getLevelValueInternal(index, map, "dx"))
  return result;
}
let count = 0
json.forEach(map => {
  let search_obj = JSON.parse(JSON.stringify(map))
  search_obj.version = conventVersionByInt(map.version)
  search_obj["level_0"] = getLevelValue(0, map)//绿
  search_obj["level_1"] = getLevelValue(1, map)//黄
  search_obj["level_2"] = getLevelValue(2, map)//红
  search_obj["level_3"] = getLevelValue(3, map)//紫
  search_obj["level_4"] = getLevelValue(4, map)//白
  search_index.push(search_obj)
})


const writeFile = async () => {
  await fs.writeFile(path.resolve(__dirname, './public/song_data_extra.json'), JSON.stringify(search_index))
}
writeFile();
