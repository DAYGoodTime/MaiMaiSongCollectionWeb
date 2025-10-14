import type { MaiMaiSong } from "@/types/songs";
import apiRouterClient from "./router";

interface QuerySongResponse {
    version: number,
    list: Record<number, MaiMaiSong>
}
interface VersionResponse {
    new: string,
    min: string
}

export const QuerySongs = (): Promise<QuerySongResponse> => {
    return apiRouterClient().get<QuerySongResponse>("maimai/v2/songs")
}

export const checkVersion = (): Promise<VersionResponse> => {
    return apiRouterClient().get<VersionResponse>("version")
}