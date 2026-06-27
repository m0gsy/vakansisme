"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

const ToastCtx = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const colors: Record<ToastType, string> = {
    success: "#9BFF3C",
    error: "#FF6B1A",
    info: "#8B7355",
  };

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        style={{ position: "fixed", bottom: "28px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "#1a1a1a",
                border: `1px solid ${colors[t.type]}40`,
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                maxWidth: "320px",
                pointerEvents: "auto",
              }}
            >
              <div style={{ width: "6px", height: "6px", background: colors[t.type], borderRadius: "50%", flexShrink: 0 }} />
              <span className="font-body text-off-white" style={{ fontSize: "0.82rem" }}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
