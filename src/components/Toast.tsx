'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ShieldCheck, Sparkles } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const activeToast = toasts[toasts.length - 1];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Centered App-Themed Toast Modal Container */}
      {activeToast && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#090d16]/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#141c2e] via-[#101726] to-[#090d16] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl shadow-cyan-500/20 animate-scale-in text-center flex flex-col items-center overflow-hidden">
            
            {/* Top Glowing Ambient Light */}
            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
              activeToast.type === 'success' ? 'bg-emerald-500/25' :
              activeToast.type === 'error' ? 'bg-rose-500/25' : 'bg-cyan-500/25'
            }`} />

            {/* Close Button */}
            <button
              onClick={() => dismiss(activeToast.id)}
              className="absolute top-4 right-4 p-1.5 text-[#9CA3AF] hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Centered Glowing Icon Badge */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-lg border ${
              activeToast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-[#D4A855] shadow-emerald-500/20' :
              activeToast.type === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-[#D4A855] shadow-rose-500/20' :
              'bg-cyan-500/20 border-cyan-500/40 text-[#D4A855] shadow-cyan-500/20'
            }`}>
              {activeToast.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
              {activeToast.type === 'error' && <AlertTriangle className="w-8 h-8" />}
              {activeToast.type === 'info' && <Sparkles className="w-8 h-8" />}
            </div>

            {/* Header Badge */}
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2 border ${
              activeToast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-[#D4A855]' :
              activeToast.type === 'error' ? 'bg-rose-500/15 border-rose-500/30 text-[#D4A855]' :
              'bg-cyan-500/15 border-cyan-500/30 text-[#D4A855]'
            }`}>
              {activeToast.title || (activeToast.type === 'success' ? 'Thành công' : activeToast.type === 'error' ? 'Cảnh báo hệ thống' : 'Thông báo')}
            </span>

            {/* Message Body */}
            <p className="text-sm font-bold text-white leading-relaxed px-1 my-1">
              {activeToast.message}
            </p>

            {/* Action Confirm Button */}
            <button
              onClick={() => dismiss(activeToast.id)}
              className={`w-full mt-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                activeToast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20' :
                activeToast.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-400 hover:to-red-500 shadow-rose-500/20' :
                'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
              }`}
            >
              Đã hiểu & Xác nhận
            </button>

            {/* Animated Bottom Timer Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div className={`h-full animate-toast-progress ${
                activeToast.type === 'success' ? 'bg-emerald-400' :
                activeToast.type === 'error' ? 'bg-rose-400' :
                'bg-cyan-400'
              }`} />
            </div>

          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
