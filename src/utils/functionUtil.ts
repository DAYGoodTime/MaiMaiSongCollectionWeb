import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";

type DebouncedFunction<T extends any[]> = (...args: T) => void;

export function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay: number = 300
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(null, args);
    }, delay);
  };
}
export function useRouterHelper() {
  const router = useRouter();
  const route = useRoute();
  const JumpTo = (to: RouteLocationRaw) => {
    router.push(to)
  }
  const JumpToFromEvent = (e: Event, to: RouteLocationRaw) => {
    e.preventDefault();
    router.push(to)
  }
  const backHome = () => {
    router.push({
      name: "Home"
    })
  }
  return { router, route, JumpTo, JumpToFromEvent, backHome }
}
export function exportFile(content: any, fileName: string, type: string = "application/json") {
  const blob = new Blob([content], { type: type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
