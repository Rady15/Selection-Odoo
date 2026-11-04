import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usePolling } from '../../hooks/usePolling';
import {
 LayoutDashboard,
 Package,
 ShoppingBag,
 Tag,
 Layers,
 BellRing,
 Building2,
 Globe,
 Users,
 Star,
 Mail,
 LogOut,
 LayoutGrid,
 Image,
 Megaphone,
 Settings,
 X,
  ShoppingCart,
  CreditCard,
  WalletCards,
  Truck,
  BrainCircuit,
 Bot,
 Store,
 Menu,
 User
} from 'lucide-react';

interface AdminLayoutProps {
 currentTab: string;
 onTabChange: (tab: string) => void;
 onExitAdmin: () => void;
 children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
 currentTab,
 onTabChange,
 onExitAdmin,
 children
}) => {
 const { language, toggleLanguage, t } = useLanguage();
 const { logout } = useAuth();

 const [newOrderCount, setNewOrderCount] = useState(0);
 const [newOrders, setNewOrders] = useState<any[]>([]);
 const [notification, setNotification] = useState<{ visible: boolean; count: number }>({ visible: false, count: 0 });
 const [mobileNavOpen, setMobileNavOpen] = useState(false);

 const POLL_INTERVAL = 3000;

  // Seed the "last checked" timestamp on first visit so we don't notify the
  // admin about every historical order.
  useEffect(() => {
    try {
      if (!localStorage.getItem('admin_orders_last_checked')) {
        localStorage.setItem('admin_orders_last_checked', new Date().toISOString());
      }
    } catch {
      /* storage unavailable — notifications fall back to session-only state */
    }
  }, []);

  const checkNewOrders = useCallback(async () => {
    let lastChecked = new Date().toISOString();
    try {
      lastChecked = localStorage.getItem('admin_orders_last_checked') || lastChecked;
    } catch {
      /* storage unavailable */
    }
    try {
      const res = await fetch(`/api/admin/orders/new?since=${encodeURIComponent(lastChecked)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.count > 0) {
        setNewOrderCount(data.count);
        setNewOrders(data.orders || []);
        setNotification({ visible: true, count: data.count });
      }
    } catch (err) {
      console.error('Failed to check new orders:', err);
    }
  }, []);

 usePolling(checkNewOrders, POLL_INTERVAL);

  const dismissNotification = () => {
  setNotification({ visible: false, count: 0 });
  try {
    localStorage.setItem('admin_orders_last_checked', new Date().toISOString());
  } catch {
    /* storage unavailable */
  }
  };

 const handleOrdersClick = () => {
 dismissNotification();
 setNewOrderCount(0);
 onTabChange('orders');
 };

 const closeMobileNav = () => setMobileNavOpen(false);

 const handleNavClick = (id: string) => {
 if (id === 'orders') handleOrdersClick();
 else onTabChange(id);
 closeMobileNav();
 };

 const navItems = [
 { id: 'overview', label_ar: 'نظرة عامة', label_en: 'Overview', icon: LayoutDashboard },
 { id: 'products', label_ar: 'المنتجات', label_en: 'Products', icon: Package },
 { id: 'orders', label_ar: 'الطلبات', label_en: 'Orders', icon: ShoppingBag, badge: newOrderCount },
 { id: 'customers', label_ar: 'العملاء', label_en: 'Customers', icon: Users },
 { id: 'reviews', label_ar: 'المراجعات', label_en: 'Reviews', icon: Star },
 { id: 'coupons', label_ar: 'الكوبونات', label_en: 'Coupons', icon: Tag },
 { id: 'homepage', label_ar: 'الصفحة الرئيسية', label_en: 'Homepage', icon: Layers },
 { id: 'contact', label_ar: 'رسائل التواصل', label_en: 'Contact Messages', icon: Mail },
 { id: 'stock-alerts', label_ar: 'تنبيهات المخزون', label_en: 'Stock Alerts', icon: BellRing },
 { id: 'wholesale', label_ar: 'الجملة B2B', label_en: 'Wholesale B2B', icon: Building2 },
 { id: 'categories', label_ar: 'الفئات', label_en: 'Categories', icon: LayoutGrid },
 { id: 'banners', label_ar: 'البنرات الإعلانية', label_en: 'Banners & Ads', icon: Image },
  { id: 'payments', label_ar: 'المدفوعات', label_en: 'Payments', icon: CreditCard },
  { id: 'payment-gateways', label_ar: 'بوابات الدفع', label_en: 'Payment Gateways', icon: WalletCards },
  { id: 'shipping', label_ar: 'شركات الشحن', label_en: 'Shipping', icon: Truck },
 { id: 'announcement', label_ar: 'شريط الإعلانات', label_en: 'Announcement Bar', icon: Megaphone },
 { id: 'quiz', label_ar: 'اختبار القهوة', label_en: 'Coffee Quiz', icon: BrainCircuit },
 { id: 'newsletter', label_ar: 'النشرة البريدية', label_en: 'Newsletter', icon: Mail },
 { id: 'profile', label_ar: 'الملف الشخصي', label_en: 'My Profile', icon: User },
 { id: 'settings', label_ar: 'إعدادات المتجر', label_en: 'Store Settings', icon: Settings }
 ];

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen flex flex-col md:flex-row font-sans overflow-x-hidden">

 {/* Mobile Top Bar */}
 <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-[#FFFFFF] border-b border-[#E8F2F2]">
 <img src="/coloredlogo.png" alt="Selection Store" className="h-7 w-auto" />
 <div className="flex items-center gap-2">
 <button
 onClick={toggleLanguage}
 className="bg-[#F0FAFA] hover:bg-[#E8F2F2] text-[#4A6869] px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[#E8F2F2] transition flex items-center gap-1.5 cursor-pointer"
 >
 <Globe className="w-3 h-3 text-[#6CC6C9]" />
 <span>{language === 'ar' ? 'EN' : 'AR'}</span>
 </button>
 <button
 onClick={() => setMobileNavOpen(true)}
 className="bg-[#F0FAFA] hover:bg-[#E8F2F2] text-[#4A6869] p-2 rounded-lg border border-[#E8F2F2] transition cursor-pointer"
 aria-label={t('القائمة', 'Menu')}
 >
 <Menu className="w-5 h-5" />
 </button>
 </div>
 </header>

 {/* Mobile Drawer Backdrop */}
 {mobileNavOpen && (
 <div
 className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
 onClick={closeMobileNav}
 />
 )}

 {/* Sidebar */}
 <aside className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-50 w-72 max-w-[85vw] bg-[#FFFFFF] border-[#E8F2F2] flex flex-col justify-between flex-shrink-0 transition-transform duration-300 ease-in-out ${language === 'ar' ? 'border-l' : 'border-r'} border-b md:border-b-0 ${mobileNavOpen ? 'translate-x-0' : language === 'ar' ? 'translate-x-full' : '-translate-x-full'} md:sticky md:top-0 md:h-screen md:translate-x-0 md:w-60`}>

 <div className="flex flex-col min-h-0 flex-1">
 <div className="p-4 border-b border-[#E8F2F2] flex items-center justify-between">
 <img src="/coloredlogo.png" alt="Selection Store" className="h-8 w-auto" />
 <button
 onClick={closeMobileNav}
 className="md:hidden p-1.5 rounded-lg text-[#6B8C8E] hover:text-[#6CC6C9] hover:bg-[#F0FAFA] transition cursor-pointer"
 aria-label={t('إغلاق القائمة', 'Close menu')}
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <nav className="p-3 space-y-0.5 overflow-y-auto min-h-0 flex-1">
 {navItems.map(item => {
 const Icon = item.icon;
 const active = currentTab === item.id;
 const showBadge = item.badge && item.badge > 0;
 return (
 <button
 key={item.id}
 onClick={() => handleNavClick(item.id)}
 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
 active
 ? 'bg-[#0E5257] text-white shadow-lg shadow-[#0E5257]/30'
 : 'text-[#6B8C8E] hover:text-[#6CC6C9] hover:bg-[#F0FAFA]'
 }`}
 >
 <Icon className="w-3.5 h-3.5 flex-shrink-0" />
 <span className="truncate flex-1 text-left">{language === 'ar' ? item.label_ar : item.label_en}</span>
 {showBadge && (
 <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
 {item.badge! > 99 ? '99+' : item.badge}
 </span>
 )}
 </button>
 );
 })}
 </nav>
 </div>

 <div className="p-3 border-t border-[#E8F2F2] space-y-1.5">
 <button
 onClick={toggleLanguage}
 className="w-full bg-[#F0FAFA] hover:bg-[#E8F2F2] text-[#4A6869] py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[#E8F2F2]"
 >
 <Globe className="w-3 h-3 text-[#6CC6C9]" />
 <span>{language === 'ar' ? 'EN' : 'AR'}</span>
 </button>

 <button
 onClick={() => window.open('/', '_blank')}
 className="w-full bg-[#F0FAFA] hover:bg-[#E8F2F2] text-[#4A6869] py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[#E8F2F2]"
 >
 <Store className="w-3 h-3 text-[#6CC6C9]" />
 <span>{t('المتجر', 'Store')}</span>
 </button>

 <button
 onClick={() => {
 logout();
 onExitAdmin();
 }}
 className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-red-500/20"
 >
 <LogOut className="w-3 h-3" />
 <span>{t('تسجيل الخروج', 'Logout')}</span>
 </button>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 relative">
 {/* New Orders Notification Banner */}
 {notification.visible && notification.count > 0 && (
 <div className={`fixed top-4 ${language === 'ar' ? 'left-4 right-auto md:left-8' : 'right-4 left-auto md:right-8'} z-50 animate-slide-down`}>
 <div className="bg-emerald-600/95 backdrop-blur-md border border-emerald-400/40 rounded-2xl p-4 shadow-2xl shadow-emerald-900/40 max-w-sm">
 <div className="flex items-start gap-3">
 <div className="p-2 rounded-full bg-emerald-500/30 text-emerald-200 flex-shrink-0">
 <ShoppingCart className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-[#1A2E30]">
 {language === 'ar'
 ? `طلبات جديدة! (${notification.count})`
 : `New Order${notification.count > 1 ? 's' : ''}! (${notification.count})`}
 </p>
 <p className="text-xs text-emerald-200/80 mt-0.5">
 {language === 'ar' ? 'تم استلام طلبات جديدة' : 'New orders have been received'}
 </p>
 <div className="flex gap-2 mt-2">
 <button
 onClick={handleOrdersClick}
 className="text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer"
 >
 {language === 'ar' ? 'عرض الطلبات' : 'View Orders'}
 </button>
 <button
 onClick={dismissNotification}
 className="text-xs font-bold text-emerald-200/70 hover:text-[#6CC6C9] transition cursor-pointer"
 >
 {language === 'ar' ? 'تجاهل' : 'Dismiss'}
 </button>
 </div>
 </div>
 <button
 onClick={dismissNotification}
 className="p-1 rounded-full hover:bg-emerald-500/20 text-emerald-200/70 hover:text-[#6CC6C9] transition flex-shrink-0 cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 )}

 {children}
 </main>
 </div>
 );
};

export default AdminLayout;
