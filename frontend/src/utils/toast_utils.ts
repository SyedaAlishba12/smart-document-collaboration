export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  type: ToastType;
  message: string;
}

export function createToast(
  type: ToastType,
  message: string
): ToastMessage {
  return {
    type,
    message,
  };
}

export function successToast(message: string): ToastMessage {
  return createToast("success", message);
}

export function errorToast(message: string): ToastMessage {
  return createToast("error", message);
}

export function warningToast(message: string): ToastMessage {
  return createToast("warning", message);
}

export function infoToast(message: string): ToastMessage {
  return createToast("info", message);
}