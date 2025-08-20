import type { FishRecordResponse } from "@/types/divingfish";
import { request, type Response } from "./base";

const ENV_HOST = import.meta.env.VITE_API_BASE_URL

export const queryFishUserScores = (token: string): Promise<Response<FishRecordResponse>> => {
    // 准备请求头
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'authorization': token
    };
    const url = `${ENV_HOST}/maimai/fish`
    const requestOption: RequestInit = {
        method: 'GET',
        headers,
    }
    return request(url, requestOption)
}