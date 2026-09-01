<template>
  <div
    class="song-detail-container flex-1 h-full flex flex-col gap-2.5 sm:gap-3 min-w-0 overflow-y-auto pr-0.5 custom-scrollbar select-none">

    <!-- 移动端返回按钮栏 (仅在小屏/移动端显式开启时展示) -->
    <div v-if="showMobileBack"
      class="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] md:hidden shrink-0 shadow-xs">
      <button @click="$emit('back')"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>返回搜索列表</span>
      </button>
      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">谱面与战绩分析</span>
    </div>

    <!-- 空状态处理 -->
    <div v-if="!song"
      class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg shadow-sm">
      <div
        class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-3 shadow-inner">
        💿
      </div>
      <h3 class="text-base font-bold text-[#0F172A] dark:text-white mb-1">未选择曲目</h3>
      <p class="text-xs text-[#64748B] dark:text-slate-400">请在左侧搜索列表中选择一首曲目查看详细谱面与战绩分析</p>
    </div>

    <template v-else>
      <!-- ============================================================== -->
      <!-- 歌曲主头部卡片 (Song Hero Card)                                -->
      <!-- ============================================================== -->
      <div
        class="bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-3 sm:p-4 shadow-sm space-y-3 shrink-0 transition-colors"
        :style="heroCardBorderColor">

        <!-- 上半部：封面 + 歌曲信息矩阵 -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <!-- 封面列 -->
          <div class="flex items-center sm:items-start gap-3 sm:flex-col sm:w-[110px] md:w-[122px] shrink-0">
            <CoverImage :id="song.id" alt="歌曲封面"
              class="w-16 h-16 sm:w-[110px] sm:h-[110px] md:w-[122px] md:h-[122px] rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-700/50 bg-slate-900 shrink-0" />
            <div
              class="text-[11px] font-mono font-bold text-[#64748B] dark:text-slate-400 cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1"
              title="点击复制歌曲ID" @click="handelCopy(currentStyleId, '已成功复制歌曲ID到剪贴板')">
              <span>#{{ currentStyleId }}</span>
              <span class="text-[9px] opacity-60">📋</span>
            </div>
          </div>

          <!-- 详情列 -->
          <div class="flex-1 min-w-0 space-y-2">
            <!-- 标题与右上角模式/数据源切换 -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h1
                class="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] dark:text-white truncate cursor-pointer hover:opacity-75 transition-opacity max-w-full"
                title="点击复制曲名" @click="handelCopy(song.title, '已成功复制曲名到剪贴板')">
                {{ song.title }}
              </h1>

              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <!-- 谱面类型分段选择器 (DX / SD / 宴) -->
                <div class="bg-[#F1F5F9] dark:bg-slate-800/80 rounded-md p-0.5 flex items-center gap-0.5 shrink-0">
                  <template v-for="type in availableTypeList" :key="type.value">
                    <button @click="selectedChartType = type.value"
                      class="px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer" :class="selectedChartType === type.value
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                      {{ type.label }}
                    </button>
                  </template>
                </div>

                <!-- 数据源下拉切换 -->
                <div class="flex items-center shrink-0">
                  <Select :disabled="ScoreStore.getSelectableSource.length === 0"
                    :model-value="ScoreStore.selectedSource" @update:model-value="handleDataSourceSwitch">
                    <SelectTrigger
                      class="h-7 text-xs bg-white dark:bg-[#1E293B] border-[#CBD5E1] dark:border-slate-700 px-2 gap-1.5 shadow-xs max-w-[170px] sm:max-w-[200px]">
                      <div class="flex items-center gap-1.5 truncate">
                        <span class="w-1.5 h-1.5 rounded-full shrink-0"
                          :class="ScoreStore.selectedSource === 'empty' ? 'bg-amber-400' : 'bg-[#10B981]'"></span>
                        <span class="text-[#64748B] dark:text-slate-400 shrink-0">数据源:</span>
                        <span class="font-bold text-[#1D4ED8] dark:text-blue-400 truncate">{{ dataSourceDisplayName
                          }}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectLabel>成绩数据源选择</SelectLabel>
                      <SelectItem v-for="ds in ScoreStore.getSelectableSource" :key="ds" :value="ds">
                        {{ formatDataSourceName(ds) }}
                      </SelectItem>
                      <SelectItem v-if="ScoreStore.getSelectableSource.length === 0" value="empty">
                        没有可用数据源
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <!-- 基础属性卡片 (类别 / BPM / 版本 / 曲师) -->
            <div
              class="bg-[#F8FAFC] dark:bg-slate-900/50 border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 space-y-1 sm:space-y-1.5 text-xs transition-colors"
              :style="{ background: `linear-gradient(135deg, hsl(var(${currentDiffVar}) / 0.08) 0%, hsl(var(${currentDiffVar}) / 0.15) 100%)` }">

              <div v-for="info in infoRows" :key="info.label" class="flex items-center gap-2">
                <span class="w-1 h-3.5 rounded-full shrink-0 transition-colors duration-300"
                  :style="{ background: `hsl(var(${currentDiffVar}))` }"></span>
                <span class="text-[#64748B] dark:text-slate-400 shrink-0 w-8">{{ info.label }}</span>
                <span class="font-bold text-[#0F172A] dark:text-white truncate">{{ info.value }}</span>
              </div>

            </div>
          </div>
        </div>

        <!-- 下半部：操作按钮工具条 -->
        <div
          class="flex flex-wrap items-center justify-between gap-2 bg-[#F8FAFC] dark:bg-slate-900/50 border border-[#E2E8F0] dark:border-slate-800 rounded-md p-1.5 sm:p-2 transition-colors">
          <!-- 左侧操作 -->
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button @click="isAchievementCalculatorOpen = true" :disabled="!currentDiff"
              class="h-7 sm:h-8 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 rounded-md text-[10px] sm:text-[11px] font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <span>🧮</span>
              <span>达成率与绝赞计算器</span>
            </button>

            <button @click="isTagsDialogOpen = true"
              class="h-7 sm:h-8 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 rounded-md text-[10px] sm:text-[11px] font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer">
              <span>🏷️</span>
              <span>查看谱面标签状况</span>
              <span v-if="getCurrentDiffTags.length"
                class="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {{getCurrentDiffTags.reduce((sum, g) => sum + g.tags.length, 0)}}
              </span>
            </button>
          </div>

          <!-- 右侧合集操作 -->
          <DropdownMenu v-if="currentDiff">
            <DropdownMenuTrigger as-child>
              <button
                class="h-7 sm:h-8 flex items-center gap-1 px-2.5 sm:px-3 rounded-md text-[10px] sm:text-[11px] font-bold text-white bg-[#2563EB] hover:bg-blue-700 shadow-xs transition-colors cursor-pointer shrink-0">
                <span>+ 添加进合集 ▼</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                选择目标合集
              </div>
              <DropdownMenuItem v-for="coll in getCollectionNames" :key="coll" class="cursor-pointer text-xs"
                @click="addScoreToCollection(coll)">
                📁 {{ coll }}
              </DropdownMenuItem>
              <div v-if="getCollectionNames.length === 0" class="px-2 py-2 text-xs text-muted-foreground text-center">
                暂无合集，请在侧边栏新建
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- 难度矩阵标签卡片行 (Difficulty Matrix Tabs)                    -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-5 gap-1.5 sm:gap-2 shrink-0">
        <button v-for="(diffTab, index) in difficultyTabsList" :key="diffTab.name" :disabled="!diffTab.enabled"
          @click="diffTab.enabled && (selectedDiffIndex = index)"
          class="flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg border transition-all text-center min-w-0"
          :class="[
            diffTab.enabled ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed',
            selectedDiffIndex === index && diffTab.enabled
              ? diffTab.bgActiveClass + ' shadow-sm ring-2 ' + diffTab.ringClass
              : 'bg-white dark:bg-[#131B2E] border-[#E2E8F0] dark:border-[#26354D] hover:border-slate-300 dark:hover:border-slate-700'
          ]">
          <span class="text-[9px] sm:text-[10px] font-bold leading-tight truncate max-w-full"
            :class="selectedDiffIndex === index && diffTab.enabled ? 'text-white' : diffTab.colorClass">
            {{ diffTab.name }}
          </span>
          <span class="text-xs sm:text-sm md:text-[15px] font-bold leading-tight mt-0.5 truncate"
            :class="selectedDiffIndex === index && diffTab.enabled ? 'text-white' : 'text-[#0F172A] dark:text-white'">
            {{ diffTab.level }}
          </span>
          <span class="text-[8px] sm:text-[9px] leading-tight mt-0.5 truncate max-w-full"
            :class="selectedDiffIndex === index && diffTab.enabled ? 'text-white/85' : 'text-[#64748B] dark:text-slate-400'">
            {{ diffTab.achPreview }}
          </span>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- 深度分析双列面板 (Analysis Grid - 响应式单双列自适应)             -->
      <!-- ============================================================== -->
      <div v-if="currentDiff" class="grid grid-cols-1 2xl:grid-cols-2 gap-2.5 sm:gap-3 flex-1 min-h-0">

        <!-- 左侧卡片：个人战绩详情 (Score & Rating Panel) -->
        <div
          class="bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-3 shadow-sm space-y-2.5 flex flex-col justify-between transition-colors">
          <div class="space-y-2.5">
            <!-- 战绩标题 -->
            <div class="flex items-center justify-between text-xs font-bold"
              :style="{ color: `hsl(var(${currentDiffVar}))` }">
              <div class="flex items-center gap-1.5">
                <span>📊</span>
                <span>成绩详情 ({{ currentDifficultyName }} {{ currentDiff.levelDisplay }})</span>
              </div>
              <span v-if="currentDiff.score" class="text-[10px] text-muted-foreground font-normal">
                {{ ScoreStore.selectedSource }}
              </span>
            </div>

            <!-- 大号达成率与评级勋章行 -->
            <div class="border rounded-md p-2.5 flex items-center justify-between transition-colors" :style="{
              background: `hsl(var(${currentDiffVar}) / 0.12)`,
              borderColor: `hsl(var(${currentDiffVar}) / 0.35)`
            }">
              <template v-if="currentDiff.score">
                <div class="space-y-0.5">
                  <div class="text-[10px] font-medium" :style="{ color: `hsl(var(${currentDiffVar}))` }">
                    当前最佳达成率
                  </div>
                  <div class="text-xl font-extrabold tracking-tight" :style="{ color: `hsl(var(${currentDiffVar}))` }">
                    {{ currentDiff.score.achievements.toFixed(4) }}%
                  </div>
                </div>

                <!-- 评级徽章 (Rank & FC & FS) -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <img v-if="currentDiff.score.rate_type" :src="getAchievementIcon(currentDiff.score.rate_type)"
                    alt="Rate" class="h-7 max-h-[28px] w-auto max-w-[72px] object-contain shrink-0" loading="lazy" />
                  <img v-if="currentDiff.score.fc" :src="getFCFSIcon(conventFcFsStr(currentDiff.score.fc))"
                    :alt="currentDiff.score.fc"
                    class="w-[26px] h-[26px] max-w-[26px] max-h-[26px] object-contain shrink-0" loading="lazy" />
                  <img v-if="currentDiff.score.fs" :src="getFCFSIcon(conventFcFsStr(currentDiff.score.fs))"
                    :alt="currentDiff.score.fs"
                    class="w-[26px] h-[26px] max-w-[26px] max-h-[26px] object-contain shrink-0" loading="lazy" />
                </div>
              </template>
              <div v-else class="py-2 px-1 text-xs text-muted-foreground flex items-center gap-2">
                <span>⚪</span>
                <span>该难度暂无游玩记录</span>
              </div>
            </div>

            <!-- 元数据指标详情行列表 -->
            <div class="space-y-1.5 text-[11px]">
              <!-- DX Rating 贡献 -->
              <div class="flex items-center justify-between py-0.5">
                <span class="text-[#64748B] dark:text-slate-400">DX Rating 贡献</span>
                <span class="font-bold text-[#0F172A] dark:text-white">
                  <template v-if="currentDiff.score">
                    +{{ formatDxRating(currentDiff.score.dx_rating) }}
                    <span class="text-slate-400 dark:text-slate-500 font-normal">
                      (定数 {{ currentDiff.levelDisplay }})
                    </span>
                  </template>
                  <template v-else>-</template>
                </span>
              </div>

              <!-- DX Score / 星级 -->
              <div class="flex items-center justify-between py-0.5">
                <span class="text-[#64748B] dark:text-slate-400">DX Score / 星级</span>
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-[#0F172A] dark:text-white">
                    {{ currentDiff.dxScore.current }} / {{ currentDiff.dxScore.total }}
                    <span class="text-slate-400 dark:text-slate-500 font-normal">
                      ({{ currentDiff.dxScore.percentText }})
                    </span>
                  </span>
                  <img v-if="currentDiff.dxScore.available" :src="currentDiff.dxScore.icon" alt="Stars"
                    class="h-4 w-auto object-contain" loading="lazy" />
                </div>
              </div>

              <!-- 水鱼拟合定数 -->
              <div class="flex items-center justify-between py-0.5">
                <span class="text-[#64748B] dark:text-slate-400">水鱼拟合定数</span>
                <span class="font-bold text-[#0F172A] dark:text-white">
                  <template v-if="currentDiff.chartStat">
                    {{ currentDiff.chartStat.fit_diff.toFixed(2) }}
                    <span class="text-[#22C55E] dark:text-emerald-400 font-normal text-[11px]">
                      ({{ currentDiff.fitDeltaText }})
                    </span>
                  </template>
                  <template v-else>-</template>
                </span>
              </div>

              <!-- 全服平均达成率 -->
              <div class="flex items-center justify-between py-0.5">
                <span class="text-[#64748B] dark:text-slate-400">全服平均达成率</span>
                <span class="font-bold text-[#0F172A] dark:text-white">
                  {{ currentDiff.chartStat ? `${currentDiff.chartStat.avg.toFixed(2)}%` : '-' }}
                </span>
              </div>

              <!-- 游玩总次数 -->
              <div v-if="ScoreStore.isSupportPlayCount" class="flex items-center justify-between py-0.5">
                <span class="text-[#64748B] dark:text-slate-400">游玩总次数</span>
                <span class="font-bold text-[#0F172A] dark:text-white">
                  {{ currentDiff.playcount }} 次
                </span>
              </div>

              <!-- 谱面谱师 -->
              <div class="flex items-center justify-between py-0.5">
                <span class="text-[#64748B] dark:text-slate-400">谱面谱师</span>
                <span
                  class="font-bold text-[#0F172A] dark:text-white cursor-pointer hover:opacity-70 transition-opacity truncate max-w-[180px]"
                  :title="currentDiff.difficulty.note_designer"
                  @click="handelCopy(currentDiff.difficulty.note_designer, '已成功复制谱师到剪切板')">
                  {{ currentDiff.difficulty.note_designer || '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧卡片：物量分布与绝赞容错 (Notes Structure Panel) -->
        <div
          class="bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-3 shadow-sm space-y-2.5 flex flex-col justify-between transition-colors">
          <div class="space-y-2">
            <!-- 物量标题 -->
            <div class="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-white">
              <div class="flex items-center gap-1.5">
                <span>🎯</span>
                <span>物量分布与权重 (总物量 {{ currentDiff.totalNotes }})</span>
              </div>
            </div>

            <!-- Note 各键型分布行 -->
            <div class="space-y-1.5">
              <div v-for="note in currentDiff.notesBreakdown" :key="note.label"
                class="flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-900/50 rounded px-2.5 py-1 text-xs border border-slate-100 dark:border-slate-800/40">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" :class="note.pillBg">
                    {{ note.label }}
                  </span>
                  <span class="text-[11px] font-normal text-[#334155] dark:text-slate-300">
                    {{ note.count }} 个 ({{ note.percent }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 绝赞容错与鸟加达成 (SSS+ >100.5000%) -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <div class="flex items-center gap-1.5">
                <span>🛡️</span>
                <span>绝赞鸟加容错 (达成率 > 100.5000%)</span>
              </div>
              <span class="text-[10px] text-slate-400 font-normal">单位: TAP Great (粉)</span>
            </div>

            <div class="space-y-1.5">
              <div v-for="item in currentDiff.breakTolerances" :key="item.label"
                class="flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-900/50 rounded px-2.5 py-1 text-xs border border-slate-100 dark:border-slate-800/40">
                <div class="flex items-center gap-1.5">
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
                    {{ item.label }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">({{ item.ratioLabel }})</span>
                </div>
                <div class="flex items-center gap-1 text-xs font-mono">
                  <template v-if="item.achievable">
                    <span class="font-bold text-pink-600 dark:text-pink-400 text-[12px]">{{ item.tolerance }}</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 font-sans">个粉</span>
                  </template>
                  <template v-else>
                    <span class="text-slate-400 dark:text-slate-500 text-[11px] font-sans">不可达成</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- 曲目别名展示区 (Aliases Chips)                                 -->
      <!-- ============================================================== -->
      <div v-if="song.aliases && song.aliases.length > 0"
        class="bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#26354D] rounded-lg p-3 shadow-sm space-y-1.5 shrink-0">
        <div class="text-[11px] font-bold text-[#64748B] dark:text-slate-400">
          曲目别名 (点击可快速复制):
        </div>
        <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
          <Badge v-for="(alias, index) in song.aliases" :key="index" variant="outline"
            class="text-[10px] font-normal cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            @click="handelCopy(String(alias), '已成功复制曲目别名到剪切板')">
            {{ alias }}
          </Badge>
        </div>
      </div>
    </template>

    <!-- 达成率与绝赞计算器弹窗 -->
    <ChartAchievementCalculator v-if="currentDiff" v-model:open="isAchievementCalculatorOpen"
      :difficulty="currentDiff.raw" :song-title="song?.title" :diff-name="currentDifficultyName"
      :diff-level="currentDiff.levelDisplay" />

    <!-- 查看谱面标签状况弹窗 -->
    <Dialog v-model:open="isTagsDialogOpen">
      <DialogContent class="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-1.5 text-base">
            <span>🏷️</span>
            <span>谱面标签详情</span>
          </DialogTitle>
          <DialogDescription>
            {{ song?.title }} · {{ currentDifficultyName }} ({{ currentDiff?.levelDisplay }})
          </DialogDescription>
        </DialogHeader>

        <div class="mt-2">
          <DiffTagInfo :tag-info="getCurrentDiffTags" />
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import type { MaiMaiSong, SongDifficulty, SongDifficultyUtage, SongType } from '@/types/songs'
import type { AcceptableValue } from 'reka-ui'
import type { DataSourceType } from '@/types/datasource'
import { useScores } from '@/store/datasources/scores'
import { useCollectionStore } from '@/store/collections'
import { useChartData } from '@/store/chartStats'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useCopyHelper, toFishStyleId } from '@/utils/functionUtil'
import {
  conventFcFsStr,
  formatDxRating,
  formatLevelValue,
  getTotalDxScore
} from '@/utils/StrUtil'
import { getFCFSIcon, getAchievementIcon, getDxScoreIcon } from '@/utils/urlUtils'
import { getDiffTag } from '@/utils/tagUtils'
import { calcTotal, calcBreakScenarioTolerance } from '@/utils/achievementCalc'

import CoverImage from '@/components/CoverImage.vue'
import ChartAchievementCalculator from '@/desktop/components/ChartAchievementCalculator.vue'
import DiffTagInfo from '@/components/DiffTagInfo.vue'
import { Badge } from '@/components/shadcn/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel
} from '@/components/shadcn/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/shadcn/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/shadcn/ui/dialog'

// Props & Models & Emits
const props = withDefaults(
  defineProps<{
    song?: MaiMaiSong | null
    initialDiffIndex?: number
    showMobileBack?: boolean
  }>(),
  {
    song: null,
    initialDiffIndex: 3,
    showMobileBack: false
  }
)

defineEmits<{
  (e: 'back'): void
}>()

const selectedChartType = defineModel<SongType>('selectedType', { default: 'standard' })
const selectedDiffIndex = defineModel<number>('selectedDiffIndex', { default: 3 })

// Current Difficulties Array
const currentDifficulties = computed<SongDifficulty[]>(() => {
  if (!props.song) return []
  if (selectedChartType.value === 'utage') {
    return (props.song.difficulties.utage as unknown as SongDifficulty[]) ?? []
  }
  return (props.song.difficulties[selectedChartType.value] as SongDifficulty[]) ?? []
})

// Stores & Utilities
const ScoreStore = useScores()
const ChartStore = useChartData()
const { pushScoreToCollection } = useCollectionStore()
const { getCollectionNames } = storeToRefs(useCollectionStore())
const { handelCopy } = useCopyHelper()

// Dialog states
const isAchievementCalculatorOpen = ref(false)
const isTagsDialogOpen = ref(false)

// Difficulty Constants
const DIFF_NAMES = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER']
const DIFF_VARS = ['--BASIC', '--ADVANCED', '--EXPERT', '--MASTER', '--REMASTER']
const DIFF_COLOR_CLASSES = [
  'text-[#22C55E]',
  'text-[#F59E0B]',
  'text-[#F43F5E]',
  'text-[#9333EA]',
  'text-[#C084FC]'
]
const DIFF_BG_ACTIVE_CLASSES = [
  'bg-[#22C55E] border-[#22C55E] text-white',
  'bg-[#F59E0B] border-[#F59E0B] text-white',
  'bg-[#F43F5E] border-[#F43F5E] text-white',
  'bg-[#9333EA] border-[#9333EA] text-white',
  'bg-[#C084FC] border-[#C084FC] text-white'
]
const DIFF_RING_CLASSES = [
  'ring-emerald-400/40',
  'ring-amber-400/40',
  'ring-rose-400/40',
  'ring-purple-400/40',
  'ring-purple-300/40'
]

// Available Chart Types (standard / dx / utage)
const typeList = [
  { value: 'dx' as const, label: 'DX' },
  { value: 'standard' as const, label: '标准 (SD)' },
  { value: 'utage' as const, label: '宴' }
]
const availableTypeList = ref<{ value: SongType; label: string }[]>([])

const initTypes = () => {
  if (!props.song) {
    availableTypeList.value = []
    return
  }
  const types: { value: SongType; label: string }[] = []
  const hasDx = Array.isArray(props.song.difficulties.dx) && props.song.difficulties.dx.length > 0
  const hasStandard = Array.isArray(props.song.difficulties.standard) && props.song.difficulties.standard.length > 0
  const hasUtage = Array.isArray(props.song.difficulties.utage) && props.song.difficulties.utage.length > 0

  if (hasDx) types.push(typeList[0])
  if (hasStandard) types.push(typeList[1])
  if (hasUtage) types.push(typeList[2])

  availableTypeList.value = types

  // 如果当前选中的 type 不在可用列表中，默认切换到首个可用类型
  if (!types.some(t => t.value === selectedChartType.value) && types.length > 0) {
    selectedChartType.value = types[0].value
  }

  // 保证 diff index 在有效范围内
  const len = currentDifficulties.value.length
  const targetIdx = Math.min(props.initialDiffIndex, Math.max(0, len - 1))
  selectedDiffIndex.value = Math.max(0, targetIdx)
}

watch(() => props.song, initTypes, { immediate: true })

watch(() => selectedChartType.value, () => {
  const len = currentDifficulties.value.length
  if (selectedDiffIndex.value >= len) {
    selectedDiffIndex.value = Math.max(0, len - 1)
  }
})

// Current Style Song ID (e.g. 10000+ for fish style if needed)
const currentStyleId = computed(() => {
  if (!props.song) return ''
  return String(ScoreStore.showCurrentStyleId(props.song.id, selectedChartType.value))
})


// Helper: Format FC / FS Label
const fcLabel = (fc: string | null | undefined) => {
  if (!fc) return ''
  const map: Record<string, string> = { fc: 'FC', fcp: 'FC+', ap: 'AP', app: 'AP+' }
  return map[fc] ?? ''
}

// Current CSS Variable for Difficulty Accent Color
const currentDiffVar = computed(() => {
  if (selectedChartType.value === 'utage') return '--UTAGE'
  const diff = currentDifficulties.value[selectedDiffIndex.value]
  return DIFF_VARS[diff?.level_index ?? 3] ?? '--MASTER'
})

// Hero Card dynamic border / glow
const heroCardBorderColor = computed(() => ({
  borderLeftWidth: '4px',
  borderLeftColor: `hsl(var(${currentDiffVar.value}))`
}))

// Info Rows
const infoRows = computed(() => {
  if (!props.song) return []
  const rows = [
    { label: '类别', value: props.song.genre },
    { label: 'BPM', value: String(props.song.bpm) },
    { label: '版本', value: props.song.version },
    { label: '曲师', value: props.song.artist }
  ]
  if (props.song.map) {
    rows.push({ label: '区域', value: props.song.map })
  }
  return rows
})

// Difficulty Matrix Tabs computation
interface DifficultyTabItem {
  name: string
  level: string
  achPreview: string
  colorClass: string
  bgActiveClass: string
  ringClass: string
  enabled: boolean
  diff?: SongDifficulty
}

const difficultyTabsList = computed<DifficultyTabItem[]>(() => {
  if (!props.song) return []

  if (selectedChartType.value === 'utage') {
    const utageList = (props.song.difficulties.utage as SongDifficultyUtage[]) || []
    return utageList.map((diff, index) => {
      const score = ScoreStore.getScoreByUni(diff.diff_id, 'utage', diff.level_index)
      let achPreview = '暂无记录'
      if (score) {
        achPreview = `${score.achievements.toFixed(4)}% ${fcLabel(score.fc)}`.trim()
      }
      return {
        name: diff.kanji ? `宴 [${diff.kanji}]` : `UTAGE #${index + 1}`,
        level: diff.level,
        achPreview,
        colorClass: 'text-UTAGE',
        bgActiveClass: 'bg-UTAGE border-UTAGE text-white',
        ringClass: 'ring-UTAGE/40',
        enabled: true,
        diff
      }
    })
  }

  // standard / dx: standard 5 difficulty slots
  return DIFF_NAMES.map((name, idx) => {
    const diff = currentDifficulties.value[idx]
    if (!diff) {
      return {
        name,
        level: '-',
        achPreview: '无该难度',
        colorClass: DIFF_COLOR_CLASSES[idx],
        bgActiveClass: DIFF_BG_ACTIVE_CLASSES[idx],
        ringClass: DIFF_RING_CLASSES[idx],
        enabled: false
      }
    }
    const rawScore = ScoreStore.getScoreByUni(props.song!.id, diff.type, diff.level_index)
    const achPreview = rawScore
      ? `${rawScore.achievements.toFixed(4)}% ${fcLabel(rawScore.fc)}`.trim()
      : '未游玩'
    return {
      name,
      level: formatLevelValue(diff.level_value) || diff.level,
      achPreview,
      colorClass: DIFF_COLOR_CLASSES[idx],
      bgActiveClass: DIFF_BG_ACTIVE_CLASSES[idx],
      ringClass: DIFF_RING_CLASSES[idx],
      enabled: true,
      diff
    }
  })
})

// Current Selected Difficulty & Details
const currentDiff = computed(() => {
  if (!props.song) return null
  const difficulty = currentDifficulties.value[selectedDiffIndex.value]
  if (!difficulty) return null

  const isUtage = difficulty.type === 'utage'
  const diff_id = isUtage && 'diff_id' in difficulty ? (difficulty as SongDifficultyUtage).diff_id : props.song.id
  const totalDxScore = getTotalDxScore(difficulty)

  const score = ScoreStore.getScoreByUni(diff_id, difficulty.type, difficulty.level_index)
  const currentDxScore = score ? score.dx_score : 0
  const dxScoreIcon = getDxScoreIcon(currentDxScore, totalDxScore)
  const dxPercent = totalDxScore > 0 ? ((currentDxScore / totalDxScore) * 100).toFixed(2) : '0.00'

  const fishId = toFishStyleId(props.song.id, difficulty.type)
  const chartStat = ChartStore.getDiffChartData(fishId, difficulty.level_index)

  let fitDeltaText = '+0.00'
  if (chartStat && difficulty.level_value) {
    const delta = chartStat.fit_diff - difficulty.level_value
    fitDeltaText = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)
  }

  // 物量分解
  const totalNotes = difficulty.tap_num + difficulty.hold_num + difficulty.slide_num + difficulty.touch_num + difficulty.break_num
  const calcCounts = {
    tap: difficulty.tap_num,
    hold: difficulty.hold_num,
    slide: difficulty.slide_num,
    touch: difficulty.touch_num,
    break: difficulty.break_num
  }
  const totalWeight = calcTotal(calcCounts)

  const breakTolerances = [
    calcBreakScenarioTolerance(calcCounts, 1.0, '绝赞全大', '100% CP'),
    calcBreakScenarioTolerance(calcCounts, 0.8, '绝赞 80% 大', '80% CP'),
    calcBreakScenarioTolerance(calcCounts, 0.5, '绝赞 50% 大', '50% CP')
  ]

  const notesBreakdown = [
    {
      label: 'TAP',
      count: difficulty.tap_num,
      percent: totalNotes > 0 ? `${((difficulty.tap_num / totalNotes) * 100).toFixed(1)}%` : '0%',
      weight: '500pts (1x)',
      pillBg: 'bg-[#3B82F6] text-white'
    },
    {
      label: 'HOLD',
      count: difficulty.hold_num,
      percent: totalNotes > 0 ? `${((difficulty.hold_num / totalNotes) * 100).toFixed(1)}%` : '0%',
      weight: '1000pts (2x)',
      pillBg: 'bg-[#EAB308] text-white'
    },
    {
      label: 'SLIDE',
      count: difficulty.slide_num,
      percent: totalNotes > 0 ? `${((difficulty.slide_num / totalNotes) * 100).toFixed(1)}%` : '0%',
      weight: '1500pts (3x)',
      pillBg: 'bg-[#EC4899] text-white'
    },
    {
      label: 'TOUCH',
      count: difficulty.touch_num,
      percent: totalNotes > 0 ? `${((difficulty.touch_num / totalNotes) * 100).toFixed(1)}%` : '0%',
      weight: '500pts (1x)',
      pillBg: 'bg-[#14B8A6] text-white'
    },
    {
      label: 'BREAK',
      count: difficulty.break_num,
      percent: totalNotes > 0 ? `${((difficulty.break_num / totalNotes) * 100).toFixed(1)}%` : '0%',
      weight: '2600pts (5.2x + 1%)',
      pillBg: 'bg-[#F97316] text-white'
    }
  ]

  return {
    difficulty,
    score,
    isUtage,
    chartStat,
    fitDeltaText,
    totalNotes,
    totalWeight,
    notesBreakdown,
    breakTolerances,
    levelDisplay: isUtage ? difficulty.level : formatLevelValue(difficulty.level_value),
    dxScore: {
      total: totalDxScore,
      current: currentDxScore,
      available: dxScoreIcon != null,
      icon: dxScoreIcon ?? '',
      percentText: `${dxPercent}%`
    },
    playcount: score?.play_count ?? 0,
    raw: difficulty
  }
})

const currentDifficultyName = computed(() => {
  if (!currentDiff.value) return ''
  if (selectedChartType.value === 'utage') {
    const u = currentDiff.value.difficulty as SongDifficultyUtage
    return u.kanji ? `宴 [${u.kanji}]` : '宴会场'
  }
  return DIFF_NAMES[currentDiff.value.difficulty.level_index] ?? 'MASTER'
})

// Data Source Formatter
const formatDataSourceName = (ds: DataSourceType) => {
  switch (ds) {
    case 'divingfish': return 'Diving-Fish (水鱼)'
    case 'lxns': return 'LXNS (落雪查分)'
    case 'usagi': return 'Usagi (查分器)'
    case 'empty': return '未配置数据源'
    default: return ds
  }
}

const dataSourceDisplayName = computed(() => {
  return formatDataSourceName(ScoreStore.selectedSource)
})

const handleDataSourceSwitch = (ds: AcceptableValue) => {
  ScoreStore.switchDataSource(ds as DataSourceType)
}

// Diff Tags
const getCurrentDiffTags = computed(() => {
  if (!props.song || !currentDiff.value) return []
  return getDiffTag(props.song.title, currentDiff.value.raw.level_index, currentDiff.value.raw.type)
})

// Add to Collection
function addScoreToCollection(label: string) {
  if (!props.song || !currentDiff.value) return
  const diff = currentDiff.value.difficulty
  const isUtage = diff.type === 'utage'
  const diff_id = isUtage && 'diff_id' in diff ? (diff as SongDifficultyUtage).diff_id : props.song.id

  if (!currentDiff.value.score) {
    toast.warning('该难度暂无游玩记录，将以「未游玩」状态添加进合集', { position: 'top-center' })
  }

  if (pushScoreToCollection(label, `${diff_id}_${diff.type}_${diff.level_index}`)) {
    toast.success(`已成功添加至合集「${label}」`, { position: 'top-center' })
  } else {
    toast.error('添加失败，该曲目已在合集当中', { position: 'top-center' })
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>
