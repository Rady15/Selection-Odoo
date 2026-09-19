import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
 user: User | null;
 isAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
 register: (name: string, email: string, phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
 googleLogin: (credential: string) => Promise<{ success: boolean; error?: string }>;
 logout: () => void;
 updateUserInState: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'selection_token';
const USER_KEY = 'selection_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(() => {
 try {
 const saved = localStorage.getItem(USER_KEY);
 return saved ? JSON.parse(saved) : null;
 } catch {
 return null;
 }
 });

  useEffect(() => {
    let cancelled = false;
    let token: string | null = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      token = null;
    }
    if (!token) return;
    fetch('/api/auth/me')
    .then(async res => {
    if (!res.ok) throw new Error('session');
    return res.json();
    })
    .then(data => {
    if (!cancelled) setUser(data.user || null);
    })
    .catch(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable */
    }
    if (!cancelled) setUser(null);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable — session still works in-memory */
    }
  }, [user]);

  const completeAuth = (data: any) => {
    try {
      if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
    } catch {
      /* storage unavailable — session still works in-memory */
    }
    setUser(data.user || null);
  };

  const login = async (identifier: string, pass: string) => {
  try {
  const id = identifier.trim();
  // Accept email OR username: Odoo authenticates on `login`, so send the
  // identifier under every common key and let the backend pick it up.
  const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login: id, email: id, username: id, password: pass })
  });
 const data = await res.json();
 if (!res.ok) return { success: false, error: data.error_ar || data.error };
 completeAuth(data);
 return { success: true };
 } catch {
 return { success: false, error: 'حدث خطأ بالاتصال بالنظام' };
 }
 };

 const register = async (name: string, email: string, phone: string, pass: string) => {
 try {
 const res = await fetch('/api/auth/register', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, email, phone, password: pass })
 });
 const data = await res.json();
 if (!res.ok) return { success: false, error: data.error_ar || data.error };
 completeAuth(data);
 return { success: true };
 } catch {
 return { success: false, error: 'حدث خطأ عند تسجيل الحساب' };
 }
 };

 const googleLogin = useCallback(async (credential: string) => {
 try {
 const res = await fetch('/api/auth/google', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ credential })
 });
 const data = await res.json();
 if (!res.ok) return { success: false, error: data.error_ar || data.error };
 completeAuth(data);
 return { success: true };
 } catch {
 return { success: false, error: 'حدث خطأ في تسجيل الدخول بجوجل' };
 }
 }, []);

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable */
    }
    setUser(null);
  };

 const updateUserInState = (updated: User) => setUser(updated);

 return (
 <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, register, googleLogin, logout, updateUserInState }}>
 {children}
 </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth must be used within AuthProvider');
 return context;
};
