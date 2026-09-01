/// <reference types="node" />
/**
 * 达成率计算校验 — 用 vite-node 运行：
 *   npx vite-node src/utils/achievementCalc.test.ts
 */
import {
  calcTotal,
  calcAchievement,
  enumerateBreakSplits,
  sortByTarget,
  calcTapGreatTolerance,
  calcBreakScenarioTolerance,
  type JudgmentMatrix,
  type BreakSplit,
} from './achievementCalc'

let passed = 0
let failed = 0

function assert(desc: string, cond: boolean) {
  if (cond) { console.log(`  PASS  ${desc}`); passed++ }
  else       { console.error(`  FAIL  ${desc}`); failed++ }
}

function approx(a: number, b: number, eps = 0.0001) {
  return Math.abs(a - b) <= eps
}

// ── 1. BREAK 拆分数量守恒 ────────────────────────────────────────────────────
console.log('\n[1] BREAK 拆分数量守恒')
{
  const matrix: JudgmentMatrix = {
    tap:   { cp: 5, pf: 0, gr: 0, gd: 0, ms: 0 },
    hold:  { cp: 3, pf: 0, gr: 0, gd: 0, ms: 0 },
    slide: { cp: 2, pf: 0, gr: 0, gd: 0, ms: 0 },
    touch: { cp: 1, pf: 0, gr: 0, gd: 0, ms: 0 },
    break: { cp: 0, pf: 3, gr: 2, gd: 0, ms: 0 }, // pf=3, gr=2
  }
  const counts = { tap: 5, hold: 3, slide: 2, touch: 1, break: 5 }
  const total = calcTotal(counts)
  const results = enumerateBreakSplits(matrix, total, counts.break)

  // pf 组合数应为 pfTotal+1 = 4；gr 组合数为 (grTotal+1)*(grTotal+2)/2 = 6
  // 总组合数 = 4 * 6 = 24
  assert('枚举结果总数正确 (4×6=24)', results.length === 24)

  let allPfConserved = true
  let allGrConserved = true
  for (const r of results) {
    if (r.split.pf075 + r.split.pf050 !== 3) allPfConserved = false
    if (r.split.gr2000 + r.split.gr1500 + r.split.gr1250 !== 2) allGrConserved = false
  }
  assert('所有组合 PF 拆分守恒 (pf075+pf050===3)', allPfConserved)
  assert('所有组合 GR 拆分守恒 (gr2000+gr1500+gr1250===2)', allGrConserved)
}

// ── 2. 达成率公式 ────────────────────────────────────────────────────────────
console.log('\n[2] 达成率公式')
{
  // 简单谱面：仅 1 个 BREAK，CP 判定 → 期望 101%
  const singleBreakMatrix: JudgmentMatrix = {
    tap:   { cp: 0, pf: 0, gr: 0, gd: 0, ms: 0 },
    hold:  { cp: 0, pf: 0, gr: 0, gd: 0, ms: 0 },
    slide: { cp: 0, pf: 0, gr: 0, gd: 0, ms: 0 },
    touch: { cp: 0, pf: 0, gr: 0, gd: 0, ms: 0 },
    break: { cp: 1, pf: 0, gr: 0, gd: 0, ms: 0 },
  }
  const total = calcTotal({ tap: 0, hold: 0, slide: 0, touch: 0, break: 1 })
  const split: BreakSplit = { pf075: 0, pf050: 0, gr2000: 0, gr1500: 0, gr1250: 0 }
  const ach = calcAchievement(singleBreakMatrix, split, total, 1)
  // base: 5/5*100 = 100; bonus: 1*1/1 = 1 → 101
  assert('单 BREAK CP 达成率 = 101.0000', approx(ach, 101))

  // 仅 1 个 BREAK，PF(0.75) → base 100, bonus 0.75 → 100.75
  const pf075Matrix: JudgmentMatrix = {
    ...singleBreakMatrix,
    break: { cp: 0, pf: 1, gr: 0, gd: 0, ms: 0 },
  }
  const achPF = calcAchievement(pf075Matrix, { pf075: 1, pf050: 0, gr2000: 0, gr1500: 0, gr1250: 0 }, total, 1)
  assert('单 BREAK PF(0.75) 达成率 = 100.75', approx(achPF, 100.75))

  // 仅 1 个 BREAK，PF(0.5) → 100.5
  const achPF5 = calcAchievement(pf075Matrix, { pf075: 0, pf050: 1, gr2000: 0, gr1500: 0, gr1250: 0 }, total, 1)
  assert('单 BREAK PF(0.5) 达成率 = 100.5', approx(achPF5, 100.5))

  // 仅 1 个 BREAK，GR(2000) → base 4/5*100=80, bonus 0.4 → 80.4
  const grMatrix: JudgmentMatrix = {
    ...singleBreakMatrix,
    break: { cp: 0, pf: 0, gr: 1, gd: 0, ms: 0 },
  }
  const achGR2000 = calcAchievement(grMatrix, { pf075: 0, pf050: 0, gr2000: 1, gr1500: 0, gr1250: 0 }, total, 1)
  assert('单 BREAK GR(2000) 达成率 = 80.4', approx(achGR2000, 80.4))

  // 仅 1 个 BREAK，GR(1250) → base 2.5/5*100=50, bonus 0.4 → 50.4
  const achGR1250 = calcAchievement(grMatrix, { pf075: 0, pf050: 0, gr2000: 0, gr1500: 0, gr1250: 1 }, total, 1)
  assert('单 BREAK GR(1250) 达成率 = 50.4', approx(achGR1250, 50.4))
}

