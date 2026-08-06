/**
 * maimai 达成率合法性验证（纯函数，无 Vue 依赖）
 *
 * 达成率公式：
 *   A = baseScore20 * 5 / total + bp20 / (breakNum * 20)
 *   其中 baseScore20 = Σ(count * weight * 20)，bp20 = Σ(count * bonus * 20)
 *
 * 整数化（避免浮点误差）：
 *   令 aN = round(A * 10000)（4 位小数精度），denom = LCM(total, breakNum * 20)
 *   K = aN * denom / 10000 必须是整数，否则 A 不可能由任何判定组合产生
 *   K = baseScore20 * c1 + bp20 * c2，c1 = 5*denom/total，c2 = denom/(breakNum*20)
 *
 * 验证策略：
 *   1. 预计算每个 bp20 对应的合法 breakBase20 范围（枚举 BREAK 分布）
 *   2. 枚举合法 bp20，解出 baseScore20，验证 BREAK 基础分与非 BREAK 基础分的可行性
 */

export interface NoteCounts {
  tap: number
  hold: number
  slide: number
  touch: number
  break: number
}

export interface VerifyResult {
  valid: boolean
}

// 权重 × 20
const W20 = {
  perfect: { tap: 20, hold: 40, slide: 60, touch: 20, break: 100 },
  great:   { tap: 16, hold: 32, slide: 48, touch: 16, break: [80, 60, 50] as const },
  good:    { tap: 10, hold: 20, slide: 30, touch: 10, break: 40 },
} as const

// 非 BREAK 各 Note 的失分步长（相对 perfect × 20）
const LOSS20 = {
  tap:   { gr:  4, gd: 10, ms: 20 },
  hold:  { gr:  8, gd: 20, ms: 40 },
  slide: { gr: 12, gd: 30, ms: 60 },
  touch: { gr:  4, gd: 10, ms: 20 },
} as const

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b
}

/**
 * 为给定 breakNum 预计算 bp20 → breakBase20 的 [min, max] 范围表
 * 时间 O(breakNum³)，breakNum=30 约 3ms，breakNum=154 约 70ms
 */
export function buildBreakPrecomp(breakNum: number): { min: number[]; max: number[] } {
  const size = breakNum * 20 + 1
  const bpMin = new Array<number>(size).fill(Infinity)
  const bpMax = new Array<number>(size).fill(-1)

  // s = cp + pf，枚举 (s, gr, gd)
  for (let s = 0; s <= breakNum; s++) {
    for (let gr = 0; gr <= breakNum - s; gr++) {
      const bbGrMin = gr * 50  // grBase min（全 gr1250）
      const bbGrMax = gr * 80  // grBase max（全 gr2000）
      for (let gd = 0; gd <= breakNum - s - gr; gd++) {
        // bp20 = 10s + extra5 + 8gr + 6gd，extra5 ∈ {0, 5, ..., 10s}
        const bp20Base = 10 * s + 8 * gr + 6 * gd
        // breakBase20 = 100s + grBase + 40gd，与 extra5 无关
        const bb20Base = 100 * s + 40 * gd
        const curMin = bb20Base + bbGrMin
        const curMax = bb20Base + bbGrMax
        for (let extra5 = 0; extra5 <= 10 * s; extra5 += 5) {
          const bp20 = bp20Base + extra5
          if (bp20 > breakNum * 20) break
          if (curMin < bpMin[bp20]) bpMin[bp20] = curMin
          if (curMax > bpMax[bp20]) bpMax[bp20] = curMax
        }
      }
    }
  }

  return { min: bpMin, max: bpMax }
}

/**
 * 验证达成率是否合法
 *
 * @param achievement 达成率（如 100.4523），精度不超过 4 位小数
 * @param counts 谱面各 Note 物量
 * @param precomp buildBreakPrecomp 的结果（相同 breakNum 可复用）
 */
