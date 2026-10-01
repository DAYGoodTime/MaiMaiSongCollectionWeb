import type { FishChartStatsResponse, FishRecordResponse } from "@/types/divingfish";
import { createApiClient } from "./base";


export const FISH_HOST = "https://www.diving-fish.com/api/maimaidxprober";
async function handleDivingFishError(response: Response) {
    const errorBody = await response.json();
    return {
        message: `DivingFish API Error: ${errorBody.message || 'Unknown error'}`,
        body: errorBody
    };
}
const fishApiClient = (token: string) => createApiClient({
    baseUrl: FISH_HOST,
    defaultHeaders: {
        "Import-Token": token
    },
    handleError: handleDivingFishError,
});
const DivingFishService = {
    queryFishUserScores: (token: string): Promise<FishRecordResponse> => {
        return fishApiClient(token).get<FishRecordResponse>(`player/records`);
    },
    queryFishChartData: (): Promise<FishChartStatsResponse> => {
        return fishApiClient("").get<FishChartStatsResponse>(`chart_stats`);
    },
};

export default DivingFishService;
