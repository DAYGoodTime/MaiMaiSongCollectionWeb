import { QuerySongs } from "@/api/other";
import type { DataSource } from "@/types/datasource";
import type { MaiMaiSong, SongDifficulty, SongDifficultyUtage } from "@/types/songs";
import { formatDate } from "@/utils/StrUtil";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { toast } from "vue-sonner";

const CURRENT_SONG_VERSION = 4
const LOCAL_SONG_UPDATE_TIME = "2025-10-1 10:39:00"
const DEFAULT_SONG_DATA: DataSource<Record<number, MaiMaiSong>> = {
    list: {},
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
    const getSong = (song_id: number | string): MaiMaiSong => {
        return SONG_LIST.value.list[song_id as keyof Record<number, MaiMaiSong>];
    }
    const updateSongFromAPI = async () => {
        const result = await QuerySongs();
        if (result.version != SONG_LIST.value.version) {
            toast.info("歌曲数据源有变动，正在更新~")
        }
        SONG_LIST.value = {
            list: result.list,
            update_time: formatDate(new Date()),
            version: result.version
        }
    }
    const getDiffById = (uni_id: string): SongDifficulty | SongDifficultyUtage | undefined => {
        const splits = uni_id.split("_");
        if (splits.length < 2) return undefined;
        const diff_id = splits[0]
        const song = getSong(diff_id)
        if (!song) return undefined;
        return song[uni_id as keyof MaiMaiSong] as unknown as SongDifficulty | SongDifficultyUtage | undefined
    }
    const checkSongUpdate = () => {
        const now = new Date().getTime()
        // 7 day
        return now - LastSongUpdateTime.value >= 3600 * 24 * 7;
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