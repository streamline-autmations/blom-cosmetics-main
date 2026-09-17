import React, { useState, useEffect } from 'react';

type ToastProps = {
  title?: string;
  description?: string;
  duration?: number;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

// Create a simple custom event for toasts
const TOAST_EVENT = 'ui-toast';

export function useToast() {
  const toast = ({ title, description, duration = 3000 }: ToastProps) => {
    const event = new CustomEvent(TOAST_EVENT, {
      detail: { title, description, duration }
    });
    window.dispatchEvent(event);
  };

  return { toast };
}

export function Toaster() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastProps>;
      const id = Date.now();
      const newToast = { ...customEvent.detail, id };
      
      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, customEvent.detail.duration || 3000);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] animate-in slide-in-from-right-full fade-in duration-300"
        >
          {t.title && <h3 className="font-semibold text-gray-900">{t.title}</h3>}
          {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
