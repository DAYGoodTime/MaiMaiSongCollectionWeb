import { reactive, nextTick } from 'vue';

let hideTimer: number | undefined;

export const tooltipState = reactive({
  visible: false,
  content: '',
  onClick: null as (() => void) | null,
  target: null as HTMLElement | null,
});

export async function showTooltip(target: HTMLElement, content: string, onClick?: (() => void) | null) {
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

export function hideTooltip() {
  // 延迟隐藏，给用户时间将鼠标移动到Tooltip上
  hideTimer = setTimeout(() => {
    tooltipState.visible = false;
  }, 1000);
}

export function cancelHideTooltip() {
  clearTimeout(hideTimer);
}
