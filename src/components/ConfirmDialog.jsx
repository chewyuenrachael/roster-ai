import React from 'react';
import { AlertTriangle, Trash2, RefreshCw, Send, X } from 'lucide-react';

// Confirm dialog types with their configurations
const DIALOG_TYPES = {
  danger: {
    icon: AlertTriangle,
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    confirmBg: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    confirmHoverBg: '#B91C1C'
  },
  warning: {
    icon: RefreshCw,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    confirmBg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    confirmHoverBg: '#B45309'
  },
  info: {
    icon: Send,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    confirmBg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    confirmHoverBg: '#1D4ED8'
  }
};

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const config = DIALOG_TYPES[type] || DIALOG_TYPES.warning;
  const Icon = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <>
      <style>{confirmDialogStyles}</style>
      <div className="confirm-backdrop" onClick={handleBackdropClick}>
        <div className="confirm-dialog">
          <button 
            className="confirm-close-btn" 
            onClick={onClose} 
            disabled={isLoading}
          >
            <X size={20} />
          </button>
          
          <div 
            className="confirm-icon" 
            style={{ backgroundColor: config.iconBg }}
          >
            <Icon size={28} style={{ color: config.iconColor }} />
          </div>
          
          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
          
          <div className="confirm-actions">
            <button 
              className="confirm-cancel-btn" 
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              className="confirm-confirm-btn"
              onClick={handleConfirm}
              disabled={isLoading}
              style={{ background: config.confirmBg }}
            >
              {isLoading ? (
                <>
                  <div className="confirm-spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const confirmDialogStyles = `
  .confirm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .confirm-dialog {
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 420px;
    width: 90%;
    position: relative;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .confirm-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #94A3B8;
    transition: color 0.2s;
  }

  .confirm-close-btn:hover {
    color: #475569;
  }

  .confirm-close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .confirm-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  .confirm-title {
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 8px;
  }

  .confirm-message {
    text-align: center;
    font-size: 14px;
    color: #64748B;
    line-height: 1.6;
    margin-bottom: 28px;
  }

  .confirm-actions {
    display: flex;
    gap: 12px;
  }

  .confirm-cancel-btn,
  .confirm-confirm-btn {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .confirm-cancel-btn {
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    color: #475569;
  }

  .confirm-cancel-btn:hover:not(:disabled) {
    background: #E2E8F0;
  }

  .confirm-cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .confirm-confirm-btn {
    border: none;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .confirm-confirm-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .confirm-confirm-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .confirm-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default ConfirmDialog;