export function verifyAchievement(
  achievement: number,
  counts: NoteCounts,
  precomp: { min: number[]; max: number[] },
): VerifyResult {
  const { tap, hold, slide, touch, break: breakNum } = counts
  const total = tap + hold * 2 + slide * 3 + touch + breakNum * 5
  if (!total || !breakNum) return { valid: false }

  // 整数化：aN = round(A * 10000)，denom = LCM(total, breakNum*20)
  // 注意：游戏显示 round(A*10000)/10000，真实 A*denom 是整数但 aN*denom/10000 未必整除。
  // 因此枚举 K 的范围而非单一值：K ∈ [ceil((2aN-1)*denom/20000), floor((2aN+1)*denom/20000)]
  const aN = Math.round(achievement * 10000)
  const denom = lcm(total, breakNum * 20)
  const c1 = 5 * denom / total           // baseScore20 的系数（整数）
  const c2 = denom / (breakNum * 20)     // bp20 的系数（整数）

  // 游戏显示值可能是 floor(A*10000)/10000，也可能是 round。
  // 兼容两者：真实 A 可能落在 [(aN-0.5)/10000, (aN+1)/10000)
  const kLo = Math.ceil((2 * aN - 1) * denom / 20000)
  const kHi = Math.ceil((aN + 1) * denom / 10000) - 1

  const maxNB20 = tap * W20.perfect.tap + hold * W20.perfect.hold +
                  slide * W20.perfect.slide + touch * W20.perfect.touch
  const maxBase20 = breakNum * W20.perfect.break + maxNB20
  const { min: bpMin, max: bpMax } = precomp

  for (let bp20 = 0; bp20 <= breakNum * 20; bp20++) {
    // 对应此 bp20，合法 K 需满足 K - bp20*c2 = baseScore20*c1 ≥ 0
    // 即 K ∈ [bp20*c2, kHi]，且 (K - bp20*c2) % c1 == 0
    const numLo = Math.max(0, kLo - bp20 * c2)
    const numHi = kHi - bp20 * c2
    if (numHi < 0) break
    // 找满足 num % c1 == 0 的最小 num ≥ numLo
    const startNum = Math.ceil(numLo / c1) * c1
    if (startNum > numHi) continue

    // bp20 对应的 breakBase20 范围（与 baseScore20 无关，提前查表）
    const bbLoBp = bpMin[bp20]
    const bbHiBp = bpMax[bp20]
    if (bbHiBp < 0) continue  // bp20 不可达

    // 枚举所有满足 (K - bp20*c2) % c1 == 0 的合法 baseScore20
    for (let num = startNum; num <= numHi; num += c1) {
      const baseScore20 = num / c1
      if (baseScore20 > maxBase20) break

      // 交集：[max(0, baseScore20-maxNB20), min(baseScore20, breakNum*100)] ∩ [bbLoBp, bbHiBp]
      const bbLo = Math.max(Math.max(0, baseScore20 - maxNB20), bbLoBp)
      const bbHi = Math.min(Math.min(baseScore20, breakNum * W20.perfect.break), bbHiBp)
      if (bbLo > bbHi) continue

      // breakBase20 是 10 的倍数（100s/40gd/grBase 均是 10 的倍数）
      const bb20Start = Math.ceil(bbLo / 10) * 10
      if (bb20Start > bbHi) continue

      // 枚举候选 breakBase20，验证非 BREAK 部分
      for (let bb20 = bb20Start; bb20 <= bbHi; bb20 += 10) {
        const nb20 = baseScore20 - bb20
        if (canNonBreakReach(nb20, tap, hold, slide, touch)) return { valid: true }
      }
    }
  }

  return { valid: false }
}

type NonBreakKey = 'tap' | 'hold' | 'slide' | 'touch'

/**
 * 贪心验证非 BREAK 基础分×20 是否可达
 * 按 tap→hold→slide→touch 顺序分配，每次找满足约束的最大可行得分
 */
function canNonBreakReach(S: number, tap: number, hold: number, slide: number, touch: number): boolean {
  if (S < 0) return false
  const ns: Record<NonBreakKey, number> = { tap, hold, slide, touch }
  const maxS: Record<NonBreakKey, number> = {
    tap:   tap   * W20.perfect.tap,
    hold:  hold  * W20.perfect.hold,
    slide: slide * W20.perfect.slide,
    touch: touch * W20.perfect.touch,
  }
  const keys: NonBreakKey[] = ['tap', 'hold', 'slide', 'touch']
  let remaining = S

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const n = ns[key]
    const max = maxS[key]
    const loss = LOSS20[key]

    // 后续 Note 能提供的最大分
    let laterMax = 0
    for (let j = i + 1; j < keys.length; j++) laterMax += maxS[keys[j]]

    const minContrib = Math.max(0, remaining - laterMax)
    const maxContrib = Math.min(max, remaining)
    if (minContrib > maxContrib) return false

    // 在 [minContrib, maxContrib] 内找可达得分
    const maxScore = n * W20.perfect[key as 'tap']
    const minLoss = maxScore - maxContrib
    const maxLoss = maxScore - minContrib
    if (minLoss > n * loss.ms) return false

    const g = gcd(gcd(loss.gr, loss.gd), loss.ms)
    const startLoss = Math.ceil(minLoss / g) * g
    const endLoss = Math.min(maxLoss, n * loss.ms)
    if (startLoss > endLoss) return false

    let foundLoss = -1
    for (let lv = startLoss; lv <= endLoss; lv += g) {
      if (canDecomposeLoss(lv, n, loss.gr, loss.gd, loss.ms)) { foundLoss = lv; break }
    }
    if (foundLoss < 0) return false
    remaining -= (maxScore - foundLoss)
  }

  return remaining === 0
}

/** 判断 lossTotal 能否被分解为 a*gr + b*gd + c*ms，a+b+c ≤ maxCount */
function canDecomposeLoss(lossTotal: number, maxCount: number, gr: number, gd: number, ms: number): boolean {
  const maxMS = Math.min(Math.floor(lossTotal / ms), maxCount)
  for (let c = maxMS; c >= 0; c--) {
    const rem1 = lossTotal - c * ms
    const maxGD = Math.min(Math.floor(rem1 / gd), maxCount - c)
    for (let b = maxGD; b >= 0; b--) {
      const rem2 = rem1 - b * gd
      if (rem2 % gr !== 0) continue
      const a = rem2 / gr
      if (a >= 0 && a <= maxCount - c - b) return true
    }
  }
  return false
}
