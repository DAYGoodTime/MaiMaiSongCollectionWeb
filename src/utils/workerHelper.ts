import type { AdvanceFilterFilters } from '@/types/component';
import type { ScoreExtend } from '@/types/songs';
import ScoreSearchWorker from '@/utils/scoreSearchWorker?worker'
import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import type { OrderBadge } from './songSearch';
import { getLevelValue } from './StrUtil';

export const useScoreSearchWorker = (searchKeyWord: MaybeRefOrGetter<string>, filter: MaybeRefOrGetter<AdvanceFilterFilters>, order: MaybeRefOrGetter<OrderBadge>) => {
    let searchWorker: Worker | null = null;
    const isLoading = ref(true)
    const searchResults = ref<ScoreExtend[]>([]);
    let ready = false;

    const updateIndex = (scoreList: ScoreExtend[]) => {
        if (!searchWorker) {
            initWorker();
        }
        if (searchWorker) {
            ready = false;
            searchWorker.postMessage({ type: 'init', payload: JSON.parse(JSON.stringify(scoreList)) })
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
                    searchResults.value = afterSearch(results, toValue(filter), toValue(order));
                    isLoading.value = false;
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
const afterSearch = (results: ScoreExtend[], filter: AdvanceFilterFilters, order: OrderBadge): ScoreExtend[] => {
    let list = advanceFilter(filter, results);
    if (order.status_index !== 0) list = orderBy(list, order)
    return list;
}
const advanceFilter = (filter: AdvanceFilterFilters, list: ScoreExtend[]): ScoreExtend[] => {
    let result = list;
    //level
    const level_filter = filter.difficulty.map(f => f.value);
    if (level_filter.length > 0) {
        result = result.filter(s => level_filter.includes(s.score.level_index))
    }
    //categories
    const category_filter = filter.musicCategories.map(f => f.value)
    if (category_filter.length > 0) {
        result = result.filter(s => category_filter.includes(s.song.genre ?? ""))
    }
    //version
    const version_filter = filter.version.map(f => f.value)
    if (version_filter.length > 0) {
        result = result.filter(s => version_filter.includes(s.song.version))
    }
    //map
    const map_filter = filter.mapCategories.map(f => f.value);
    if (map_filter.length > 0) {
        result = result.filter(s => map_filter.includes(s.song.map ?? ""))
    }
    //level_value_rang
    result = result.filter(s => {
        if (s.score.type !== "utage" && s.score.level_value) {
            return s.score.level_value >= filter.difficultyRange[0] && s.score.level_value <= filter.difficultyRange[1]
        }
        //难度拆分大师
        if (s.score.level.split("+").length != 2) {
            const level_value = Number(s.score.level.split("?")[0])
            if (!isNaN(level_value)) {
                return level_value >= filter.difficultyRange[0] && level_value <= filter.difficultyRange[1]
            } else return false;
        } else {
            let level_value2 = Number(s.score.level.split("+")[0])
            if (!isNaN(level_value2)) {
                level_value2 += 0.6;//as X.6
                return level_value2 >= filter.difficultyRange[0] && level_value2 <= filter.difficultyRange[1]
            } else return false;
        }
    })
    //fc
    const fc_filter = filter.fullCombo.map(f => f.value);
    if (fc_filter.length > 0) {
        result = result.filter(s => fc_filter.includes(s.score.fc ?? "NAN"))
    }
    //fs
    const fs_filter = filter.fullSync.map(f => f.value);
    if (fs_filter.length > 0) {
        result = result.filter(s => fs_filter.includes(s.score.fs ?? "NAN"))
    }
    //type
    const type_filter = filter.Type.map(f => f.value);
    if (type_filter.length == 1) {
        result = result.filter(s => type_filter.includes(s.score.type))
    }
    //unplayed
    if (!filter.showUnplayed) {
        result = result.filter(s => s.score.is_played !== false)
    }
    return result;
}
const orderBy = (list: ScoreExtend[], orderBy: OrderBadge) => {
    let ordered = [...list];
    switch (orderBy.value) {
        case 'achievement':
            ordered = ordered.sort((a, b) => {
                if (orderBy.status_index == 2) {
                    return a.score.achievements - b.score.achievements
                } else {
                    return b.score.achievements - a.score.achievements
                }
            });
            break;
        case 'dx_rating':
            ordered = ordered.sort((a, b) => {
                if (orderBy.status_index == 2) {
                    return a.score.dx_rating - b.score.dx_rating
                } else {
                    return b.score.dx_rating - a.score.dx_rating
                }
            });
            break;
        case 'level':
            ordered = ordered.sort((a, b) => {
                if (orderBy.status_index == 2) {
                    return getLevelValue(a) - getLevelValue(b)
                } else {
                    return getLevelValue(b) - getLevelValue(a)
                }
            });
            break;
        case 'play_count':
            if (ordered.length > 1 && (ordered[0].score.play_count || ordered[0].score.play_count != 0)) {
                ordered = ordered.sort((a, b) => {
                    if (orderBy.status_index == 2) {
                        return (a.score.play_count ?? 0) - (b.score.play_count ?? 0)
                    } else {
                        return (b.score.play_count ?? 0) - (a.score.play_count ?? 0)
                    }
                });
            }
            break;
    }
    return ordered;
}