import { API_ROUTER_HOST } from "@/api/router";

export async function getFromKey(key: string): Promise<any | null> {
    let res = await fetch(`${API_ROUTER_HOST}/kv?key=${key}`, {
        method: 'GET',
    });
    const body = await res.json()
    if (res.status != 200 || !body["success"]) {
        console.error("请求失败", body);
        return null;
    } else {
        return body.data
    }
}
export async function putToStorage(key: string, value: string) {
    let res = await fetch(`${API_ROUTER_HOST}/kv`, {
        method: 'POST',
        body: JSON.stringify({
            key,
            value
        })
    });
    const body = await res.json()
    if (res.status != 200 || !body["success"]) {
        console.error("请求失败", body);
        return false;
    } else {
        return true
    }
}