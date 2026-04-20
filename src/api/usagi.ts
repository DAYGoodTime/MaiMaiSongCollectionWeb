import type { UsagiScore } from "@/types/usagi"
import apiRouterClient from "./router";
export const rateMapping = ["sssp", "sss", "ssp", "ss", "sp", "s", "aaa", "aa", "a", "bbb", "bb", "b", "c", "d"]
export const fcMapping = ["app", "ap", "fcp", "fc"]
export const fsMapping = ["sync", "fs", "fsp", "fsd", "fsdp"]

const UsagiService = {
    queryUsagiUserScore: (uuid: string): Promise<UsagiScore[]> => {
        return apiRouterClient().get<UsagiScore[]>(`maimai/usagi/scores?uuid=${uuid}`)
    },
};

export default UsagiService;