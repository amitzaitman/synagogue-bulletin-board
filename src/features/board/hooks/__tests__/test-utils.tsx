import React from 'react';
import { ToastContext } from '../../../../shared/context/ToastContext';
import { vi } from 'vitest';

export const mockShowToast = vi.fn();
export const mockRemoveToast = vi.fn();

export const ToastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ToastContext.Provider value={{ showToast: mockShowToast, removeToast: mockRemoveToast }}>
            {children}
        </ToastContext.Provider>
    );
};
