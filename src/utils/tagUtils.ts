import TAG_JSON from "@/assets/data/tag_data.json" with { type: 'json' }
import type { AdvanceFilterFilters } from "@/types/component"
import type { ScoreExtend, SongType } from "@/types/songs"
import type { DiffTAG, DiffTagCounter, GroupInfo, GroupInfoForCounter } from "@/types/tag"
import { getDxScoreRadio, isAllFinal } from "./StrUtil"


const LEVELS = ["basic", "advance", "expert", "master", "remaster"]
const DXTYPE = {
    "standard": "std",
    "dx": "dx",
    "utage": "utage"
}

export const getDiffTag = (song_name: string, level_index: number, type: SongType): GroupInfo[] => {
    const tags: Array<DiffTAG> = TAG_JSON.tagSongs.filter((tag) =>
        tag.song_id === song_name &&
        LEVELS[level_index] === tag.sheet_difficulty &&
        DXTYPE[type] === tag.sheet_type
    ).map(tag => TAG_JSON.tags.find(tags => tags.id == tag.tag_id)).filter(t => t != undefined);
    return TAG_JSON.tagGroups.map(group => {
        return {
            group,
            tags: tags.filter(tag => tag?.group_id === group.id)
        }
    })
}
export interface AdvanceFilterFiltersForTag extends AdvanceFilterFilters {
    achievement_range: [number, number]
}

const advanceFilter = (filter: AdvanceFilterFiltersForTag, list: ScoreExtend[]): ScoreExtend[] => {
    const levelFilter = new Set(filter.difficulty.map(f => f.value));
    const categoryFilter = new Set(filter.musicCategories.map(f => f.value));
    const versionFilter = new Set(filter.version.map(f => f.value));
    const mapFilter = new Set(filter.mapCategories.map(f => f.value));
    const dxScoreFilter = filter.dxScore.map(f => f.value);
    const fcFilter = new Set(filter.fullCombo.map(f => f.value));
    const fsFilter = new Set(filter.fullSync.map(f => f.value));
    const typeFilter = new Set(filter.Type.map(f => f.value));
    const [minDifficulty, maxDifficulty] = filter.difficultyRange;
    const [minAchievement, maxAchievement] = filter.achievement_range;
    return list.filter(s => {
        // Unplayed Filter
        if (!filter.showUnplayed && s.score.is_played === false) {
            return false;
        }

        // Level Filter without utage
        if (s.score.type !== "utage" && levelFilter.size > 0 && !levelFilter.has(s.score.level_index)) {
            return false;
        }
        // Level Filter for utage
        if (levelFilter.size > 0 && s.score.type === "utage" && !levelFilter.has(-1)) {
            return false;
        }

        // Category Filter
        if (categoryFilter.size > 0 && !categoryFilter.has(s.song.genre ?? "")) {
            return false;
        }

        // Version Filter
        if (versionFilter.size > 0) {
            const hasAllFinale = versionFilter.has('ALL FiNALE');
            if (!versionFilter.has(s.song.version) && !(hasAllFinale && isAllFinal(s.song.version))) {
                return false;
            }
        }

        // Map Filter
        if (mapFilter.size > 0 && !mapFilter.has(s.song.map ?? "")) {
            return false;
        }
        // DX score Filter
        const radio = getDxScoreRadio(s)
        if (dxScoreFilter.length > 0
            &&
            !dxScoreFilter.some(f =>
                radio >= f.min
                && radio < f.max
            )
        ) {
            return false;
        }
        // FC Filter
        if (fcFilter.size > 0 && !fcFilter.has(s.score.fc ?? "NAN")) {
            return false;
        }

        // FS Filter
        if (fsFilter.size > 0 && !fsFilter.has(s.score.fs ?? "NAN")) {
            return false;
        }

        // Type Filter
        if (typeFilter.size > 0 && !typeFilter.has(s.score.type)) {
            return false;
        }

        //Difficulty Range Filter
        const numericLevel = getNumericLevelValue(s.score);
        if (numericLevel === null || numericLevel < minDifficulty || numericLevel > maxDifficulty) {
            return false;
        }
        //Achievement Range Filter
        if (s.score.achievements === null || s.score.achievements < minAchievement || s.score.achievements > maxAchievement) {
            return false;
        }
        return true;
    });
}
const getNumericLevelValue = (score: ScoreExtend['score']): number | null => {
    if (score.type !== "utage" && typeof score.level_value === 'number') {
        return score.level_value;
    }
    // 针对 'utage' 或其他没有 level_value 的情况，解析 level 字符串
    const levelStr = score.level;
    // '13+'
    if (levelStr.includes('+')) {
        const baseLevel = parseFloat(levelStr);
        return !isNaN(baseLevel) ? baseLevel + 0.6 : null;
    }
    const level = parseFloat(levelStr);
    return !isNaN(level) ? level : null;
};
export const analysisTag = (score_list: ScoreExtend[], filter: AdvanceFilterFiltersForTag): GroupInfoForCounter[] => {
    const filtered = advanceFilter(filter, score_list);
    const tagMap: Record<number, DiffTagCounter> = {};
    filtered.forEach(score => {
        const tags: Array<DiffTAG> = TAG_JSON.tagSongs.filter((tag) =>
            tag.song_id === score.song.title &&
            LEVELS[score.score.level_index] === tag.sheet_difficulty &&
            DXTYPE[score.score.type] === tag.sheet_type
        ).map(tag => TAG_JSON.tags.find(tags => tags.id == tag.tag_id)).filter(t => t != undefined);
        tags.forEach(tag => {
            if (tag) {
                const old = tagMap[tag.id]
                if (!old) {
                    tagMap[tag.id] = { tag, count: 0 }
                }
                let multiplier = 1 + (score.score.achievements ?? 0) - 100 //根据达成率设置权重倍率
                let level_value = score.score.level_value ?? 0
                if (level_value >= 13) {
                    multiplier *= 0.0007 * Math.pow(Math.E, 0.5921 * level_value) //根据定数进一步倍增权重
                } else if (level_value >= 11) {
                    //level 11 ~ 13 (大部分为基础紫谱/底力红谱)
                    multiplier *= 0.25 * level_value - 1.75
                } else {
                    //level < 11 (大部分为红谱以下)
                    multiplier *= 0.1 * level_value - 0.1
                }
                multiplier = Math.pow(multiplier, 2) //扩大权重系数
                tagMap[tag.id].count += (1 * multiplier) / tags.length
            }
        })
    })
    const tags: Array<DiffTagCounter> = []
    for (const v of Object.entries(tagMap)) {
        tags.push(v[1])
    }
    return TAG_JSON.tagGroups.map(group => {
        const group_tags = tags.filter(tag => tag.tag.group_id === group.id);
        let total = 0;
        group_tags.forEach(t => total += t.count)
        group_tags.sort((a, b) => b.count - a.count)
        return {
            group,
            tags: group_tags,//按权重进行排序
            total
        }
    });
}