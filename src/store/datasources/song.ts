import { QuerySongs } from "@/api/other";
import type { DataSource } from "@/types/datasource";
import type { MaiMaiSong, SongDifficultyAny, SongUniId } from "@/types/songs";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { toast } from "vue-sonner";
import DEFAULT_SONGS from "@/assets/data/song_data_default.json" with { type: 'json' }

const CURRENT_SONG_VERSION = 6
const LOCAL_SONG_UPDATE_TIME = "2025-11-6 18:08:00"
const DEFAULT_SONG_DATA: DataSource<Record<number, MaiMaiSong>> = {
    list: DEFAULT_SONGS as any,
    update_time: LOCAL_SONG_UPDATE_TIME,
    version: CURRENT_SONG_VERSION
}
export const useSongStore = defineStore("ds_song", () => {
    const SONG_LIST = useLocalStorage("song_list", DEFAULT_SONG_DATA)
    const getSongList = () => {
        const list: MaiMaiSong[] = []
        for (const entry of Object.entries(SONG_LIST.value.list)) {
            list.push(entry[1])
        }
        return list;
    }
    const LastSongUpdateTime = useLocalStorage("last_song_update", -1)
    const getSong = (song_id: number | string): MaiMaiSong | undefined => {
        return SONG_LIST.value.list[song_id as keyof Record<number, MaiMaiSong>];
    }
    const updateSongFromAPI = async (manual: boolean = true) => {
        try {
            const result = await QuerySongs();
            if (result.version && result.version != SONG_LIST.value.version) {
                console.log("歌曲数据源有变动，正在更新~");
                SONG_LIST.value = {
                    list: result.list,
                    update_time: formatDate(new Date()),
                    version: result.version
                }
                return true
            } else {
                if (result.version && manual) {
                    toast.info("歌曲源已经是最新版本，无需更新")
                } else if (manual) {
                    toast.warning("更新歌曲源失败")
                }
                console.warn("更新歌曲源失败,请求结果：", result);
            }
        } catch (e) {
            if (manual) {
                toast.warning("更新歌曲源失败")
                console.warn("更新歌曲源失败", e);
            }
        } finally {
            LastSongUpdateTime.value = new Date().getTime()
        }
        return false;
    }
    const getDiffById = (uni_id: string): SongDifficultyAny | undefined => {
        const splits = uni_id.split("_");
        if (splits.length < 2) return undefined;
        const diff_id = splits[0]
        const song = getSong(diff_id)
        if (!song) return undefined;
        return song[uni_id as SongUniId]
    }
    const checkSongUpdate = () => {
        if (SONG_LIST.value.version !== CURRENT_SONG_VERSION) return true;
        const now = new Date().getTime()
        // 7 day
        return now - LastSongUpdateTime.value >= 1000 * 3600 * 24 * 7;
    }
    return {
        SONG_LIST,
        updateSongFromAPI,
        getSong,
        getDiffById,
        checkSongUpdate,
        getSongList
    };
});