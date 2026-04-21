'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Toast Types ──
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// ── Context ──
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return a no-op if not within provider
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

// ── Icons for each type ──
const toastIcons = {
  [ToastType.SUCCESS]: { icon: <CheckCircle2 className='h-5 w-5' />, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
  [ToastType.ERROR]: { icon: <AlertCircle className='h-5 w-5' />, bg: 'bg-destructive/10', color: 'text-destructive' },
  [ToastType.WARNING]: { icon: <AlertTriangle className='h-5 w-5' />, bg: 'bg-amber-500/10', color: 'text-amber-500' },
  [ToastType.INFO]: { icon: <Info className='h-5 w-5' />, bg: 'bg-sky-500/10', color: 'text-sky-500' },
};

// ── Single Toast Item ──
function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const typeConfig = toastIcons[toast.type] || toastIcons[ToastType.INFO];
  const duration = toast.duration || 4000;

  useEffect(() => {
    // Auto dismiss timer
    const dismissTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [toast.id, duration, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      role='alert'
      aria-live='polite'
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-card transition-all duration-300 overflow-hidden max-w-sm w-full',
        exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      )}
    >
      {/* Icon */}
      <div className={cn('shrink-0 p-2 rounded-lg', typeConfig.bg, typeConfig.color)}>
        {typeConfig.icon}
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        {toast.title && (
          <p className='text-sm font-semibold text-foreground'>{toast.title}</p>
        )}
        {toast.message && (
          <p className={cn('text-xs text-muted-foreground mt-0.5', toast.title ? '' : 'mt-0')}>
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick?.();
              handleDismiss();
            }}
            className='mt-2 text-xs font-medium text-primary hover:underline'
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        onKeyDown={(e) => e.key === 'Escape' && handleDismiss()}
        className='shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary'
        aria-label='Dismiss notification'
      >
        <X className='h-4 w-4' />
      </button>

      {/* Progress bar */}
      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-secondary' aria-hidden='true'>
        <div
          className={cn('h-full transition-all duration-50', typeConfig.color.replace('text-', 'bg-'))}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Provider Component ──
let toastIdCounter = 0;

export function ToastProvider({ children, position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper methods for different toast types
  const success = useCallback((title, message, options = {}) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-4), { id, type: ToastType.SUCCESS, title, message, ...options }]);
  }, []);

  const error = useCallback((title, message, options = {}) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-4), { id, type: ToastType.ERROR, title, message, ...options }]);
  }, []);

  const warning = useCallback((title, message, options = {}) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-4), { id, type: ToastType.WARNING, title, message, ...options }]);
  }, []);

  const info = useCallback((title, message, options = {}) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-4), { id, type: ToastType.INFO, title, message, ...options }]);
  }, []);

  const contextValue = { success, error, warning, info, dismiss };

  // Position classes
  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div
          className={cn('fixed z-[100] flex flex-col gap-3 pointer-events-none', positionClasses[position] || positionClasses['top-right'])}
          aria-label='Notifications'
        >
          {toasts.map((toast) => (
            <div key={toast.id} className='pointer-events-auto'>
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;