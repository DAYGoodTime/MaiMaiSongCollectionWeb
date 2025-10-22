import type { AdvanceFilterFilters } from '@/types/component';
import type { LevelFields, MaiMaiSong, ScoreExtend } from '@/types/songs';
import ScoreSearchWorker from '@/utils/scoreSearchWorker?worker'
import SongSearchWorker from '@/utils/songSearchWorker?worker'
import { onUnmounted, ref, toRaw, toValue, watch, type MaybeRefOrGetter } from 'vue';
import type { OrderBadge } from '@/types/component';
import { BASE_NUMBER_RANGE_PATTEN, conventLevelPrefix, conventLevelTag, getDxScoreRadio, getLevelValue, isAllFinal, isValidAchievementRange, LEVEL_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN, RANKING_MATCH_PATTEN } from '@/utils/StrUtil';
import type { SearchOptions } from '@/components/SongSearch.vue';
import { rankingList } from './urlUtils';
import versionList from '@/assets/data/versions.json' with { type: 'json' };
import { useScores } from '@/store/datasources/scores';
import { useSongStore } from '@/store/datasources/song';
import { MAX_SEARCH_NUMBER } from './consts';
import { getSongDiffValueIndex } from './functionUtil';

//Score Worker
export const useScoreSearchWorker = (searchKeyWord: MaybeRefOrGetter<string>, filter: MaybeRefOrGetter<AdvanceFilterFilters>, order: MaybeRefOrGetter<OrderBadge>) => {
    let searchWorker: Worker | null = null;
    const isLoading = ref(true)
    const searchResults = ref<ScoreExtend[]>([]);
    let ready = false;

    const updateIndex = async (scoreList: MaybeRefOrGetter<ScoreExtend[]>) => {
        if (!searchWorker) {
            initWorker();
        }
        if (searchWorker) {
            ready = false;
            searchWorker.postMessage({ type: 'init', payload: scoreList })
        }
    }
    const initWorker = () => {
        searchWorker = new ScoreSearchWorker();
        searchWorker.onmessage = ({ data }) => {
            const { type, results } = data;
            switch (type) {
                case 'ready': {
                    ready = true;
                    search();
                    break;
                }
                case 'search_results': {
                    searchResults.value = afterSearchScore(results, toValue(filter), toValue(order));
                    setTimeout(() => isLoading.value = false, 200)
                    break;
                }
            }
        }
        searchWorker.onerror = (e) => {
            isLoading.value = false;
            console.error("ScoreSearchWorker:Error", e);
        }
        searchWorker.onmessageerror = (e) => {
            isLoading.value = false;
            console.error("ScoreSearchWorker:Error", e);
        }
    }
    const search = () => {
        if (!searchWorker) {
            initWorker();
        }
        if (ready && searchWorker) {
            isLoading.value = true;
            searchWorker.postMessage({ type: 'search', payload: toValue(searchKeyWord) })
        }
    }
    //watch
    watch(() => toValue(searchKeyWord), (newSearch) => {
        if (!searchWorker) {
            initWorker();
        }
        if (ready && searchWorker) {
            isLoading.value = true;
            searchWorker.postMessage({ type: 'search', payload: newSearch })
        }
    })
    watch(() => toValue(filter), (_newFilter) => {
        isLoading.value = true;
        search();
    }, { deep: true })
    watch(() => toValue(order), (newOrder) => {
        isLoading.value = true;
        if (newOrder.status_index !== 0) {
            searchResults.value = orderBy(searchResults.value, newOrder)
        }
        isLoading.value = false;
    }, { deep: true })
    //
    onUnmounted(() => {
        if (searchWorker) {
            searchWorker.terminate();
            searchWorker = null;
            searchResults.value = []
            ready = false;
            isLoading.value = true
        }
    })
    return {
        isLoading,
        searchResults,
        updateIndex,
        search
    }
}
const afterSearchScore = (results: ScoreExtend[], filter: AdvanceFilterFilters, order: OrderBadge): ScoreExtend[] => {
    let list = advanceFilter(filter, results);
    if (order.status_index !== 0) list = orderBy(list, order)
    return list;
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
const advanceFilter = (filter: AdvanceFilterFilters, list: ScoreExtend[]): ScoreExtend[] => {
    const levelFilter = new Set(filter.difficulty.map(f => f.value));
    const categoryFilter = new Set(filter.musicCategories.map(f => f.value));
    const versionFilter = new Set(filter.version.map(f => f.value));
    const mapFilter = new Set(filter.mapCategories.map(f => f.value));
    const dxScoreFilter = filter.dxScore.map(f => f.value);
    const fcFilter = new Set(filter.fullCombo.map(f => f.value));
    const fsFilter = new Set(filter.fullSync.map(f => f.value));
    const typeFilter = new Set(filter.Type.map(f => f.value));
    const [minDifficulty, maxDifficulty] = filter.difficultyRange;
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
        if (versionFilter.size > 0 && !versionFilter.has(s.song.version)) {
            return false;
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

        return true;
    });
}
//sorting
type SortField = 'achievement' | 'dx_rating' | 'level' | 'play_count' | 'dx_score';
const sortByNumber = (a: number | undefined, b: number | undefined, isAscending: boolean) => {
    const result = (a ?? 0) - (b ?? 0);
    return isAscending ? -result : result;
}
const orderBy = (list: ScoreExtend[], orderBy: OrderBadge) => {
    const ordered = [...list];
    const isAscending = orderBy.status_index === 2; // 2 表示升序
    const sortField = orderBy.value as SortField;

    const sortFunctions = new Map<SortField, (a: ScoreExtend, b: ScoreExtend) => number>([
        ['achievement', (a, b) => sortByNumber(a.score.achievements, b.score.achievements, isAscending)],
        ['dx_rating', (a, b) => sortByNumber(a.score.dx_rating, b.score.dx_rating, isAscending)],
        ['level', (a, b) => sortByNumber(getLevelValue(a), getLevelValue(b), isAscending)],
        ['play_count', (a, b) => sortByNumber(a.score.play_count, b.score.play_count, isAscending)],
        ['dx_score', (a, b) => sortByNumber(getDxScoreRadio(a), getDxScoreRadio(b), isAscending)]
    ]);
    const sortFunction = sortFunctions.get(sortField);
    if (sortFunction) {
        ordered.sort(sortFunction);
    } else {
        console.warn(`Unknown sort field: ${sortField}`);
    }
    return ordered;
}
//Song Worker
export const useSongSearchWorker = (searchKeyWord: MaybeRefOrGetter<string>, searchOptions: MaybeRefOrGetter<SearchOptions>) => {
    let searchWorker: Worker | null = null;
    const isLoading = ref(true)
    const ScoreStore = useScores();
    const SongStore = useSongStore();
    const searchResults = ref<MaiMaiSong[]>([]);
    let ready = false;
    const updateIndex = (songMap: Record<number, MaiMaiSong>) => {
        if (!searchWorker) {
            initWorker();
        }
        if (searchWorker) {
            ready = false;
            searchWorker.postMessage({ type: 'init', payload: { records: toRaw(songMap), searchLimit: MAX_SEARCH_NUMBER } })
        }
    }
    const initWorker = () => {
        searchWorker = new SongSearchWorker();
        searchWorker.onmessage = ({ data }) => {
            const { type, results } = data;
            switch (type) {
                case 'ready': {
                    ready = true;
                    search();
                    break;
                }
                case 'search_results': {
                    searchResults.value = afterSearchSong(results);
                    isLoading.value = false;
                    break;
                }
            }
        }
        searchWorker.onerror = (e) => {
            isLoading.value = false;
            console.error("SongSearchWorker:Error", e);
        }
        searchWorker.onmessageerror = (e) => {
            isLoading.value = false;
            console.error("SongSearchWorker:Error", e);
        }
    }
    const search = (limit?: number) => {
        if (!searchWorker) {
            initWorker();
        }
        if (ready && searchWorker) {
            isLoading.value = true;
            const payload = limit ? { input: toValue(searchKeyWord), searchLimit: limit } : toValue(searchKeyWord)
            searchWorker.postMessage({ type: 'search', payload: payload })
        }
    }
    const afterSearchSong = (results: MaiMaiSong[]) => {
        const options = toValue(searchOptions)
        const list: MaiMaiSong[] = []
        for (const song of results) {
            if (options.bpm.enable) {
                if (song.bpm > options.bpm.range[1] || song.bpm < options.bpm.range[0])
                    continue;
            }
            //匹配标签
            const tagFilters = options.selected_tags.map(t => t.value);
            if (tagFilters.length > 0) {
                const matchesTags = filterByTag(tagFilters, song);
                if (!matchesTags) continue;
            }
            list.push(song);
        }
        return list;
    }
    const filterByTag = (tagFilters: string[], song: MaiMaiSong) => {
        // 标签过滤
        const matchesTags = tagFilters.length === 0 ? true : tagFilters.every(tag => {
            // 定数tag过滤
            if (LEVEL_MATCH_PATTEN.test(tag)) {
                const level_filter = conventLevelTag(tag);
                if (level_filter) {
                    const index_key = `level_${level_filter.level_index}`;
                    const index_list = song[index_key as LevelFields];
                    return Array.isArray(index_list) && index_list.some(i => i === level_filter.level_value);
                }
            }
            //范围定数过滤
            if (LEVEL_RANGE_MATCH_PATTEN.test(tag)) {
                const indexValueList = getSongDiffValueIndex(song)
                const [start, end] = tag.split("-");
                const levelStart = Number(start);
                const levelEnd = Number(end)
                return indexValueList.some(level_value => level_value >= levelStart && level_value <= levelEnd)
            }
            // 成绩标签过滤
            if (RANKING_MATCH_PATTEN.test(tag)) {
                const splits = tag.split("_");
                if (splits.length === 2) {
                    const level_index_tag = conventLevelPrefix(splits[0]);
                    const ranking_target = rankingList.find(r => r.id === splits[1]);
                    if (ranking_target) {
                        const scoreList = ScoreStore.getScoreList(song.id);
                        return scoreList.some(
                            (s) => s.level_index === level_index_tag &&
                                s.achievements > ranking_target.min &&
                                s.achievements < ranking_target.max
                        );
                    }
                }
            }
            // 成绩范围标签过滤
            if (isValidAchievementRange(tag)) {
                const matched = tag.match(BASE_NUMBER_RANGE_PATTEN);
                if (!matched || matched.length !== 3) return false;
                const start = parseFloat(matched[1]);
                const end = parseFloat(matched[2]);
                const scoreList = ScoreStore.getScoreList(song.id);
                return scoreList.some((s) => start <= s.achievements && end >= s.achievements);
            }
            // 旧框版本特判
            if (tag === "ALL FiNALE") {
                return isAllFinal(song.version);
            }
            // 版本标签过滤
            const versionMatch = versionList.find(v => v.id === tag);
            if (versionMatch) {
                return song.version === tag;
            }
            return false;
        });
        return matchesTags
    }
    //watch
    watch(() => toValue(searchKeyWord), (newSearch) => {
        if (!searchWorker) {
            initWorker();
        }
        if (ready && searchWorker) {
            isLoading.value = true;
            searchWorker.postMessage({ type: 'search', payload: newSearch })
        }
    })
    watch(() => toValue(searchOptions), (_newOptions) => {
        isLoading.value = true;
        search()
    }, { deep: true })
    //init
    updateIndex(SongStore.SONG_LIST.list)
    search()
    //
    onUnmounted(() => {
        if (searchWorker) {
            searchWorker.terminate();
            searchWorker = null;
            searchResults.value = []
            ready = false;
            isLoading.value = true
        }
    })
    return {
        isLoading,
        searchResults,
        updateIndex,
        search
    }
}
