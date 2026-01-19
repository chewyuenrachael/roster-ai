import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast types and their configurations
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    textColor: '#065F46',
    iconColor: '#10B981'
  },
  error: {
    icon: AlertCircle,
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#991B1B',
    iconColor: '#EF4444'
  },
  info: {
    icon: Info,
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1E40AF',
    iconColor: '#3B82F6'
  },
  warning: {
    icon: AlertCircle,
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
    textColor: '#92400E',
    iconColor: '#F59E0B'
  }
};

// Individual Toast Component
const Toast = ({ id, type, message, onDismiss }) => {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  return (
    <div 
      className="toast-item"
      style={{
        background: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
    >
      <Icon size={20} style={{ color: config.iconColor, flexShrink: 0 }} />
      <span className="toast-message">{message}</span>
      <button 
        className="toast-dismiss"
        onClick={() => onDismiss(id)}
        style={{ color: config.textColor }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      <style>{toastStyles}</style>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          {...toast} 
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    dismiss: dismissToast,
    dismissAll: () => setToasts([])
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Styles
const toastStyles = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
    pointer-events: none;
  }

  .toast-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .toast-message {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  .toast-dismiss {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;
    flex-shrink: 0;
  }

  .toast-dismiss:hover {
    opacity: 1;
  }

  @media (max-width: 480px) {
    .toast-container {
      left: 12px;
      right: 12px;
      max-width: none;
    }
  }
`;

export default ToastProvider;
