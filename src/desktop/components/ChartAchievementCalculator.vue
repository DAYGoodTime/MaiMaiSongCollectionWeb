<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-w-[700px] w-[95vw] md:w-full max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden select-none">
      
      <!-- ============================================================== -->
      <!-- 头部：标题与模式切换 (Header - Fixed at top)                      -->
      <!-- ============================================================== -->
      <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
        <div class="min-w-0 flex-1 space-y-1">
          <DialogTitle class="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs shadow-2xs">🧮</span>
            <span>达成率与判定精密计算器</span>
          </DialogTitle>
          <DialogDescription class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span class="font-semibold text-slate-700 dark:text-slate-300 max-w-[200px] sm:max-w-[260px] truncate" :title="songTitle || '当前曲目'">
              {{ songTitle || '当前曲目' }}
            </span>
            <span v-if="diffName" class="px-1.5 py-0.2 text-[10px] font-bold rounded" :class="diffBadgeClass">
              {{ diffName }} {{ diffLevel || '' }}
            </span>
            <span class="px-1.5 py-0.2 text-[10px] font-medium rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              物量 {{ totalNotesCount }}
            </span>
          </DialogDescription>
        </div>

        <!-- 模式切换下拉 (0+ / 100- / 101-)，右侧留出空间避免与关闭按钮重叠 -->
        <div class="shrink-0 mr-8">
          <Select v-model="mode">
            <SelectTrigger
              class="h-7 px-2.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 rounded-lg shadow-2xs hover:bg-blue-100/70 transition-colors focus:ring-1 focus:ring-blue-500">
              <span class="text-[11px]">模式: {{ modeDisplay }}</span>
            </SelectTrigger>
            <SelectContent align="end" class="min-w-[140px]">
              <SelectItem value="101-">101- 理论倒扣</SelectItem>
              <SelectItem value="100-">100- 满分倒扣</SelectItem>
              <SelectItem value="0+">0+ 累加得分</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- 滚动内容区域 (Scrollable Body)                                   -->
      <!-- ============================================================== -->
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-modal-scrollbar min-h-0">
        
        <!-- 判定权重分布矩阵表 (Matrix Table) -->
        <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[520px] text-xs text-center border-collapse">
              <thead>
                <tr class="bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <th class="py-2.5 px-3 text-left w-20">Note</th>
                  <th class="py-2.5 px-2 w-14">物量</th>
                  <th class="py-2.5 px-2 text-amber-500 dark:text-amber-400">PERFECT</th>
                  <th class="py-2.5 px-2 text-pink-500 dark:text-pink-400">GREAT</th>
                  <th class="py-2.5 px-2 text-emerald-600 dark:text-emerald-400">GOOD</th>
                  <th class="py-2.5 px-2 text-rose-500 dark:text-rose-400">MISS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="note in notes" :key="note.key"
                  class="border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <!-- Note 键型名称 -->
                  <td class="py-2.5 px-3 text-left font-bold text-slate-800 dark:text-slate-100">
                    <span :class="noteBadgeClass(note.key)" class="px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {{ note.label }}
                    </span>
                  </td>

                  <!-- 物量数量 -->
                  <td class="py-2.5 px-2 text-slate-500 dark:text-slate-400 tabular-nums font-mono font-medium">
                    {{ note.value }}
                  </td>

                  <!-- PERFECT -->
                  <td class="py-2 px-2 text-amber-600 dark:text-amber-400 tabular-nums font-mono font-medium">
                    <template v-if="note.key === 'touch' && note.value === 0">-</template>
                    <template v-else-if="note.key === 'break'">
                      <div class="space-y-0.5 py-0.5">
                        <div v-for="(val, idx) in calculate(note.key, 'perfect')" :key="idx"
                          class="flex items-center justify-between text-[11px] gap-1 px-1.5 py-0.5 rounded hover:bg-amber-50/60 dark:hover:bg-amber-950/30">
                          <span class="text-[9px] text-slate-400 dark:text-slate-500 font-mono scale-90 origin-left">
                            {{ idx === 0 ? 'CP' : idx === 1 ? 'PF75' : 'PF50' }}
                          </span>
                          <span :class="idx === 0 ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300'">
                            {{ val }}
                          </span>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <span v-for="(val, idx) in calculate(note.key, 'perfect')" :key="idx"
                        class="block whitespace-nowrap text-[11px]">
                        {{ val }}
                      </span>
                    </template>
                  </td>

                  <!-- GREAT -->
                  <td class="py-2 px-2 text-pink-600 dark:text-pink-400 tabular-nums font-mono font-medium">
                    <template v-if="note.key === 'touch' && note.value === 0">-</template>
                    <template v-else-if="note.key === 'break'">
                      <div class="space-y-0.5 py-0.5">
                        <div v-for="(val, idx) in calculate(note.key, 'great')" :key="idx"
                          class="flex items-center justify-between text-[11px] gap-1 px-1.5 py-0.5 rounded hover:bg-pink-50/60 dark:hover:bg-pink-950/30">
                          <span class="text-[9px] text-slate-400 dark:text-slate-500 font-mono scale-90 origin-left">
                            {{ idx === 0 ? '2000' : idx === 1 ? '1500' : '1250' }}
                          </span>
                          <span class="text-pink-600 dark:text-pink-400">
                            {{ val }}
                          </span>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <span v-for="(val, idx) in calculate(note.key, 'great')" :key="idx"
                        class="block whitespace-nowrap text-[11px]">
                        {{ val }}
                      </span>
                    </template>
                  </td>

                  <!-- GOOD -->
                  <td class="py-2.5 px-2 text-emerald-600 dark:text-emerald-400 tabular-nums font-mono font-medium">
                    <template v-if="note.key === 'touch' && note.value === 0">-</template>
                    <template v-else>
                      <span v-for="(val, idx) in calculate(note.key, 'good')" :key="idx"
                        class="block whitespace-nowrap text-[11px]">
                        {{ val }}
                      </span>
                    </template>
                  </td>

                  <!-- MISS -->
                  <td class="py-2.5 px-2 text-rose-600 dark:text-rose-400 tabular-nums font-mono font-medium">
                    <template v-if="note.key === 'touch' && note.value === 0">-</template>
                    <template v-else>
                      <span v-for="(val, idx) in calculate(note.key, 'miss')" :key="idx"
                        class="block whitespace-nowrap text-[11px]">
                        {{ val }}
                      </span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span class="text-blue-500 mt-0.5">ℹ️</span>
          <span>表格展示各 Note 判定在当前模式下占用的达成率权重与扣分比例，结果按官方公式精确推导。</span>
        </div>

        <!-- ============================================================== -->
        <!-- 达成率数学合法性验证 (Verification Box)                          -->
        <!-- ============================================================== -->
        <div class="bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🔍</span>
              <span>达成率数学合法性验证</span>
            </span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">
              检验该达成率是否存在合法的判定组合解
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                type="number"
                v-model.number="verifyInput"
                min="0"
                max="101"
                step="0.0001"
                placeholder="输入达成率，例如 100.6400"
                class="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 pr-7 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums placeholder:font-normal placeholder:text-slate-400 shadow-2xs transition-colors"
                @keydown.enter="doVerify"
              />
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">%</span>
            </div>
            <button
              :disabled="verifyLoading || verifyInput === null || verifyInput === undefined"
              @click="doVerify"
              class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-2xs">
              <span v-if="verifyLoading" class="animate-spin text-xs">⏳</span>
              <span>{{ verifyLoading ? '计算中...' : '验证' }}</span>
            </button>
          </div>

          <!-- 验证结果标签 -->
          <div v-if="verifyDone && !verifyLoading" class="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 border transition-all"
            :class="verifyResult
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'">
            <span class="text-sm">{{ verifyResult ? '✓' : '✗' }}</span>
            <span>{{ verifyResult ? '合法：该达成率在数学上存在对应的有效判定组合' : '不合法：不存在任何判定组合能在该物量下得到此达成率' }}</span>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- 绝赞分布计算（可折叠） (Break Splits Calc)                       -->
        <!-- ============================================================== -->
        <Collapsible v-model:open="breakCalcOpen">
          <div class="bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3 transition-all">
            <CollapsibleTrigger as-child>
              <button class="w-full flex items-center justify-between text-left cursor-pointer group py-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-sm">💥</span>
                  <div>
                    <span class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      绝赞分布精密计算 (Break Splits)
                    </span>
                    <span class="hidden sm:inline-block ml-2 text-[10px] text-slate-400 font-normal">
                      反推 BREAK 细分判定
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  <span class="text-[11px] font-medium">{{ breakCalcOpen ? '收起' : '展开' }}</span>
                  <span class="text-[10px] transition-transform duration-200" :class="{ 'rotate-180': breakCalcOpen }">▼</span>
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div class="pt-2 space-y-3.5 border-t border-slate-200/70 dark:border-slate-800 mt-2">
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  填写各键型判定数量矩阵，反推达成目标分数时 BREAK 的判定细分（CP / PF 0.75 / PF 0.5 / GR 2000 / GR 1500 / GR 1250）。
                </p>

                <!-- 判定矩阵输入表 -->
                <div class="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/80 shadow-2xs">
                  <table class="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr class="bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <th class="py-1.5 px-3 text-left w-16">Note</th>
                        <th class="py-1.5 px-1 text-amber-500">CP</th>
                        <th class="py-1.5 px-1 text-orange-400">PF</th>
                        <th class="py-1.5 px-1 text-pink-500">GR</th>
                        <th class="py-1.5 px-1 text-emerald-600">GD</th>
                        <th class="py-1.5 px-1 text-slate-400">MS</th>
                        <th class="py-1.5 px-3 w-24">总计 / 物量</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in matrixRows" :key="row.key"
                        class="border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td class="py-1.5 px-3 text-left font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                          {{ row.label }}
                        </td>
                        <td v-for="col in matrixCols" :key="col" class="py-1 px-0.5">
                          <input
                            type="number"
                            min="0"
                            :value="matrix[row.key][col]"
                            @input="onMatrixInput(row.key, col, $event)"
                            class="w-full max-w-[54px] mx-auto rounded-md border px-1 py-1 text-center tabular-nums text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors"
                            :class="rowError(row.key)
                              ? 'border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 focus:border-rose-500'
                              : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'"
                          />
                        </td>
                        <td class="py-1.5 px-3 text-[11px] tabular-nums font-semibold">
                          <span :class="rowError(row.key) ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'">
                            {{ rowSum(row.key) }} / {{ noteCount(row.key) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 矩阵校验错误提示 -->
                <p v-if="hasMatrixError" class="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1">
                  <span>⚠️</span>
                  <span>每行判定的数量之和必须精确等于该 Note 的谱面总物量。</span>
                </p>

                <!-- 目标达成率输入与开始计算 -->
                <div class="flex items-center gap-2 pt-1">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">目标达成率:</span>
                  <div class="relative flex-1">
                    <input
                      type="number"
                      v-model.number="targetAchievement"
                      min="0"
                      max="101"
                      step="0.0001"
                      placeholder="如 100.9999"
                      class="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 pr-7 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums placeholder:font-normal placeholder:text-slate-400 shadow-2xs transition-colors"
                      @keydown.enter="doCalc"
                    />
                    <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">%</span>
                  </div>
                  <button
                    :disabled="hasMatrixError"
                    @click="doCalc"
                    class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0 flex items-center gap-1.5">
                    <span>开始计算</span>
                  </button>
                </div>

                <!-- 计算结果展示列表 -->
                <template v-if="calcResults.length > 0">
                  <div class="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto bg-white dark:bg-slate-900/80 shadow-2xs">
                    <table class="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr class="bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <th class="py-2 px-3 tabular-nums text-left">达成率</th>
                          <th class="py-2 px-1 text-orange-500">PF<br/><span class="font-normal text-[9px] text-slate-400">0.75</span></th>
                          <th class="py-2 px-1 text-orange-500">PF<br/><span class="font-normal text-[9px] text-slate-400">0.5</span></th>
                          <th class="py-2 px-1 text-pink-500">GR<br/><span class="font-normal text-[9px] text-slate-400">2000</span></th>
                          <th class="py-2 px-1 text-pink-500">GR<br/><span class="font-normal text-[9px] text-slate-400">1500</span></th>
                          <th class="py-2 px-1 text-pink-500">GR<br/><span class="font-normal text-[9px] text-slate-400">1250</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(r, i) in pagedResults" :key="i"
                          class="border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          :class="i === 0 && currentPage === 1 ? 'bg-amber-50/70 dark:bg-amber-950/20' : ''">
                          <td class="py-2 px-3 text-left tabular-nums font-mono font-bold text-slate-900 dark:text-white">
                            {{ r.achievement.toFixed(4) }}%
                            <span v-if="i === 0 && currentPage === 1" class="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-200/70 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-sans font-bold">推荐解</span>
                          </td>
                          <td class="py-2 px-1 tabular-nums font-mono text-slate-700 dark:text-slate-300">{{ r.split.pf075 }}</td>
                          <td class="py-2 px-1 tabular-nums font-mono text-slate-700 dark:text-slate-300">{{ r.split.pf050 }}</td>
                          <td class="py-2 px-1 tabular-nums font-mono text-slate-700 dark:text-slate-300">{{ r.split.gr2000 }}</td>
                          <td class="py-2 px-1 tabular-nums font-mono text-slate-700 dark:text-slate-300">{{ r.split.gr1500 }}</td>
                          <td class="py-2 px-1 tabular-nums font-mono text-slate-700 dark:text-slate-300">{{ r.split.gr1250 }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 分页控制 -->
                  <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>共 {{ calcResults.length }} 条结果，第 {{ currentPage }}/{{ totalPages }} 页</span>
                    <div class="flex items-center gap-1">
                      <button
                        class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-xs font-medium"
                        :disabled="currentPage === 1"
                        @click="currentPage--">
                        上一页
                      </button>
                      <button
                        class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-xs font-medium"
                        :disabled="currentPage === totalPages"
                        @click="currentPage++">
                        下一页
                      </button>
                    </div>
                  </div>
                  <p v-else class="text-[11px] text-slate-500 dark:text-slate-400">共 {{ calcResults.length }} 条结果</p>
                </template>
                <p v-else-if="calcDone" class="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                  没有找到符合该判定组合的绝赞分布解
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

      </div>

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/shadcn/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/shadcn/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/shadcn/ui/collapsible'
import type { SongDifficultyAny } from '@/types/songs'
import {
  calcTotal,
  enumerateBreakSplits,
  sortByTarget,
  type JudgmentMatrix,
  type CalcResult,
  type NoteKey,
  BASIC_WEIGHT,
  BREAK_BONUS
} from '@/utils/achievementCalc'
import VerifyWorker from '@/utils/achievementVerifyWorker?worker'

type Judgment = 'perfect' | 'great' | 'good' | 'miss'
type Mode = '0+' | '100-' | '101-'
type MatrixCol = 'cp' | 'pf' | 'gr' | 'gd' | 'ms'

interface Props {
  difficulty: SongDifficultyAny
  songTitle?: string
  diffName?: string
  diffLevel?: string
}

const props = defineProps<Props>()

const open = defineModel<boolean>('open', { default: false })
const mode = ref<Mode>('101-')

const modeDisplay = computed(() => {
  switch (mode.value) {
    case '101-': return '101- 理论倒扣'
    case '100-': return '100- 满分倒扣'
    case '0+': return '0+ 累加得分'
    default: return mode.value
  }
})

// 难度徽章样式
const diffBadgeClass = computed(() => {
  const name = (props.diffName || '').toUpperCase()
  if (name.includes('BASIC')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
  if (name.includes('ADVANCED')) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
  if (name.includes('EXPERT')) return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
  if (name.includes('RE:MASTER') || name.includes('REMASTER')) return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
  if (name.includes('MASTER')) return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
})

// Note 类型徽章样式
function noteBadgeClass(key: NoteKey): string {
  switch (key) {
    case 'tap': return 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
    case 'hold': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
    case 'slide': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
    case 'touch': return 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
    case 'break': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 font-black'
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

// 总物量
const totalNotesCount = computed(() => {
  return (
    (props.difficulty?.tap_num || 0) +
    (props.difficulty?.hold_num || 0) +
    (props.difficulty?.slide_num || 0) +
    (props.difficulty?.touch_num || 0) +
    (props.difficulty?.break_num || 0)
  )
})

// ── 达成率矩阵与计算 ─────────────────────────────────────────────────────────────
const basic = BASIC_WEIGHT
const breakBonus = BREAK_BONUS

const notes = computed(() => [
  { key: 'tap' as const, label: 'TAP', value: props.difficulty.tap_num },
  { key: 'hold' as const, label: 'HOLD', value: props.difficulty.hold_num },
  { key: 'slide' as const, label: 'SLIDE', value: props.difficulty.slide_num },
  { key: 'touch' as const, label: 'TOUCH', value: props.difficulty.touch_num },
  { key: 'break' as const, label: 'BREAK', value: props.difficulty.break_num }
])

const total = computed(() =>
  notes.value.reduce((sum, note) => sum + note.value * basic.perfect[note.key], 0)
)

const format = (value: number) => (Number.isFinite(value) ? `${value.toFixed(4)}%` : '-')
const lossBase = () => (basic.perfect.break / total.value) * 100

function calculate(key: NoteKey, judgment: Judgment): string[] {
  if (!total.value || (key === 'break' && !props.difficulty.break_num)) return ['-']

  if (key === 'break' && judgment === 'perfect') {
    const critical = breakBonus.criticalPerfect / props.difficulty.break_num
    if (mode.value === '100-') {
      return [
        format(critical),
        format(breakBonus.perfect[0] / props.difficulty.break_num),
        format(critical - breakBonus.perfect[1] / props.difficulty.break_num)
      ]
    }
    if (mode.value === '101-') {
      return [
        format(0),
        ...breakBonus.perfect.map(val => format(val / props.difficulty.break_num - critical))
      ]
    }
    const base = lossBase()
    return [
      format(base + critical),
      ...breakBonus.perfect.map(val => format(base + val / props.difficulty.break_num))
    ]
  }

  if (key === 'break' && judgment === 'great') {
    return basic.great.break.map(val => {
      const percentage = (val / total.value) * 100 + breakBonus.great / props.difficulty.break_num
      if (mode.value === '0+') return format(percentage)
      return format(
        percentage - lossBase() - (mode.value === '101-' ? breakBonus.criticalPerfect / props.difficulty.break_num : 0)
      )
    })
  }

  const nonBreakKey = key as 'tap' | 'hold' | 'slide' | 'touch'
  let val = basic[judgment][nonBreakKey] as number
  let bonus = key === 'break' ? (judgment === 'good' ? breakBonus.good : 0) : 0

  if (mode.value !== '0+') {
    if (judgment === 'perfect') val = 0
    if (judgment === 'great') val = basic.perfect[nonBreakKey] - (basic.great[nonBreakKey] as number)
    if (judgment === 'good') {
      val = basic.perfect[nonBreakKey] - (basic.good[nonBreakKey] as number)
      if (key === 'break') bonus = mode.value === '101-' ? breakBonus.criticalPerfect - breakBonus.good : -breakBonus.good
    }
    if (judgment === 'miss') {
      val = basic.perfect[nonBreakKey]
      if (key === 'break' && mode.value === '101-') bonus = breakBonus.criticalPerfect
    }
  }

  let percentage = (val / total.value) * 100
  if (key === 'break') percentage += bonus / props.difficulty.break_num
  return [format(mode.value === '0+' ? percentage : -percentage)]
}

// ── 达成率数学合法性验证 ────────────────────────────────────────────────────────
const verifyInput = ref<number>(101)
const verifyDone = ref(false)
const verifyResult = ref(false)
const verifyLoading = ref(false)

let _verifyWorker: Worker | null = null
function getVerifyWorker(): Worker {
  if (!_verifyWorker) {
    _verifyWorker = new VerifyWorker()
    _verifyWorker.onmessage = ({ data }: MessageEvent<{ type: string; payload: { valid: boolean } }>) => {
      if (data.type === 'result') {
        verifyResult.value = data.payload.valid
        verifyDone.value = true
        verifyLoading.value = false
      }
    }
  }
  return _verifyWorker
}

function doVerify() {
  if (verifyInput.value === null || verifyInput.value === undefined) return
  verifyDone.value = false
  verifyLoading.value = true
  const counts = {
    tap: props.difficulty.tap_num,
    hold: props.difficulty.hold_num,
    slide: props.difficulty.slide_num,
    touch: props.difficulty.touch_num,
    break: props.difficulty.break_num
  }
  getVerifyWorker().postMessage({ type: 'verify', payload: { achievement: verifyInput.value, counts } })
}

// ── 绝赞分布精密计算 ─────────────────────────────────────────────────────────────
const breakCalcOpen = ref(false)
const matrixRows = [
  { key: 'tap' as const, label: 'TAP' },
  { key: 'hold' as const, label: 'HOLD' },
  { key: 'slide' as const, label: 'SLIDE' },
  { key: 'touch' as const, label: 'TOUCH' },
  { key: 'break' as const, label: 'BREAK' }
]
const matrixCols: MatrixCol[] = ['cp', 'pf', 'gr', 'gd', 'ms']

function makeRow(cp = 0) {
  return { cp, pf: 0, gr: 0, gd: 0, ms: 0 }
}

const matrix = reactive<JudgmentMatrix>({
  tap: makeRow(),
  hold: makeRow(),
  slide: makeRow(),
  touch: makeRow(),
  break: makeRow()
})

function resetMatrix() {
  const d = props.difficulty
  Object.assign(matrix.tap, makeRow(d.tap_num))
  Object.assign(matrix.hold, makeRow(d.hold_num))
  Object.assign(matrix.slide, makeRow(d.slide_num))
  Object.assign(matrix.touch, makeRow(d.touch_num))
  Object.assign(matrix.break, makeRow(d.break_num))
  calcResults.value = []
  calcDone.value = false
  currentPage.value = 1
}

watch(open, (val) => {
  if (val) resetMatrix()
})

const targetAchievement = ref<number>(101)
const calcResults = ref<CalcResult[]>([])
const calcDone = ref(false)
const currentPage = ref(1)
const PAGE_SIZE = 20

function noteCount(key: NoteKey): number {
  const map: Record<NoteKey, number> = {
    tap: props.difficulty.tap_num,
    hold: props.difficulty.hold_num,
    slide: props.difficulty.slide_num,
    touch: props.difficulty.touch_num,
    break: props.difficulty.break_num
  }
  return map[key]
}

function rowSum(key: NoteKey): number {
  const r = matrix[key]
  return r.cp + r.pf + r.gr + r.gd + r.ms
}

function rowError(key: NoteKey): boolean {
  return rowSum(key) !== noteCount(key)
}

const hasMatrixError = computed(() => matrixRows.some(r => rowError(r.key)))

function onMatrixInput(key: NoteKey, col: MatrixCol, event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const val = parseInt(raw, 10)
  matrix[key][col] = Number.isFinite(val) && val >= 0 ? val : 0
}

function doCalc() {
  if (hasMatrixError.value) return
  const t = calcTotal({
    tap: props.difficulty.tap_num,
    hold: props.difficulty.hold_num,
    slide: props.difficulty.slide_num,
    touch: props.difficulty.touch_num,
    break: props.difficulty.break_num
  })
  const raw = enumerateBreakSplits(matrix, t, props.difficulty.break_num)
  calcResults.value = sortByTarget(raw, targetAchievement.value)
  calcDone.value = true
  currentPage.value = 1
}

const totalPages = computed(() => Math.max(1, Math.ceil(calcResults.value.length / PAGE_SIZE)))
const pagedResults = computed(() =>
  calcResults.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)
</script>

<style scoped>
.custom-modal-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-modal-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}
.custom-modal-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
}
.custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}
</style>
