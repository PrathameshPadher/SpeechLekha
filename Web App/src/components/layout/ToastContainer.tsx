import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        return (
          <div key={toast.id} className={`toast-item toast-${toast.type || 'info'}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'warning' && <AlertCircle size={16} />}
              {(toast.type === 'info' || !toast.type) && <Info size={16} />}
            </div>
            <div className="toast-body">
              <strong>{toast.title}</strong>
              {toast.description && <p>{toast.description}</p>}
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
