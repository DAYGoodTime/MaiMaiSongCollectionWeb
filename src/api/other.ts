import type { MaiMaiSong } from "@/types/songs";
import apiRouterClient from "./router";

export const QuerySongs = (): Promise<MaiMaiSong[]> => {
    return apiRouterClient().get<MaiMaiSong[]>("maimai/songs")
}