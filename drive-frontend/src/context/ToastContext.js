'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
    const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
    const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

    const icons = {
        success: <CheckCircle size={18} />,
        error: <XCircle size={18} />,
        info: <Info size={18} />,
    };

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {icons[toast.type]}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
