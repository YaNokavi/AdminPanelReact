import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const success = useCallback((message: string, title = "Отлично!") => addToast("success", title, message), [addToast]);
  const error = useCallback((message: string, title = "Ошибка!") => addToast("error", title, message), [addToast]);
  const info = useCallback((message: string, title = "Уведомление") => addToast("info", title, message), [addToast]);

  return { toasts, success, error, info };
}