// ── 3. 排序 ──────────────────────────────────────────────────────────────────
console.log('\n[3] 按目标达成率排序')
{
  const results = [
    { achievement: 100.5, split: { pf075: 0, pf050: 1, gr2000: 0, gr1500: 0, gr1250: 0 } },
    { achievement: 101.0, split: { pf075: 0, pf050: 0, gr2000: 0, gr1500: 0, gr1250: 0 } },
    { achievement: 100.75, split: { pf075: 1, pf050: 0, gr2000: 0, gr1500: 0, gr1250: 0 } },
  ]
  const sorted = sortByTarget(results, 100.8)
  assert('最近目标 100.8 的结果排首位 (100.75)', approx(sorted[0].achievement, 100.75))
  assert('第二近为 101.0', approx(sorted[1].achievement, 101.0))
  assert('最远为 100.5', approx(sorted[2].achievement, 100.5))
}

// ── 4. 鸟加容错（>100.5000%）计算 ───────────────────────────────────────────
console.log('\n[4] 鸟加容错（>100.5000%）计算')
{
  // 假设总权重 1000，起始达成率 101.0000%
  // 每一个 TAP Great 扣 20 / 1000 = 0.0200%
  // 24 个粉: 101.0 - 0.48 = 100.5200% > 100.5 (PASS)
  // 25 个粉: 101.0 - 0.50 = 100.5000% <= 100.5 (严格大于，故 25 个粉不可行)
  const tol1000 = calcTapGreatTolerance(101.0, 1000)
  assert('总权重1000，101%下容错为 24 个粉', tol1000.tolerance === 24 && tol1000.achievable)

  // 100.5000% 起始分不能再扣任何粉
  const tolExact = calcTapGreatTolerance(100.5, 1000)
  assert('100.5000% 起始分不可达成容错', !tolExact.achievable)

  // 场景容错测试：TAP: 500, HOLD: 50, SLIDE: 50, TOUCH: 20, BREAK: 20 -> 总权重 870
  const counts = { tap: 500, hold: 50, slide: 50, touch: 20, break: 20 }
  // 100% 绝赞全大: 20 CP, bonus 1.0% -> startingAch 101.0000%
  // 21 个粉: 101.0 - 21 * 20/870 = 100.5172% > 100.5
  // 22 个粉: 101.0 - 22 * 20/870 = 100.4943% <= 100.5
  const sc100 = calcBreakScenarioTolerance(counts, 1.0, '绝赞全大', '100% CP')
  assert('870权重 绝赞全大 (100% CP) 容错为 21 个粉', sc100.tolerance === 21 && sc100.achievable)

  // 80% 绝赞大: 16 CP, 4 PF -> bonus (16+3)/20 = 0.95% -> startingAch 100.9500%
  // 19 个粉: 100.95 - 19 * 20/870 = 100.5132% > 100.5
  // 20 个粉: 100.95 - 20 * 20/870 = 100.4902% <= 100.5
  const sc80 = calcBreakScenarioTolerance(counts, 0.8, '绝赞 80% 大', '80% CP')
  assert('870权重 绝赞 80% 大 容错为 19 个粉', sc80.tolerance === 19 && sc80.achievable)

  // 50% 绝赞大: 10 CP, 10 PF -> bonus (10+7.5)/20 = 0.875% -> startingAch 100.8750%
  // 16 个粉: 100.875 - 16 * 20/870 = 100.5072% > 100.5
  // 17 个粉: 100.875 - 17 * 20/870 = 100.4842% <= 100.5
  const sc50 = calcBreakScenarioTolerance(counts, 0.5, '绝赞 50% 大', '50% CP')
  assert('870权重 绝赞 50% 大 容错为 16 个粉', sc50.tolerance === 16 && sc50.achievable)

  // 无绝赞场景
  const noBreakCounts = { tap: 500, hold: 50, slide: 50, touch: 20, break: 0 }
  const scNoBreak = calcBreakScenarioTolerance(noBreakCounts, 1.0, '绝赞全大', '100% CP')
  assert('无绝赞场景不可达成鸟加', !scNoBreak.achievable)
}

// ── 结果 ─────────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} 个断言，${passed} 通过，${failed} 失败`)
if (failed > 0) process.exit(1)
