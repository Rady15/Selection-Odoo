import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Order } from '../types';
import { printTaxInvoice } from '../utils/printTaxInvoice';
import {
 CheckCircle2,
 PackageCheck,
 Printer,
 Truck,
 MapPin,
 Calendar,
 Coffee,
 ShieldCheck,
 ArrowLeft,
 ArrowRight
} from 'lucide-react';

const ORDER_STATUS_LABELS: Record<string, [string, string]> = {
 pending: ['قيد التجهيز', 'Processing'],
 roasting: ['قيد التحميص', 'Roasting'],
 shipped: ['تم الشحن', 'Shipped'],
 delivered: ['تم التوصيل', 'Delivered'],
 cancelled: ['ملغي', 'Cancelled'],
 paid: ['تم الإنشاء', 'Created']
};

const PAYMENT_STATUS_LABELS: Record<string, [string, string]> = {
 paid: ['تم الدفع ✓', 'Paid'],
 pending: ['قيد الدفع', 'Pending'],
 failed: ['فشل الدفع', 'Failed']
};

const PAYMENT_METHOD_LABELS: Record<string, [string, string]> = {
  mada: ['مدى MADA', 'Mada'],
  visa: ['فيزا / ماستركارد (Stripe)', 'Visa / Mastercard (Stripe)'],
  apple_pay: ['Apple Pay (Stripe)', 'Apple Pay (Stripe)'],
  cod: ['الدفع عند الاستلام', 'Cash on Delivery'],
  tabby: ['تابي - 4 دفعات (Tabby)', 'Tabby - 4 Payments'],
  tamara: ['تمارا - تقسيط (Tamara)', 'Tamara Installments'],
  paymob: ['بطاقة عبر Paymob', 'Card via Paymob']
};

const SHIPPING_METHOD_LABELS: Record<string, [string, string]> = {
 smsa: ['SMSA Express', 'SMSA Express'],
 aramex: ['أرامكس', 'Aramex'],
 dhl: ['DHL', 'DHL']
};

