/// <reference types="node" />
/**
 * achievementVerify 真实成绩校准测试
 * 运行：npx vite-node src/utils/achievementVerify.test.ts
 *
 * 测试数据来源：dev/real-scores.json（从真实截图提取）
 */
import { buildBreakPrecomp, verifyAchievement, type NoteCounts } from './achievementVerify'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let passed = 0
let failed = 0

function assert(desc: string, cond: boolean) {
  if (cond) { console.log(`  PASS  ${desc}`); passed++ }
  else       { console.error(`  FAIL  ${desc}`); failed++ }
}

interface RealScore {
  title: string
  achievement: number
  counts: NoteCounts
}

// ── 加载真实成绩数据 ──────────────────────────────────────────────────────────
const dataPath = resolve(__dirname, '../../dev/real-scores.json')
const realScores: RealScore[] = JSON.parse(readFileSync(dataPath, 'utf-8'))

// ── 1. 真实成绩必须全部通过验证 ───────────────────────────────────────────────
console.log('\n[1] 真实成绩合法性验证（必须全部 valid=true）')
for (const score of realScores) {
  const precomp = buildBreakPrecomp(score.counts.break)
  const result = verifyAchievement(score.achievement, score.counts, precomp)
  assert(`${score.title} ${score.achievement}% → valid`, result.valid)
}

// ── 2. 超出物量上限的达成率必须被拒绝 ────────────────────────────────────────
// 101.0001% 超过任何谱面的理论最大值（101%），无论物量如何都应被拒绝
console.log('\n[2] 超出上限的达成率应被拒绝（valid=false）')
for (const score of realScores) {
  const precomp = buildBreakPrecomp(score.counts.break)
  assert(`${score.title} 101.0001% → invalid`, !verifyAchievement(101.0001, score.counts, precomp).valid)
}

// ── 3. 理论全 CP 达成率（101.0000%）应合法 ───────────────────────────────────
console.log('\n[3] 理论全 CP 达成率（101.0000%）应合法')
for (const score of realScores) {
  const precomp = buildBreakPrecomp(score.counts.break)
  assert(`${score.title} 101.0000% → valid`, verifyAchievement(101.0, score.counts, precomp).valid)
}

// ── 4. 超大值应被拒绝 ────────────────────────────────────────────────────────
console.log('\n[4] 极端值应被拒绝')
{
  const score = realScores[0]
  const precomp = buildBreakPrecomp(score.counts.break)
  assert('102% → invalid',    !verifyAchievement(102, score.counts, precomp).valid)
  assert('-1% → invalid',     !verifyAchievement(-1, score.counts, precomp).valid)
}

// ── 5. 边界：break=0 时应返回 invalid ────────────────────────────────────────
console.log('\n[5] 边界：break=0 时应返回 invalid')
{
  const precomp = buildBreakPrecomp(0)
  const counts: NoteCounts = { tap: 100, hold: 0, slide: 0, touch: 0, break: 0 }
  assert('break=0 → invalid', !verifyAchievement(100.0, counts, precomp).valid)
}

// ── 结果 ─────────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} 个断言，${passed} 通过，${failed} 失败`)
if (failed > 0) process.exit(1)
