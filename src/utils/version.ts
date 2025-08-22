export const versionList = [
  {
    icon: "",
    id: "maimai",
    label_full: "maimai",
    alias: "初"
  },
  {
    icon: "",
    id: "maimai PLUS",
    label_full: "maimai PLUS",
    alias: "真",
  },
  {
    icon: "",
    id: "maimai GreeN",
    label_full: "maimai GreeN",
    alias: "超",
  },
  {
    icon: "",
    id: "maimai GreeN PLUS",
    label_full: "maimai GreeN PLUS",
    alias: "激",
  },
  {
    icon: "",
    id: "maimai ORANGE",
    label_full: "maimai ORANGE",
    alias: "橙",
  },
  {
    icon: "",
    id: "maimai ORANGE PLUS",
    label_full: "maimai ORANGE PLUS",
    alias: "晓",
  },
  {
    icon: "",
    id: "maimai PiNK",
    label_full: "maimai PiNK",
    alias: "桃",
  },
  {
    icon: "",
    id: "maimai PiNK PLUS",
    label_full: "maimai PiNK PLUS",
    alias: "櫻",
  },
  {
    icon: "",
    id: "maimai MURASAKi",
    label_full: "maimai MURASAKi",
    alias: "紫",
  },
  {
    icon: "",
    id: "maimai MURASAKi PLUS",
    label_full: "maimai MURASAKi PLUS",
    alias: "菫",
  },
  {
    icon: "",
    id: "maimai MiLK",
    label_full: "maimai MiLK",
    alias: "白",
  },
  {
    icon: "",
    id: "maimai MiLK PLUS",
    label_full: "maimai MiLK PLUS",
    alias: "雪",
  },
  {
    icon: "",
    id: "maimai FiNALE",
    label_full: "maimai FiNALE",
    alias: "辉",
  },
  {
    icon: "",
    id: "ALL FiNALE",
    label_full: "ALL FiNALE",
    alias: "舞",
  },
  {
    icon: "",
    id: "maimai DX",
    label_full: "舞萌DX",
    alias: "熊 華 DX",
  },
  {
    icon: "",
    id: "maimai DX 2021",
    label_full: "舞萌DX2021",
    alias: "爽 煌 2021",
  },
  {
    icon: "",
    id: "maimai DX 2022",
    label_full: "舞萌DX2022",
    alias: "宙 星 2022",
  },
  {
    icon: "",
    id: "maimai DX 2023",
    label_full: "舞萌DX2023",
    alias: "祭 祝 2023",
  },
  {
    icon: "",
    id: "maimai DX 2024",
    label_full: "舞萌DX2024",
    alias: "双 宴 2024",
  },
  {
    icon: "",
    id: "maimai DX 2025",
    label_full: "舞萌DX2025",
    alias: "镜 2025",
  },];
export const getVersionListStr = () => {
  return versionList.map((o) => o.label_full);
};
const versionMap = new Map<number, string>([
  [10000, "maimai"],
  [11000, "maimai PLUS"],
  [12000, "maimai GreeN"],
  [13000, "maimai GreeN PLUS"],
  [14000, "maimai ORANGE"],
  [15000, "maimai ORANGE PLUS"],
  [16000, "maimai PiNK"],
  [17000, "maimai PiNK PLUS"],
  [18000, "maimai MURASAKi"],
  [18500, "maimai MURASAKi PLUS"],
  [19000, "maimai MiLK"],
  [19500, "maimai MiLK PLUS"],
  [19900, "maimai FiNALE"],
  [20000, "舞萌DX"],
  [21000, "舞萌DX2021"],
  [22000, "舞萌DX2022"],
  [23000, "舞萌DX2023"],
  [24000, "舞萌DX2024"],
  [25000, "舞萌DX2025"],
]);
// 预排序的键数组（升序）
const sortedKeys = Array.from(versionMap.keys()).sort((a, b) => a - b);
export const conventVersionByInt = (version: number) => {
  if (versionMap.has(version)) {
    return versionMap.get(version);
  } else {
    // 边界处理：当数值小于最小版本时
    if (version < sortedKeys[0]) return undefined;
    // 二分查找实现
    let left = 0;
    let right = sortedKeys.length - 1;
    let resultKey = sortedKeys[0]; // 默认取最小值
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const currentKey = sortedKeys[mid];
      if (currentKey === version) {
        resultKey = currentKey;
        break;
      } else if (currentKey < version) {
        resultKey = currentKey;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return versionMap.get(resultKey);
  }
};
export function isAllFinal(version: string) {
  return !version.includes("DX");
}
