/**
 * Web Worker：达成率合法性验证
 * 消息协议：
 *   → { type: 'verify', payload: { achievement, counts } }
 *   ← { type: 'result', payload: { valid } }
 */
import { buildBreakPrecomp, verifyAchievement, type NoteCounts } from '@/utils/achievementVerify'

// 预计算缓存（按 breakNum 缓存，Worker 生命周期内复用）
const precompCache = new Map<number, ReturnType<typeof buildBreakPrecomp>>()

function getPrecomp(breakNum: number) {
    if (!precompCache.has(breakNum)) {
        precompCache.set(breakNum, buildBreakPrecomp(breakNum))
    }
    return precompCache.get(breakNum)!
}

self.onmessage = ({ data }: MessageEvent<{ type: string; payload: { achievement: number; counts: NoteCounts } }>) => {
    const { type, payload } = data
    if (type !== 'verify') return
    const { achievement, counts } = payload
    const precomp = getPrecomp(counts.break)
    const result = verifyAchievement(achievement, counts, precomp)
    self.postMessage({ type: 'result', payload: result })
}
