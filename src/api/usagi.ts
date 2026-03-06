import type { UsagiResponse, UsagiScore } from "@/types/usagi"
import apiRouterClient from "./router";
export const rateMapping = ["sssp", "sss", "ssp", "ss", "sp", "s", "aaa", "aa", "a", "bbb", "bb", "b", "c", "d"]
export const fcMapping = ["app", "ap", "fcp", "fc"]
export const fsMapping = ["sync", "fs", "fsp", "fsd", "fsdp"]

// const HOST = import.meta.env.VITE_USAGI_API_HOST
// const DEV_TOKEN = import.meta.env.VITE_USAGI_DEV_TOKEN

// import { createApiClient } from './base';
// import apiRouterClient from "./router"

// async function handleUsagiError(response: Response) {
//     const errorBody = await response.json();
//     return {
//         message: `Usagi API Error: ${errorBody.detail || 'Unknown error'}`,
//         body: errorBody
//     };
// }
// const usagiApiClient = createApiClient({
//     baseUrl: HOST,
//     defaultHeaders: {
//         'x-developer-token': DEV_TOKEN,
//     },
//     handleError: handleUsagiError,
// });

const UsagiService = {
    queryUsagiUserScore: (uuid: string): Promise<UsagiScore[]> => {
        return apiRouterClient().get<UsagiScore[]>(`maimai/usagi/scores?uuid=${uuid}`)
    },
};

export default UsagiService;