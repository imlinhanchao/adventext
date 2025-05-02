// import { useI18n } from 'vue-i18n';
import type { NotificationParams } from 'element-plus/lib/components/notification';

import { ElMessageBox, ElMessage, ElNotification, ElLoadingService } from 'element-plus';
import { isString } from '@/utils/is';

export declare type NotificationPlacement = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export declare type IconType = 'success' | 'info' | 'error' | 'warning';

function createNotify(options: NotificationParams) {
  if (isString(options)) options = { message: options };

  const opt = {
    title: '提示',
    type: 'success',
    ...options,
  };
  return ElNotification(opt as unknown as NotificationParams);
}

/**
 * @description: message
 */
export function useMessage() {
  return {
    createMessage: ElMessage,
    createNotify,
    createMsgbox: ElMessageBox,
    createAlert: ElMessageBox.alert,
    createConfirm: ElMessageBox.confirm,
    createPrompt: ElMessageBox.prompt,
  };
}

/* --------------------------- 重新导出elementUI反馈助手 -------------------------- */
export const $message = ElMessage;
export const $notify = ElNotification;

export const $msgbox = ElMessageBox;
export const $messageBox = ElMessageBox;
export const $alert = ElMessageBox.alert;
export const $confirm = ElMessageBox.confirm;
export const $prompt = ElMessageBox.prompt;

export const $loading = ElLoadingService;
