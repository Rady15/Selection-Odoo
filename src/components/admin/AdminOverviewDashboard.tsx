import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { usePolling } from '../../hooks/usePolling';
import {
 DollarSign,
 ShoppingBag,
 Users,
 AlertTriangle,
 TrendingUp,
 Award,
 Coffee,
 Package,
 RefreshCw,
 ShoppingCart
} from 'lucide-react';

export const AdminOverviewDashboard: React.FC = () => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();

 const [stats, setStats] = useState<any>(null);
 const [newOrdersToday, setNewOrdersToday] = useState(0);

 const fetchStats = useCallback(async () => {
 try {
 const res = await fetch('/api/admin/stats');
 if (!res.ok) { console.error('API error:', res.status); return; }
 const data = await res.json();
 setStats(data);
 } catch (err) {
 console.error('Failed to load dashboard stats:', err);
 }
 }, []);

 const checkNewOrders = useCallback(async () => {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 try {
 const res = await fetch(`/api/admin/orders/new?since=${encodeURIComponent(today.toISOString())}`);
 if (!res.ok) return;
 const data = await res.json();
 setNewOrdersToday(data.count);
 } catch (err) {
 console.error('Failed to check new orders:', err);
 }
 }, []);

 usePolling(() => { fetchStats(); checkNewOrders(); }, 6000);

 if (!stats) {
 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2E30] font-serif">
 {t('لوحة التحليلات وأداء المحمصة', 'Roastery Performance & Analytics')}
 </h1>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse">
 <div className="h-4 bg-[#E8F2F2] rounded w-24 mb-3"></div>
 <div className="h-8 bg-[#E8F2F2] rounded w-32 mb-2"></div>
 <div className="h-3 bg-[#E8F2F2] rounded w-20"></div>
 </div>
 ))}
 </div>
 </div>
 );
 }

 const totalRevenue = stats?.totalRevenue || 0;
 const totalOrders = stats?.totalOrders || 0;
 const totalCustomers = stats?.totalCustomers || 0;
 const lowStockCount = stats?.lowStockCount || 0;
 const lowStockProducts = stats?.lowStockProducts || [];
 const recentOrders = stats?.recentOrders || [];

 const ordersByStatus = recentOrders.reduce((acc: Record<string, number>, o: any) => {
 acc[o.status] = (acc[o.status] || 0) + 1;
 return acc;
 }, {});

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2E30] font-serif">
 {t('لوحة التحليلات وأداء المحمصة', 'Roastery Performance & Analytics')}
 </h1>
 <p className="text-xs text-[#6B8C8E] mt-1">
 {t('متابعة مبيعات القهوة المختصة، مخزون المحاصيل، وأداء المبيعات اليومي', 'Track daily specialty coffee sales, micro-lot inventory & customer volume')}
 </p>
 </div>
 <button
 onClick={fetchStats}
 className="p-2 rounded-xl bg-[#F0FAFA] border border-[#E8F2F2] text-[#4A6869] hover:text-[#6CC6C9] transition cursor-pointer"
 title={t('تحديث', 'Refresh')}
 >
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>

  {/* KPI Cards Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
  <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2">
  <div className="flex items-center justify-between">
  <span className="text-xs text-[#6B8C8E] font-semibold">{t('إجمالي المبيعات', 'Total Revenue')}</span>
  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600">
  <DollarSign className="w-5 h-5" />
  </div>
  </div>
  <span className="font-extrabold text-2xl text-[#1A2E30] block">{formatPrice(totalRevenue)}</span>
  <span className="text-[10px] text-[#6B8C8E] font-bold">
  {t('متوسط الطلب:', 'Avg order:')} {formatPrice(stats?.avgOrderValue || 0)}
  </span>
  </div>

  <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2">
  <div className="flex items-center justify-between">
  <span className="text-xs text-[#6B8C8E] font-semibold">{t('إجمالي الطلبات', 'Total Orders')}</span>
  <div className="p-2.5 rounded-xl bg-[#0E5257]/10 text-[#0E5257]">
  <ShoppingBag className="w-5 h-5" />
  </div>
  </div>
  <span className="font-extrabold text-2xl text-[#1A2E30] block">{totalOrders} {t('طلب', 'orders')}</span>
  <span className="text-[10px] flex items-center gap-1.5">
  {newOrdersToday > 0 ? (
  <span className="flex items-center gap-1 text-emerald-600 font-bold">
  <ShoppingCart className="w-3 h-3" />
  {newOrdersToday} {t('جديد اليوم', 'new today')}
  </span>
  ) : (
  <span className="text-[#6B8C8E] font-bold">
  {t('لا توجد طلبات جديدة', 'no new orders')}
  </span>
  )}
  </span>
  </div>

  <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2">
  <div className="flex items-center justify-between">
  <span className="text-xs text-[#6B8C8E] font-semibold">{t('العملاء المسجلون', 'Total Customers')}</span>
  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600">
  <Users className="w-5 h-5" />
  </div>
  </div>
  <span className="font-extrabold text-2xl text-[#1A2E30] block">{totalCustomers}</span>
  <span className="text-[10px] text-[#6B8C8E]">
  {t('حساب مسجل في النظام', 'registered accounts')}
  </span>
  </div>

  <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2">
  <div className="flex items-center justify-between">
  <span className="text-xs text-[#6B8C8E] font-semibold">{t('تنبيهات المخزون', 'Low Stock Alert')}</span>
  <div className={`p-2.5 rounded-xl ${lowStockCount > 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-600'}`}>
  <AlertTriangle className="w-5 h-5" />
  </div>
  </div>
  <span className={`font-extrabold text-2xl block ${lowStockCount > 0 ? 'text-red-500' : 'text-[#1A2E30]'}`}>
  {lowStockCount} {t('منتج', 'items')}
  </span>
  <span className={`text-[10px] font-bold ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
  {lowStockCount > 0 ? t('يلزم تجديد المخزون', 'Restock needed') : t('المخزون كافٍ', 'Stock is sufficient')}
  </span>
  </div>
  </div>

 {/* Details Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Recent Orders */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] flex items-center gap-2">
 <ShoppingBag className="w-5 h-5 text-[#6CC6C9]" />
 <span>{t('آخر الطلبات', 'Recent Orders')}</span>
 </h3>

 <div className="space-y-2 text-xs">
 {recentOrders.length === 0 ? (
 <p className="text-[#6B8C8E] text-center py-4">{t('لا توجد طلبات بعد', 'No orders yet')}</p>
 ) : recentOrders.map((order: any) => (
 <div key={order.id} className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2] flex justify-between items-center">
 <div>
 <span className="font-bold text-[#1A2E30]">{order.order_number}</span>
 <span className="text-[#6B8C8E] mx-2">|</span>
 <span className="text-[#4A6869]">{order.customer_name}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#6CC6C9]">{formatPrice(order.total_amount)}</span>
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
 order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
 order.status === 'roasting' ? 'bg-amber-500/20 text-amber-400' :
 order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
 'bg-[#0E5257]/20 text-[#6CC6C9]'
 }`}>
 {language === 'ar' ? {
 pending: 'معلق', paid: 'تم الإنشاء', roasting: 'قيد التحميص',
 shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي'
 }[order.status] || order.status : order.status}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Low Stock Products */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-red-400" />
 <span>{t('منتجات مخزونها منخفض', 'Low Stock Products')}</span>
 </h3>

 <div className="space-y-2 text-xs">
 {lowStockProducts.length === 0 ? (
 <p className="text-[#6B8C8E] text-center py-4">{t('جميع المنتجات متوفرة', 'All products are in stock')}</p>
 ) : lowStockProducts.map((prod: any) => (
 <div key={prod.id} className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2] flex justify-between items-center">
 <div>
 <span className="font-bold text-[#1A2E30]">{language === 'ar' ? prod.name_ar : prod.name_en}</span>
 <span className="text-[#6B8C8E] ml-2">({prod.sku})</span>
 </div>
 <div className="flex items-center gap-2">
 <span className={`font-bold ${prod.stock <= 5 ? 'text-red-400' : 'text-amber-400'}`}>
 {prod.stock} {t('قطعة', 'pcs')}
 </span>
 {prod.stock <= 5 && (
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 animate-pulse">
 {t('حرج', 'Critical')}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
};

export default AdminOverviewDashboard;
