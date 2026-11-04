import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency, currencies } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { Category, Currency } from '../../types';
import {
 X,
 Coffee,
 ChevronLeft,
 ChevronRight,
 Globe,
 User,
 Heart,
 PhoneCall,
 ShoppingBag,
 HelpCircle,
 FileText
} from 'lucide-react';

interface MobileMenuDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 onNavigate: (path: string) => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
 const { language, setLanguage, t } = useLanguage();
 const { currency, setCurrency } = useCurrency();
 const { user, isAdmin, logout } = useAuth();
 const [categories, setCategories] = useState<Category[]>([]);
 const [animState, setAnimState] = useState<'enter' | 'idle' | 'exit' | null>(null);

 useEffect(() => {
 if (isOpen) {
 setAnimState('enter');
 requestAnimationFrame(() => {
 requestAnimationFrame(() => setAnimState('idle'));
 });
 fetch('/api/categories')
 .then(res => res.json())
 .then(data => setCategories(data))
 .catch(err => console.error(err));
 } else if (animState === 'idle') {
 setAnimState('exit');
 setTimeout(() => setAnimState(null), 300);
 }
 }, [isOpen]);

 const handleClose = () => {
 setAnimState('exit');
 setTimeout(() => {
 onClose();
 setAnimState(null);
 }, 300);
 };

 if (animState === null) return null;

 return (
 <div className="fixed inset-0 z-50 flex">
 {/* Backdrop */}
 <div
 className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300 ${animState === 'exit' ? 'opacity-0' : 'opacity-100'
 }`}
 onClick={handleClose}
 />

 {/* Drawer */}
 <div
 className={`relative w-full max-w-xs bg-[#FFFFFF] text-[#1A2E30] h-full shadow-2xl flex flex-col z-50 border-r border-[#E8F2F2] overflow-y-auto transition-all duration-300 ease-out ${animState === 'idle' ? 'translate-x-0' : '-translate-x-full'
 }`}
 >

 {/* Header */}
 <div className="p-4 border-b border-[#E8F2F2] flex items-center justify-between">
 <img src="/coloredlogo.png" alt="Selection Store" className="h-8 w-auto" />
 <button
 onClick={handleClose}
 className="p-1.5 rounded-lg text-[#6B8C8E] hover:text-[#6CC6C9] hover:bg-[#F0FAFA] transition cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* User Account Bar */}
 <div className="p-4 bg-[#F0FAFA] border-b border-[#E8F2F2]">
 {user ? (
 <div className="flex items-center justify-between">
 <div>
 <p className="text-xs text-[#6B8C8E]">{t('مرحباً بعودتك', 'Welcome back')}</p>
 <p className="font-bold text-sm text-[#6CC6C9]">{user.name}</p>
 </div>
 <button
 onClick={() => {
 onNavigate(isAdmin ? '/admin' : '/account');
 onClose();
 }}
 className="text-xs bg-[#0E5257] hover:bg-[#2B7D82] text-white px-3 py-1.5 rounded-lg cursor-pointer"
 >
 {isAdmin ? 'لوحة التحكم' : 'حسابي'}
 </button>
 </div>
 ) : (
 <button
 onClick={() => {
 onNavigate('/account');
 onClose();
 }}
 className="w-full flex items-center justify-center gap-2 bg-[#0E5257] hover:bg-[#2B7D82] text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
 >
 <User className="w-4 h-4" />
 <span>{t('تسجيل الدخول / حساب جديد', 'Sign In / Register')}</span>
 </button>
 )}
 </div>

 {/* Navigation Items */}
 <div className="p-4 space-y-4 flex-1">
 <p className="text-[11px] uppercase font-bold text-[#6B8C8E] tracking-wider">
 {t('أقسام القهوة والمعدات', 'Coffee & Gear Categories')}
 </p>

 <div className="space-y-1">
 <button
 onClick={() => {
 onNavigate('/');
 onClose();
 }}
 className="w-full text-start py-2.5 px-3 rounded-lg hover:bg-[#F0FAFA] text-sm font-medium transition cursor-pointer text-[#1A2E30]"
 >
 {t('الرئيسية', 'Home')}
 </button>

 {categories.map(cat => (
 <button
 key={cat.id}
 onClick={() => {
 onNavigate(`/products?category=${cat.slug}`);
 onClose();
 }}
 className="w-full text-start py-2.5 px-3 rounded-lg hover:bg-[#F0FAFA] text-sm font-medium transition cursor-pointer text-[#4A6869] hover:text-[#1A2E30] flex items-center justify-between"
 >
 <span>{language === 'ar' ? cat.name_ar : cat.name_en}</span>
 {language === 'ar' ? <ChevronLeft className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
 </button>
 ))}
 </div>

 <div className="border-t border-[#E8F2F2] pt-4 space-y-2">
 <button
 onClick={() => {
 onNavigate('/brewing-guide');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6CC6C9] hover:text-amber-400 cursor-pointer font-bold"
 >
 {t('دليل تحضير القهوة والنسب', 'Brewing & Ratio Guide')}
 </button>
 <button
 onClick={() => {
 onNavigate('/subscriptions');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('اشتراكات القهوة الشهرية', 'Coffee Subscriptions')}
 </button>
 <button
 onClick={() => {
 onNavigate('/track-order');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('تتبع الطلب والشحنة', 'Track Your Order')}
 </button>
 <button
 onClick={() => {
 onNavigate('/locations');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('فرع المحمصة بفرع حطين', 'Our Store & Espresso Bar')}
 </button>
 <button
 onClick={() => {
 onNavigate('/faq');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('الأسئلة الشائعة والمساعدة', 'FAQs & Help')}
 </button>
 <button
 onClick={() => {
 onNavigate('/about');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('قصتنا وحرفية التحميص', 'Our Story & Roasting')}
 </button>
 <button
 onClick={() => {
 onNavigate('/wholesale');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('طلب كميات ومبيعات الجملة', 'Wholesale & B2B')}
 </button>
 <button
 onClick={() => {
 onNavigate('/contact');
 onClose();
 }}
 className="w-full text-start py-2 px-3 rounded-lg text-xs text-[#6B8C8E] hover:text-[#1A2E30] cursor-pointer"
 >
 {t('تواصل معنا والدعم الفني', 'Contact Us & Support')}
 </button>
 </div>
 </div>

 {/* Language & Currency Controls Footer */}
 <div className="p-4 border-t border-[#E8F2F2] bg-[#F0FAFA] space-y-3">
 <div className="flex items-center justify-between text-xs">
 <span className="text-[#6B8C8E]">{t('اللغة', 'Language')}:</span>
 <button
 onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
 className="font-bold text-[#6CC6C9] hover:underline cursor-pointer"
 >
 {language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}
 </button>
 </div>

 <div className="flex items-center justify-between text-xs">
 <span className="text-[#6B8C8E]">{t('العملة', 'Currency')}:</span>
 <select
 value={currency}
 onChange={(e) => setCurrency(e.target.value as Currency)}
 className="bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded px-2 py-1 text-xs cursor-pointer focus:outline-none"
 >
 {Object.keys(currencies).map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 </div>

 </div>
 </div>
 );
};

export default MobileMenuDrawer;
