import type { UsagiScore } from "@/types/usagi"
export const rateMapping = ["sssp", "sss", "ssp", "ss", "sp", "s", "aaa", "aa", "a", "bbb", "bb", "b", "c", "d"]
export const fcMapping = ["app", "ap", "fcp", "fc"]
export const fsMapping = ["sync", "fs", "fsp", "fsd", "fsdp"]

const HOST = "https://uc.turou.fun/api"
const DEV_TOKEN = import.meta.env.VITE_USAGI_DEV_TOKEN

import { createApiClient } from './base';

async function handleUsagiError(response: Response) {
    const errorBody = await response.json();
    return {
        message: `Usagi API Error: ${errorBody.detail || 'Unknown error'}`,
        body: errorBody
    };
}
const usagiApiClient = createApiClient({
    baseUrl: HOST,
    defaultHeaders: {
        'x-developer-token': DEV_TOKEN,
    },
    handleError: handleUsagiError,
});

const UsagiService = {
    queryUsagiUserScore: (uuid: string): Promise<UsagiScore[]> => {
        return usagiApiClient.get<UsagiScore[]>(`v1/maimai/scores?uuid=${uuid}`);
    },
};

export default UsagiService;