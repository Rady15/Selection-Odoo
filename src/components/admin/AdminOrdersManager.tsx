import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { usePolling } from '../../hooks/usePolling';
import { Order, OrderStatus } from '../../types';
import { printTaxInvoice } from '../../utils/printTaxInvoice';
import { ShoppingBag, Eye, X, Trash2, Printer, Loader2 } from 'lucide-react';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

const statusOptions: { value: OrderStatus; label_ar: string; label_en: string }[] = [
 { value: 'pending', label_ar: 'معلق', label_en: 'Pending' },
 { value: 'paid', label_ar: 'تم الإنشاء', label_en: 'Created' },
 { value: 'roasting', label_ar: 'قيد التحميص', label_en: 'Roasting' },
 { value: 'shipped', label_ar: 'تم الشحن', label_en: 'Shipped' },
 { value: 'delivered', label_ar: 'تم التوصيل', label_en: 'Delivered' },
 { value: 'cancelled', label_ar: 'ملغي', label_en: 'Cancelled' }
];

const PAYMENT_LABELS: Record<string, [string, string]> = {
 paid: ['تم الدفع', 'Paid'],
 pending: ['قيد الدفع', 'Pending'],
 failed: ['فشل الدفع', 'Failed']
};

export const AdminOrdersManager: React.FC = () => {
 const { language, t } = useLanguage();
 const { formatPrice, formatPriceString } = useCurrency();
 const [orders, setOrders] = useState<Order[]>([]);
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

 // A paid order is always shown as "تم الإنشاء" (Created) even if the fulfillment
 // status was never bumped from pending.
 const getEffectiveStatus = (o: Order): OrderStatus =>
 o.payment_status === 'paid' && o.status === 'pending' ? 'paid' : o.status;

 const loadOrders = () => {
 fetch('/api/admin/orders')
 .then(async res => {
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 return res.json();
 })
 .then(data => setOrders(prev => {
 if (prev.length === data.length && JSON.stringify(prev) === JSON.stringify(data)) return prev;
 return data;
 }))
 .catch(err => console.error(err));
 };

 // Poll frequently so new orders and status changes show up in real time.
 usePolling(loadOrders, 3000);

 const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
 setUpdatingId(orderId);
 try {
 const res = await fetch(`/api/admin/orders/${orderId}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 const updated = await res.json();
 if (updated) {
 setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updated } : o)));
 }
 } catch (err) {
 console.error('Failed to update order status:', err);
 alert(t('فشل تحديث حالة الطلب', 'Failed to update order status'));
 } finally {
 setUpdatingId(null);
 }
 };

 const handleDeleteOrder = async (ord: Order) => {
 if (!window.confirm(t('هل أنت متأكد من حذف هذا الطلب؟', 'Are you sure you want to delete this order?'))) return;
 setDeletingId(ord.id);
 try {
 const res = await fetch(`/api/admin/orders/${ord.id}`, { method: 'DELETE' });
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 setOrders(prev => prev.filter(o => o.id !== ord.id));
 if (selectedOrder?.id === ord.id) setSelectedOrder(null);
 } catch (err) {
 console.error('Failed to delete order:', err);
 alert(t('فشل حذف الطلب', 'Failed to delete order'));
 } finally {
 setDeletingId(null);
 }
 };

 const statusLabel = (s: string) => {
 const opt = statusOptions.find(o => o.value === s);
 if (!opt) return s;
 return language === 'ar' ? opt.label_ar : opt.label_en;
 };

 const printReceipt = (ord: Order) => {
 printTaxInvoice(ord, { language, formatPrice: formatPriceString });
 };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => getEffectiveStatus(o) === statusFilter);
  const filtered = filteredOrders.filter(o =>
  o.order_number.toLowerCase().includes(search.toLowerCase()) ||
  o.customer_name.includes(search) ||
  o.phone.includes(search)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(o => o.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size < 1) return;
    setBulkDeleting(true);
    setBulkError('');
    try {
      await bulkDeleteRequest('orders', [...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      if (selectedOrder && selectedIds.has(selectedOrder.id)) setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
    } finally {
      setBulkDeleting(false);
    }
  };

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'delivered': return 'bg-emerald-500/20 text-emerald-400';
 case 'shipped': return 'bg-blue-500/20 text-blue-400';
 case 'roasting': return 'bg-amber-500/20 text-amber-400';
 case 'cancelled': return 'bg-red-500/20 text-red-400';
 case 'paid': return 'bg-purple-500/20 text-purple-400';
 default: return 'bg-[#0E5257]/20 text-[#6CC6C9]';
 }
 };

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">
 {t('إدارة الطلبات والشحنات', 'Orders & Fulfillment')}
 </h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t('متابعة حالة التجهيز والتحميص والشحن وتعديل حالة الطلب', 'Track preparation, roasting, shipping and update order status')}
 </p>
 </div>

 <div className="relative max-w-sm">
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder={t('بحث برقم الطلب أو اسم العميل...', 'Search by order number or customer...')}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div className="flex gap-2 flex-wrap">
 {['all', 'pending', 'paid', 'roasting', 'shipped', 'delivered', 'cancelled'].map(s => (
 <button
 key={s}
 onClick={() => setStatusFilter(s)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
 statusFilter === s
 ? 'bg-[#6CC6C9] text-[#FFFFFF]'
 : 'bg-[#F0FAFA] text-[#6B8C8E] border border-[#E8F2F2] hover:border-[#6CC6C9]'
 }`}
 >
 {s === 'all' ? t('الكل', 'All') : statusOptions.find(opt => opt.value === s) ? (language === 'ar' ? statusOptions.find(opt => opt.value === s)!.label_ar : statusOptions.find(opt => opt.value === s)!.label_en) : s}
 </button>
 ))}
 </div>

  <BulkDeleteBar
  selectedCount={selectedIds.size}
  onClear={() => setSelectedIds(new Set())}
  onDelete={() => setShowBulkConfirm(true)}
  deleting={bulkDeleting}
  />
  {bulkError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{bulkError}</div>}

  {showBulkConfirm && (
  <BulkDeleteConfirm
  count={selectedIds.size}
  entityLabel={t('طلب', 'orders')}
  onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
  onConfirm={handleBulkDelete}
  confirming={bulkDeleting}
  />
  )}

  <div className="bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl overflow-hidden shadow-2xl">
  <div className="overflow-x-auto">
  <table className="w-full text-xs text-start">
  <thead className="bg-[#FFFFFF] text-[#6B8C8E] uppercase font-bold border-b border-[#E8F2F2]">
  <tr>
  <th className="p-4 w-10">
  <input
  type="checkbox"
  checked={filtered.length > 0 && selectedIds.size === filtered.length}
  onChange={toggleSelectAll}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  title={t('تحديد الكل', 'Select all')}
  />
  </th>
  <th className="p-4 text-start">{t('رقم الطلب والعميل', 'Order & Customer')}</th>
 <th className="p-4 text-start">{t('المدينة والشحن', 'City & Carrier')}</th>
 <th className="p-4 text-start">{t('المبلغ', 'Total')}</th>
 <th className="p-4 text-start">{t('الدفع', 'Payment')}</th>
 <th className="p-4 text-start">{t('الحالة', 'Status')}</th>
 <th className="p-4 text-end">{t('تفاصيل', 'Details')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E8F2F2]/60 text-[#4A6869]">
  {filtered.length === 0 ? (
  <tr><td colSpan={7} className="p-8 text-center text-[#6B8C8E]">{t('لا توجد طلبات', 'No orders found')}</td></tr>
  ) : filtered.map(ord => (
  <tr key={ord.id} className={`hover:bg-[#FFFFFF]/50 transition ${selectedIds.has(ord.id) ? 'bg-[#0E5257]/5' : ''}`}>
  <td className="p-4">
  <input
  type="checkbox"
  checked={selectedIds.has(ord.id)}
  onChange={() => toggleSelect(ord.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  />
  </td>
  <td className="p-4">
 <span className="font-extrabold text-[#1A2E30] block text-sm">{ord.order_number}</span>
 <span className="text-[10px] text-[#6B8C8E]">{ord.customer_name} · {ord.phone}</span>
 </td>
 <td className="p-4">
 <span className="font-bold text-[#1A2E30] block">{ord.shipping_address?.city || '—'}</span>
 <span className="text-[10px] text-[#6CC6C9]">{ord.shipping_method}</span>
 </td>
 <td className="p-4 font-extrabold text-[#6CC6C9]">
 {formatPrice(ord.total_amount)}
 </td>
 <td className="p-4 uppercase font-bold text-xs">
 {ord.payment_method}
 </td>
 <td className="p-4">
 <select
 value={getEffectiveStatus(ord)}
 disabled={updatingId === ord.id}
 onChange={e => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
 className={`bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#6CC6C9] cursor-pointer disabled:opacity-60 ${getStatusColor(getEffectiveStatus(ord))}`}
 >
 {statusOptions.map(s => (
 <option key={s.value} value={s.value}>{language === 'ar' ? s.label_ar : s.label_en}</option>
 ))}
 </select>
 </td>
 <td className="p-4 text-end">
 <div className="flex items-center justify-end gap-1.5">
 <button
 onClick={() => setSelectedOrder(ord)}
 className="p-1.5 rounded-lg bg-[#E8F2F2] text-[#1A2E30] hover:bg-[#0E5257] transition cursor-pointer"
 title={t('تفاصيل الطلب', 'Order details')}
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleDeleteOrder(ord)}
 disabled={deletingId === ord.id}
 className="p-1.5 rounded-lg bg-[#E8F2F2] text-red-400 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50"
 title={t('حذف الطلب', 'Delete order')}
 >
 {deletingId === ord.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Order Detail Modal */}
 {selectedOrder && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
 <div className="relative w-full max-w-lg bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-3xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
 <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-[#6B8C8E] hover:text-[#6CC6C9] cursor-pointer">
 <X className="w-5 h-5" />
 </button>

 <div className="flex items-center justify-between mb-4">
 <h3 className="font-extrabold text-lg text-[#1A2E30]">{selectedOrder.order_number}</h3>
 <div className="flex items-center gap-2">
 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
 getEffectiveStatus(selectedOrder) === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
 getEffectiveStatus(selectedOrder) === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
 getEffectiveStatus(selectedOrder) === 'roasting' ? 'bg-amber-500/20 text-amber-400' :
 getEffectiveStatus(selectedOrder) === 'cancelled' ? 'bg-red-500/20 text-red-400' :
 getEffectiveStatus(selectedOrder) === 'paid' ? 'bg-purple-500/20 text-purple-400' :
 'bg-[#0E5257]/20 text-[#6CC6C9]'
 }`}>
 {statusLabel(getEffectiveStatus(selectedOrder))}
 </span>
 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
 selectedOrder.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
 selectedOrder.payment_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
 'bg-red-500/20 text-red-400'
 }`}>
 {language === 'ar' ? (PAYMENT_LABELS[selectedOrder.payment_status]?.[0] || selectedOrder.payment_status) : (PAYMENT_LABELS[selectedOrder.payment_status]?.[1] || selectedOrder.payment_status)}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 mb-4">
 <button
 onClick={() => printReceipt(selectedOrder)}
 className="flex items-center gap-1.5 bg-[#6CC6C9] text-[#FFFFFF] px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#7BD4D7] transition cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5" />
 {t('طباعة الإيصال', 'Print Receipt')}
 </button>
 <button
 onClick={() => handleDeleteOrder(selectedOrder)}
 disabled={deletingId === selectedOrder.id}
 className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50"
 >
 {deletingId === selectedOrder.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
 {t('حذف الطلب', 'Delete Order')}
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-[#6B8C8E] font-semibold">{t('العميل', 'Customer')}</span>
 <p className="text-white font-bold mt-1">{selectedOrder.customer_name} · {selectedOrder.phone}</p>
 <p className="text-[#4A6869]">{selectedOrder.email}</p>
 </div>

 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-[#6B8C8E] font-semibold">{t('عنوان الشحن', 'Shipping Address')}</span>
 {selectedOrder.shipping_address ? (
 <>
 <p className="text-white font-bold mt-1">{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.district}</p>
 <p className="text-[#4A6869]">{selectedOrder.shipping_address.street} {selectedOrder.shipping_address.building}</p>
 </>
 ) : (
 <p className="text-[#6B8C8E] mt-1">—</p>
 )}
 </div>

 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-[#6B8C8E] font-semibold">{t('المنتجات', 'Items')}</span>
 {selectedOrder.items.map((item: any, idx) => (
 <div key={idx} className="flex justify-between mt-2 text-[#4A6869]">
 <div>
 <span>{language === 'ar' ? (item.product_name_ar || item.name_ar) : (item.product_name_en || item.name_en)} × {item.quantity}</span>
 {item.weight && (
 <span className="text-[10px] text-[#6B8C8E] block">{item.weight}{item.grind ? ` • ${item.grind}` : ''}</span>
 )}
 </div>
 <span className="font-bold text-[#1A2E30]">{formatPrice(typeof item.total_price === 'number' ? item.total_price : item.price)}</span>
 </div>
 ))}
 </div>

 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-1">
 <div className="flex justify-between text-[#4A6869]">
 <span>{t('المجموع الفرعي', 'Subtotal')}</span>
 <span>{formatPrice(selectedOrder.subtotal)}</span>
 </div>
 {selectedOrder.discount_amount > 0 && (
 <div className="flex justify-between text-emerald-400">
 <span>{t('الخصم', 'Discount')} ({selectedOrder.coupon_code})</span>
 <span>-{formatPrice(selectedOrder.discount_amount)}</span>
 </div>
 )}
 {selectedOrder.loyalty_discount && selectedOrder.loyalty_discount > 0 && (
 <div className="flex justify-between text-[#6CC6C9]">
 <span>{t('خصم الولاء', 'Loyalty')}{selectedOrder.loyalty_points_used ? ` (${selectedOrder.loyalty_points_used} pts)` : ''}</span>
 <span>-{formatPrice(selectedOrder.loyalty_discount)}</span>
 </div>
 )}
 <div className="flex justify-between text-[#4A6869]">
 <span>{t('الشحن', 'Shipping')}</span>
 <span>{selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : t('مجاني', 'Free')}</span>
 </div>
 {selectedOrder.cod_surcharge && selectedOrder.cod_surcharge > 0 && (
 <div className="flex justify-between text-[#6CC6C9]">
 <span>{t('رسوم COD', 'COD Surcharge')}</span>
 <span>+{formatPrice(selectedOrder.cod_surcharge)}</span>
 </div>
 )}
 <div className="flex justify-between text-[#4A6869]">
 <span>{t('ضريبة القيمة المضافة 15%', 'VAT 15%')}</span>
 <span>{formatPrice(selectedOrder.tax_amount)}</span>
 </div>
 <div className="flex justify-between text-[#6CC6C9] font-extrabold text-sm border-t border-[#E8F2F2] pt-2">
 <span>{t('الإجمالي', 'Total')}</span>
 <span>{formatPrice(selectedOrder.total_amount)}</span>
 </div>
 </div>

 {selectedOrder.tracking_number && (
 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-[#6B8C8E] font-semibold">{t('رقم التتبع', 'Tracking')}</span>
 <p className="text-[#6CC6C9] font-bold mt-1">{selectedOrder.tracking_number}</p>
 </div>
 )}

 {selectedOrder.customer_notes && (
 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-[#6B8C8E] font-semibold">{t('ملاحظات العميل', 'Customer Notes')}</span>
 <p className="text-[#4A6869] mt-1">{selectedOrder.customer_notes}</p>
 </div>
 )}

 {selectedOrder.status_history.length > 0 && (
 <div className="p-3 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-[#6B8C8E] font-semibold">{t('سجل الحالات', 'Status History')}</span>
 <div className="mt-2 space-y-2">
 {selectedOrder.status_history.map((h, idx) => (
 <div key={idx} className="flex items-start gap-2 text-xs">
 <div className="w-2 h-2 rounded-full bg-[#6CC6C9] mt-1.5 shrink-0"></div>
 <div>
 <span className="text-white font-bold">{language === 'ar' ? h.note_ar : h.note_en}</span>
 <span className="text-[#6B8C8E] block">{new Date(h.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default AdminOrdersManager;