interface OrderConfirmationPageProps {
 orderId: string;
 onNavigate: (path: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderId, onNavigate }) => {
 const { language, t } = useLanguage();
 const { formatPrice, formatPriceString } = useCurrency();
 const [order, setOrder] = useState<Order | null>(null);
 const [notFound, setNotFound] = useState(false);

 useEffect(() => {
 let cancelled = false;

 fetch(`/api/orders/${orderId}`)
 .then(res => {
 if (!res.ok) {
 if (!cancelled) setNotFound(true);
 return null;
 }
 return res.json();
 })
 .then(data => {
 if (cancelled || data === null) return;
 setOrder(data);
 })
 .catch(err => console.error(err));

 return () => { cancelled = true; };
 }, [orderId]);

 if (notFound) {
 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-20 text-center space-y-4 px-4">
 <Coffee className="w-16 h-16 text-[#0E5257] mx-auto" />
 <h2 className="text-2xl font-bold">{t('الطلب غير موجود', 'Order Not Found')}</h2>
 <p className="text-sm text-[#6B8C8E] max-w-md mx-auto">
 {t('تعذر العثور على الطلب. قد يكون قيد المعالجة بعد، حاول مرة أخرى.', 'We could not find this order. It may still be processing, please try again.')}
 </p>
 <button
 onClick={() => onNavigate('/')}
 className="bg-[#0E5257] text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
 >
 {t('العودة للرئيسية', 'Back to Home')}
 </button>
 </div>
 );
 }

 if (!order) {
 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-20 flex items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#0E5257] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">

 {/* Success Header Box */}
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] text-center space-y-4 shadow-2xl">
 <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-10 h-10 animate-bounce" />
 </div>

 <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2E30] font-serif">
 {t('شكراً لك! تم استلام طلبك بنجاح', 'Thank You! Order Confirmed')}
 </h1>

 <p className="text-xs sm:text-sm text-[#4A6869] max-w-md mx-auto">
 {t('تم إرسال رسالة بريدية ونصية برقم الشحنة وتفاصيل التتبع. فريق التحميص يعمل حالياً على تجهيز القهوة.', 'We sent order receipt details & SMS tracking updates to your phone.')}
 </p>

 <div className="inline-flex items-center gap-2 bg-[#FFFFFF] border border-[#E8F2F2] px-4 py-2 rounded-xl text-xs font-mono text-[#6CC6C9]">
  <span>{t('رقم الطلب:', 'Order Number:')}</span>
  <strong className="text-[#1A2E30] font-bold">{order.order_number}</strong>
 </div>

 <div className="flex items-center justify-center gap-3 flex-wrap">
 <div className="inline-flex items-center gap-2 bg-[#FFFFFF] border border-[#E8F2F2] px-3 py-1.5 rounded-xl">
 <span className="text-[10px] text-[#6B8C8E]">{t('حالة الطلب', 'Order')}:</span>
 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
 order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
 order.status === 'roasting' ? 'bg-amber-500/20 text-amber-400' :
 order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
 order.status === 'paid' ? 'bg-purple-500/20 text-purple-400' :
 'bg-[#0E5257]/20 text-[#6CC6C9]'
 }`}>
 {language === 'ar' ? (ORDER_STATUS_LABELS[order.status]?.[0] || order.status) : (ORDER_STATUS_LABELS[order.status]?.[1] || order.status)}
 </span>
 </div>
 <div className="inline-flex items-center gap-2 bg-[#FFFFFF] border border-[#E8F2F2] px-3 py-1.5 rounded-xl">
 <span className="text-[10px] text-[#6B8C8E]">{t('حالة الدفع', 'Payment')}:</span>
 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
 order.payment_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
 'bg-red-500/20 text-red-400'
 }`}>
 {language === 'ar' ? (PAYMENT_STATUS_LABELS[order.payment_status]?.[0] || order.payment_status) : (PAYMENT_STATUS_LABELS[order.payment_status]?.[1] || order.payment_status)}
 </span>
 </div>
 </div>

 {order.loyalty_points_earned && order.loyalty_points_earned > 0 && (
 <div className="flex items-center justify-center gap-2 bg-[#6CC6C9]/10 border border-[#6CC6C9]/30 rounded-xl px-4 py-2.5 text-xs text-[#6CC6C9] mx-auto max-w-sm">
 <span>
 {t('تمت إضافة', 'You earned')} <strong className="font-extrabold">{order.loyalty_points_earned} {t('نقطة ولاء', 'loyalty points')}</strong> {t('إلى رصيدك', 'added to your balance')}
 </span>
 </div>
 )}
 </div>

 {/* Order Details & Items Card */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6">
 <div className="flex items-center justify-between border-b border-[#E8F2F2] pb-4">
 <h3 className="font-extrabold text-base text-[#1A2E30]">{t('تفاصيل المنتجات والمحاصيل', 'Purchased Items')}</h3>
 <button
 onClick={() => printTaxInvoice(order, { language, formatPrice: formatPriceString })}
 className="text-xs text-[#6CC6C9] hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>{t('طباعة الفاتورة الضريبية', 'Print Tax Invoice')}</span>
 </button>
 </div>

 <div className="space-y-3">
 {order.items.map((item: any, idx) => (
 <div key={idx} className="flex justify-between items-center text-xs text-[#4A6869] border-b border-[#E8F2F2]/60 pb-3">
 <div>
 <h5 className="font-bold text-[#1A2E30] text-sm">
 {language === 'ar' ? (item.product_name_ar || item.name_ar) : (item.product_name_en || item.name_en)}
 </h5>
 {item.weight && (
 <p className="text-[11px] text-[#6B8C8E]">
 {item.weight}{item.grind ? ` • ${item.grind}` : ''} • الكمية: {item.quantity}
 </p>
 )}
 </div>
 <span className="font-extrabold text-[#6CC6C9]">{formatPrice(typeof item.total_price === 'number' ? item.total_price : item.price)}</span>
 </div>
 ))}
 </div>

 {/* Pricing Math */}
 <div className="space-y-1.5 text-xs text-[#4A6869] pt-2 border-t border-[#E8F2F2]">
 <div className="flex justify-between">
 <span>{t('المجموع الفرعي', 'Subtotal')}:</span>
 <span>{formatPrice(order.subtotal)}</span>
 </div>
 {order.discount_amount > 0 && (
 <div className="flex justify-between text-emerald-400">
 <span>{t('الخصم', 'Discount')}{order.coupon_code ? ` (${order.coupon_code})` : ''}:</span>
 <span>-{formatPrice(order.discount_amount)}</span>
 </div>
 )}
 {order.loyalty_discount && order.loyalty_discount > 0 && (
 <div className="flex justify-between text-[#6CC6C9]">
 <span>{t('خصم الولاء', 'Loyalty Discount')}{order.loyalty_points_used ? ` (${order.loyalty_points_used} pts)` : ''}:</span>
 <span>-{formatPrice(order.loyalty_discount)}</span>
 </div>
 )}
 <div className="flex justify-between">
 <span>{t('تكلفة الشحن', 'Shipping')}:</span>
 <span>{order.shipping_cost === 0 ? t('مجاناً', 'FREE') : formatPrice(order.shipping_cost)}</span>
 </div>
 {order.cod_surcharge && order.cod_surcharge > 0 && (
 <div className="flex justify-between text-[#6CC6C9]">
 <span>{t('رسوم الدفع عند الاستلام', 'COD Surcharge')}:</span>
 <span>+{formatPrice(order.cod_surcharge)}</span>
 </div>
 )}
 <div className="flex justify-between text-[11px] text-[#6B8C8E]">
 <span>{t('شامل ضريبة القيمة المضافة (15%)', 'Includes 15% VAT')}:</span>
 <span>{formatPrice(order.tax_amount)}</span>
 </div>
 <div className="flex justify-between font-extrabold text-base text-[#1A2E30] pt-2 border-t border-[#E8F2F2]">
 <span>{t('المجموع النهائي المدفوع', 'Total Paid')}:</span>
 <span className="text-[#6CC6C9]">{formatPrice(order.total_amount)}</span>
 </div>
 </div>
 </div>

 {/* Shipping Address & Status Timeline */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] border-b border-[#E8F2F2] pb-3">
 {t('عنوان التوصيل وحالة الشحنة', 'Delivery Info & Tracking')}
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#4A6869]">
 <div className="space-y-1">
 <span className="text-[#6B8C8E] block">{t('العميل والمدينة', 'Customer & City')}</span>
 <p className="font-bold text-[#1A2E30]">{order.customer_name} ({order.shipping_address?.city})</p>
 {order.shipping_address && <p>{order.shipping_address.district} - {order.shipping_address.street}</p>}
 </div>

 <div className="space-y-1">
 <span className="text-[#6B8C8E] block">{t('شركة الشحن وطريقة الدفع', 'Courier & Payment')}</span>
 <p className="font-bold text-[#1A2E30]">
 {language === 'ar' ? (SHIPPING_METHOD_LABELS[order.shipping_method]?.[0] || order.shipping_method) : (SHIPPING_METHOD_LABELS[order.shipping_method]?.[1] || order.shipping_method)}
 </p>
 <p className="uppercase text-[#6CC6C9] font-extrabold">
 {language === 'ar' ? (PAYMENT_METHOD_LABELS[order.payment_method]?.[0] || order.payment_method) : (PAYMENT_METHOD_LABELS[order.payment_method]?.[1] || order.payment_method)}
 </p>
{((order.payment_method === 'visa' || order.payment_method === 'apple_pay' || order.payment_method === 'mada') && (
  <p className="text-[10px] text-[#6B8C8E] flex items-center gap-1 pt-0.5">
    <ShieldCheck className="w-3 h-3 text-emerald-400" />
    <span>{t('دفع آمن ومشفر عبر Stripe', 'Secure encrypted payment via Stripe')}</span>
  </p>
))}
 {order.payment_method === 'cod' && (
 <p className="text-[10px] text-[#6B8C8E]">
 {t('الدفع نقداً عند استلام الطلب', 'Pay cash on delivery')}
 </p>
 )}
 </div>
 </div>
 </div>

 {/* Status History Timeline */}
 {order.status_history && order.status_history.length > 0 && (
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] border-b border-[#E8F2F2] pb-3">
 {t('سجل حالة الطلب', 'Order Status History')}
 </h3>
 <div className="space-y-3">
 {order.status_history.map((h, idx) => (
 <div key={idx} className="flex items-start gap-3 text-xs">
 <div className="flex flex-col items-center">
 <div className="w-3 h-3 rounded-full bg-[#6CC6C9] shrink-0" />
 {idx < order.status_history.length - 1 && <div className="w-0.5 h-8 bg-[#E8F2F2] mt-1" />}
 </div>
 <div>
  <p className="text-[#1A2E30] font-bold">{language === 'ar' ? h.note_ar : h.note_en}</p>
 <span className="text-[#6B8C8E] text-[10px]">{new Date(h.timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

{/* Tracking Section */}
  {order.tracking_number && (
  <div className="p-4 rounded-2xl bg-[#0E5257]/10 border border-[#6CC6C9]/30 space-y-3">
  <div className="flex items-center gap-2">
  <Truck className="w-5 h-5 text-[#6CC6C9]" />
  <h3 className="font-bold text-sm text-[#1A2E30]">{t('معلومات الشحن', 'Shipping Info')}</h3>
  </div>
  <div className="grid grid-cols-2 gap-3 text-xs">
  <div>
  <span className="text-[#6B8C8E]">{t('شركة الشحن', 'Carrier')}</span>
  <p className="text-[#1A2E30] font-bold">{SHIPPING_METHOD_LABELS[order.shipping_method]?.[language === 'ar' ? 0 : 1] || order.shipping_method}</p>
  </div>
  <div>
  <span className="text-[#6B8C8E]">{t('رقم التتبع', 'Tracking Number')}</span>
  <p className="text-[#6CC6C9] font-bold font-mono">{order.tracking_number}</p>
  </div>
  </div>
  {order.tracking_url && (
  <a
  href={order.tracking_url}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#0E5257] hover:bg-[#2B7D82] text-white rounded-xl text-xs font-bold transition cursor-pointer"
  >
  <Truck className="w-4 h-4" />
  {t('تتبع الشحنة', 'Track Shipment')}
  </a>
  )}
  </div>
  )}

 {/* Track Order Action */}
 <div className="p-4 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2 text-xs text-[#4A6869]">
 <Truck className="w-4 h-4 text-[#6CC6C9]" />
 <span>{t('تابع حالة طلبك لحظة بلحظة', 'Follow your order status in real time')}</span>
 </div>
 <button
 onClick={() => onNavigate(`/track-order/${encodeURIComponent(order.order_number)}`)}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
 >
 <Truck className="w-4 h-4" />
 {t('تتبع الطلب', 'Track Order')}
 </button>
 </div>

 {/* Home Action button */}
 <div className="text-center pt-4">
 <button
 onClick={() => onNavigate('/')}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-8 py-3 rounded-2xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
 >
 <span>{t('العودة للرئيسية', 'Return to Homepage')}</span>
 {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
 </button>
 </div>

 </div>
 </div>
 );
};

export default OrderConfirmationPage;
