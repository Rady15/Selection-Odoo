import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { Lock, LogIn, ShieldAlert, Store } from 'lucide-react';

interface LoginGateProps {
 isAdminOnly?: boolean;
 onNavigate: (path: string) => void;
 children: React.ReactNode;
}

export const LoginGate: React.FC<LoginGateProps> = ({ isAdminOnly, onNavigate, children }) => {
 const { t } = useLanguage();
 const { user, isAdmin } = useAuth();
 const { openAuth } = useUI();

 const userRef = useRef(user);
 userRef.current = user;

 const message = isAdminOnly
 ? t('سجّل الدخول بحساب المدير للوصول إلى لوحة التحكم', 'Login with an admin account to access the dashboard')
 : t('سجّل الدخول أو أنشئ حساباً للوصول إلى حسابك وطلباتك', 'Login or create an account to access your dashboard');

 const requestLogin = () => {
 openAuth({
 message,
 onSuccess: () => {
 onNavigate(userRef.current?.role === 'admin' ? '/admin' : '/account');
 }
 });
 };

 // Route each role to its own dashboard automatically.
 useEffect(() => {
 if (!user) return;
 if (isAdminOnly && !isAdmin) {
 onNavigate('/account');
 } else if (!isAdminOnly && isAdmin) {
 onNavigate('/admin');
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user, isAdminOnly, isAdmin]);

 // Auto-open the login modal for visitors landing directly on a protected page.
 useEffect(() => {
 if (!user) {
 requestLogin();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 if (!user) {
 return (
 <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
 <div className="w-full max-w-md text-center space-y-6">
 <div className="w-20 h-20 rounded-3xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center mx-auto border border-[#6CC6C9]/30">
 <Lock className="w-9 h-9" />
 </div>

 <div className="space-y-2">
 <h2 className="text-2xl font-extrabold text-[#1A2E30] font-serif">
 {isAdminOnly ? t('لوحة تحكم المدير', 'Admin Dashboard') : t('حسابي', 'My Account')}
 </h2>
 <p className="text-sm text-[#6B8C8E] max-w-sm mx-auto leading-relaxed">{message}</p>
 </div>

 <div className="space-y-3">
 <button
 onClick={requestLogin}
 className="w-full flex items-center justify-center gap-2 bg-[#0E5257] hover:bg-[#6CC6C9] text-white py-3.5 rounded-2xl text-sm font-bold transition shadow-lg cursor-pointer"
 >
 <LogIn className="w-4 h-4" />
 {t('تسجيل الدخول / إنشاء حساب', 'Login / Create Account')}
 </button>

 <button
 onClick={() => onNavigate('/')}
 className="w-full flex items-center justify-center gap-2 bg-[#F0FAFA] hover:bg-[#E8F2F2] text-[#4A6869] py-3 rounded-2xl text-xs font-bold border border-[#E8F2F2] transition cursor-pointer"
 >
 <Store className="w-4 h-4" />
 {t('العودة إلى المتجر', 'Back to Store')}
 </button>
 </div>
 </div>
 </div>
 );
 }

 if (isAdminOnly && !isAdmin) {
 return (
 <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
 <div className="w-full max-w-md text-center space-y-6">
 <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
 <ShieldAlert className="w-9 h-9" />
 </div>
 <div className="space-y-2">
 <h2 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('منطقة خاصة بالمدير', 'Admin Only Area')}</h2>
 <p className="text-sm text-[#6B8C8E] max-w-sm mx-auto leading-relaxed">
 {t('عذراً، هذه الصفحة مخصصة لمديري المتجر فقط. سيتم تحويلك إلى حسابك.', 'Sorry, this page is restricted to store admins. You will be redirected to your account.')}
 </p>
 </div>
 <button
 onClick={() => onNavigate('/account')}
 className="w-full bg-[#0E5257] hover:bg-[#6CC6C9] text-white py-3.5 rounded-2xl text-sm font-bold transition shadow-lg cursor-pointer"
 >
 {t('الذهاب إلى حسابي', 'Go to My Account')}
 </button>
 </div>
 </div>
 );
 }

 return <>{children}</>;
};

export default LoginGate;
