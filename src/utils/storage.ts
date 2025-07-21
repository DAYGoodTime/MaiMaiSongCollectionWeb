import { toast } from "vue-sonner";


export async function getFromKey(key: string): Promise<any | null> {
    let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/kv?key=${key}`, {
        method: 'GET',
    });
    const body = await res.json()
    if (res.status != 200 || !body["success"]) {
        toast.error(`请求失败，请查看控制台\n Error:${body["message"] ?? 'unexpected error'}`)
        return null;
    } else {
        return body.data
    }
}
export async function putToStorage(key: string, value: string) {
    let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/kv`, {
        method: 'POST',
        body: JSON.stringify({
            key,
            value
        })
    });
    const body = await res.json()
    if (res.status != 200 || !body["success"]) {
        toast.error(`请求失败，请查看控制台\n Error:${body["message"] ?? 'unexpected error'}`)
        return false;
    } else {
        return true
    }
}