import type { MaiMaiSong } from "@/types/songs";
import apiRouterClient from "./router";

interface QuerySongResponse {
    version: number,
    list: Record<number, MaiMaiSong>
}

export const QuerySongs = (): Promise<QuerySongResponse> => {
    return apiRouterClient().get<QuerySongResponse>("maimai/v2/songs")
}