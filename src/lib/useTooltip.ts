import { reactive, nextTick, type VNode } from 'vue';

let hideTimer: NodeJS.Timeout | undefined;

export const tooltipState = reactive({
  visible: false,
  content: null as string | VNode | null,
  onClick: null as (() => void) | null,
  target: null as HTMLElement | null,
});

export async function showTooltip(target: HTMLElement, content: string | VNode, onClick?: (() => void) | null) {
  // 取消任何待处理的隐藏操作
  clearTimeout(hideTimer);


  // 如果Tooltip已经可见，则先隐藏以强制位置更新
  if (tooltipState.visible) {
    tooltipState.visible = false;
    await nextTick();
  }

  tooltipState.target = target;
  tooltipState.content = content;
  tooltipState.onClick = onClick || null;
  tooltipState.visible = true;
}

export function hideTooltip(timeout?: number) {
  const timeoutTime = timeout ?? 1000
  hideTimer = setTimeout(() => {
    tooltipState.visible = false;
  }, timeoutTime);
}

export function cancelHideTooltip() {
  clearTimeout(hideTimer);
}
