/**
 * maimai 达成率核心计算函数（纯函数，无 Vue 依赖）
 *
 * 基础分占 100%，BREAK 奖励占 1%（总分 101%）
 * 达成率 = Σ(各 Note 基础得分) / total * 100  +  Σ(BREAK 奖励)
 */

export type NoteKey = 'tap' | 'hold' | 'slide' | 'touch' | 'break'

/** 各 Note 各判定的基础权重 */
export const BASIC_WEIGHT = {
  perfect: { tap: 1, hold: 2, slide: 3, touch: 1, break: 5 },
  great:   { tap: 0.8, hold: 1.6, slide: 2.4, touch: 0.8, break: [4, 3, 2.5] as const },
  good:    { tap: 0.5, hold: 1,   slide: 1.5, touch: 0.5, break: 2 },
  miss:    { tap: 0,   hold: 0,   slide: 0,   touch: 0,   break: 0 },
} as const

/** BREAK 奖励（占总分 1% 的来源） */
export const BREAK_BONUS = {
  criticalPerfect: 1,         // CP
  perfect: [0.75, 0.5] as const, // PF 细分
  great: 0.4,                 // GR（各细分相同奖励）
  good: 0.3,                  // GD
} as const

/** 计算谱面总权重（denominator） */
export function calcTotal(counts: Record<NoteKey, number>): number {
  return (
    counts.tap   * BASIC_WEIGHT.perfect.tap   +
    counts.hold  * BASIC_WEIGHT.perfect.hold  +
    counts.slide * BASIC_WEIGHT.perfect.slide +
    counts.touch * BASIC_WEIGHT.perfect.touch +
    counts.break * BASIC_WEIGHT.perfect.break
  )
}

/**
 * 判定矩阵输入（每行 Note，每列判定）
 * CP = criticalPerfect, PF = perfect, GR = great, GD = good, MS = miss
 */
export interface JudgmentMatrix {
  tap:   { cp: number; pf: number; gr: number; gd: number; ms: number }
  hold:  { cp: number; pf: number; gr: number; gd: number; ms: number }
  slide: { cp: number; pf: number; gr: number; gd: number; ms: number }
  touch: { cp: number; pf: number; gr: number; gd: number; ms: number }
  break: { cp: number; pf: number; gr: number; gd: number; ms: number }
}

/** BREAK 细分枚举的一个组合 */
export interface BreakSplit {
  pf075: number  // PF 拆分：0.75
  pf050: number  // PF 拆分：0.5
  gr2000: number // GR 拆分：2000
  gr1500: number // GR 拆分：1500
  gr1250: number // GR 拆分：1250
}

/** 单个组合的计算结果 */
export interface CalcResult {
  achievement: number   // 达成率（保留 4 位小数的数值，如 100.9999）
  split: BreakSplit
}

/**
 * 计算某个 BREAK 细分组合下的实际达成率
 * @param matrix  用户填写的判定矩阵
 * @param split   当前枚举的 BREAK 细分
 * @param total   谱面总权重（由 calcTotal 得到）
 * @param breakNum BREAK 总物量
 */
export function calcAchievement(
  matrix: JudgmentMatrix,
  split: BreakSplit,
  total: number,
  breakNum: number,
): number {
  if (!total || !breakNum) return 0

  // 非 BREAK Note 的基础分
  let baseScore = 0
  const nonBreak = ['tap', 'hold', 'slide', 'touch'] as const
  for (const key of nonBreak) {
    const row = matrix[key]
    baseScore +=
      (row.cp + row.pf) * BASIC_WEIGHT.perfect[key] +
      row.gr * BASIC_WEIGHT.great[key] +
      row.gd * BASIC_WEIGHT.good[key]
    // ms weight is 0, skip
  }

  // BREAK 基础分
  const bRow = matrix.break
  const bw = BASIC_WEIGHT
  baseScore +=
    bRow.cp * bw.perfect.break +
    // PF 细分各自用对应基础权重（均等于 5 — 奖励另计）
    split.pf075 * bw.perfect.break +
    split.pf050 * bw.perfect.break +
    // GR 细分
    split.gr2000 * bw.great.break[0] +
    split.gr1500 * bw.great.break[1] +
    split.gr1250 * bw.great.break[2] +
    bRow.gd * bw.good.break +
    bRow.ms * bw.miss.break

  const baseAch = (baseScore / total) * 100

  // BREAK 奖励（占 1% 部分）
  const bb = BREAK_BONUS
  const bonusAch =
    (bRow.cp  * bb.criticalPerfect +
     split.pf075 * bb.perfect[0] +
     split.pf050 * bb.perfect[1] +
     (split.gr2000 + split.gr1500 + split.gr1250) * bb.great +
     bRow.gd * bb.good) / breakNum

  return Math.round((baseAch + bonusAch) * 10000) / 10000
}

