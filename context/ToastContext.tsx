'use client';

import { createContext, useContext, useCallback, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  type: string;
}

interface ToastContextType {
  showToast: (message: string, type?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastMessage key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

function ToastMessage({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  const [show, setShow] = useState(false);

  // Trigger show animation after mount
  if (!show) {
    setTimeout(() => setShow(true), 10);
  }

  return (
    <div className={`toast ${type}${show ? ' show' : ''}`}>
      <span>✓</span>
      <span>{message}</span>
      <span className="toast-close" onClick={onClose}>×</span>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be inside ToastProvider');
  return context;
}
