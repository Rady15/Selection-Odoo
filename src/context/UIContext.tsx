import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface AuthOptions {
 message?: string;
 onSuccess?: () => void;
}

interface UIContextType {
 authOpen: boolean;
 authMessage: string;
 openAuth: (options?: AuthOptions) => void;
 closeAuth: () => void;
 fireAuthSuccess: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [authOpen, setAuthOpen] = useState(false);
 const [authMessage, setAuthMessage] = useState('');
 const authOnSuccessRef = useRef<(() => void) | null>(null);

 const openAuth = useCallback((options?: AuthOptions) => {
 setAuthMessage(options?.message || '');
 authOnSuccessRef.current = options?.onSuccess || null;
 setAuthOpen(true);
 }, []);

 const closeAuth = useCallback(() => {
 setAuthOpen(false);
 authOnSuccessRef.current = null;
 }, []);

 const fireAuthSuccess = useCallback(() => {
 const cb = authOnSuccessRef.current;
 setAuthOpen(false);
 authOnSuccessRef.current = null;
 if (cb) cb();
 }, []);

 return (
 <UIContext.Provider value={{ authOpen, authMessage, openAuth, closeAuth, fireAuthSuccess }}>
 {children}
 </UIContext.Provider>
 );
};

export const useUI = () => {
 const context = useContext(UIContext);
 if (!context) throw new Error('useUI must be used within UIProvider');
 return context;
};