/**
 * 枚举所有 BREAK PF/GR 细分组合并计算达成率
 * 守恒约束：pf075 + pf050 === matrix.break.pf
 *           gr2000 + gr1500 + gr1250 === matrix.break.gr
 */
export function enumerateBreakSplits(
  matrix: JudgmentMatrix,
  total: number,
  breakNum: number,
): CalcResult[] {
  const pfTotal = matrix.break.pf
  const grTotal = matrix.break.gr
  const results: CalcResult[] = []

  for (let pf075 = 0; pf075 <= pfTotal; pf075++) {
    const pf050 = pfTotal - pf075
    for (let gr2000 = 0; gr2000 <= grTotal; gr2000++) {
      for (let gr1500 = 0; gr1500 <= grTotal - gr2000; gr1500++) {
        const gr1250 = grTotal - gr2000 - gr1500
        const split: BreakSplit = { pf075, pf050, gr2000, gr1500, gr1250 }
        results.push({
          achievement: calcAchievement(matrix, split, total, breakNum),
          split,
        })
      }
    }
  }

  return results
}

/**
 * 按与目标达成率的绝对差排序
 */
export function sortByTarget(results: CalcResult[], target: number): CalcResult[] {
  return [...results].sort((a, b) => Math.abs(a.achievement - target) - Math.abs(b.achievement - target))
}

/**
 * 计算给定起始达成率与谱面总权重下，允许扣除的 TAP Great（粉）容错数
 * 最终达成率必须严格大于 100.5000%
 */
export function calcTapGreatTolerance(
  startingAch: number,
  totalWeight: number
): { tolerance: number; achievable: boolean } {
  if (totalWeight <= 0 || startingAch <= 100.5) {
    return { tolerance: 0, achievable: false }
  }

  // 初始估算
  let k = Math.max(0, Math.floor(((startingAch - 100.5) * totalWeight) / 20))

  // 向前步进（如果下一个 k 仍严格 > 100.5000%）
  while (true) {
    const nextK = k + 1
    const nextAch = Math.round((startingAch - (nextK * 0.2 / totalWeight) * 100) * 10000) / 10000
    if (nextAch > 100.5) {
      k = nextK
    } else {
      break
    }
  }

  // 向后步退（如果当前 k 导致达成率 <= 100.5000%）
  while (k > 0) {
    const currentAch = Math.round((startingAch - (k * 0.2 / totalWeight) * 100) * 10000) / 10000
    if (currentAch > 100.5) {
      break
    }
    k--
  }

  const finalAch = Math.round((startingAch - (k * 0.2 / totalWeight) * 100) * 10000) / 10000
  if (finalAch > 100.5) {
    return { tolerance: k, achievable: true }
  }
  return { tolerance: 0, achievable: false }
}

export interface BreakToleranceScenario {
  label: string
  ratioLabel: string
  tolerance: number
  achievable: boolean
  startingAch: number
  cpCount: number
  pfCount: number
}

/**
 * 计算指定 BREAK 预设比例下的鸟加（严格 > 100.5000%）容错
 * @param counts Note 物量
 * @param cpRatio BREAK 为 CP 的比例 (1.0, 0.8, 0.5)
 * @param label 场景标签描述
 * @param ratioLabel 比例标签描述
 */
export function calcBreakScenarioTolerance(
  counts: Record<NoteKey, number>,
  cpRatio: number,
  label: string,
  ratioLabel: string
): BreakToleranceScenario {
  const total = calcTotal(counts)
  const breakNum = counts.break || 0

  if (total <= 0 || breakNum <= 0) {
    return {
      label,
      ratioLabel,
      tolerance: 0,
      achievable: false,
      startingAch: 100,
      cpCount: 0,
      pfCount: 0,
    }
  }

  const cpCount = Math.round(breakNum * cpRatio)
  const pfCount = breakNum - cpCount
  const bonusAch = (cpCount * BREAK_BONUS.criticalPerfect + pfCount * BREAK_BONUS.perfect[0]) / breakNum
  const startingAch = Math.round((100 + bonusAch) * 10000) / 10000

  const { tolerance, achievable } = calcTapGreatTolerance(startingAch, total)
  return {
    label,
    ratioLabel,
    tolerance,
    achievable,
    startingAch,
    cpCount,
    pfCount,
  }
}

