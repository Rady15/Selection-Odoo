import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { saudiCities } from '../utils/coffee';
import { PaymentMethod, Address } from '../types';
import { StripePaymentSection } from '../components/checkout/StripePaymentSection';
import {
 CreditCard,
 ShieldCheck,
 Truck,
 MapPin,
 User,
 Phone,
 Mail,
 CheckCircle2,
 Lock,
 ArrowLeft,
 ArrowRight
} from 'lucide-react';

interface CheckoutPageProps {
 onNavigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();
 const { user } = useAuth();
 const { openAuth } = useUI();
 const {
 items,
 subtotal,
 discountAmount,
 appliedCoupon,
 loyaltyDiscountSAR,
 loyaltyPointsToRedeem,
  taxAmount,
  totalAmount,
  clearCart,
  getStoreSettings
  } = useCart();

 // Form State
 const [customerName, setCustomerName] = useState(user?.name || '');
 const [phone, setPhone] = useState(user?.phone || '');
 const [email, setEmail] = useState(user?.email || '');
 const [formData, setFormData] = useState({
 city: 'الرياض',
 district: 'حطين',
 street: 'طريق الملك فهد، مبنى 12',
 building: '',
 postal_code: '',
 delivery_notes: ''
 });
  const [shippingProviderId, setShippingProviderId] = useState('smsa');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mada');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stripeMethods: PaymentMethod[] = ['mada', 'visa', 'apple_pay'];

  // Dynamically loaded from the server: only enabled + credentialed gateways
  // and carriers are offered. No keys => hidden automatically.
  const [gatewayList, setGatewayList] = useState<any[] | null>(null);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public/payment-methods')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setGatewayList(Array.isArray(data) ? data : []))
      .catch(() => setGatewayList([]));
    fetch('/api/public/shipping-methods')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setShippingMethods(Array.isArray(data) && data.length ? data : []))
      .catch(() => {});
  }, []);

  const stripeVisible = !gatewayList || gatewayList.some(g => g.id === 'stripe');
  const codVisible = !gatewayList || gatewayList.some(g => g.id === 'cod');
  const tabbyVisible = !!gatewayList?.some(g => g.id === 'tabby');
  const tamaraVisible = !!gatewayList?.some(g => g.id === 'tamara');
  const paymobVisible = !!gatewayList?.some(g => g.id === 'paymob');

  const availableMethods = (['mada', 'apple_pay', 'visa', 'cod', 'tabby', 'tamara', 'paymob'] as PaymentMethod[]).filter(m => {
    if (stripeMethods.includes(m)) return stripeVisible;
    if (m === 'cod') return codVisible;
    if (m === 'tabby') return tabbyVisible;
    if (m === 'tamara') return tamaraVisible;
    if (m === 'paymob') return paymobVisible;
    return false;
  });

  // Keep the selected method/shipping valid as server data arrives.
  useEffect(() => {
    if (gatewayList && !availableMethods.includes(paymentMethod) && availableMethods.length > 0) {
      setPaymentMethod(availableMethods[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayList]);

  useEffect(() => {
    if (shippingMethods.length > 0 && !shippingMethods.some(s => s.id === shippingProviderId)) {
      setShippingProviderId(shippingMethods[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethods]);

  const isStripeMethod = stripeMethods.includes(paymentMethod);

 // Payment step state
 const [pendingOrder, setPendingOrder] = useState<any>(null);
 const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live' | null>(null);
 const [clientSecret, setClientSecret] = useState('');
 const [publishableKey, setPublishableKey] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  // Order already created at checkout when a payment_action arrives — used as
  // the confirmation target when the backend has no confirm endpoint.
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

const storeSettings = getStoreSettings ? getStoreSettings() : null;
  const freeShippingThreshold = storeSettings?.free_shipping_threshold ?? 199;
  const selectedShipping = shippingMethods.find(p => p.id === shippingProviderId)
    || shippingMethods[0]
    || { id: shippingProviderId, base_fee: 25, cod_supported: true };
  const feeRaw = Number(selectedShipping.base_fee ?? 25);
  const shippingCost = totalAmount >= freeShippingThreshold ? 0 : (Number.isFinite(feeRaw) ? feeRaw : 0);
  const codSurcharge = paymentMethod === 'cod' ? (storeSettings?.cod_surcharge ?? 15) : 0;
  const finalPayableTotal = totalAmount + shippingCost + codSurcharge;

 const hydratedUserId = useRef<string | null>(null);

 useEffect(() => {
 if (!user || hydratedUserId.current === user.id) return;
 hydratedUserId.current = user.id;
 fetch(`/api/users/${user.id}`)
 .then(res => (res.ok ? res.json() : null))
 .then(fresh => {
 if (!fresh) return;
 setCustomerName(fresh.name || '');
 setPhone(fresh.phone || '');
 setEmail(fresh.email || '');
 const addr: Address | undefined =
 (fresh.addresses || []).find((a: Address) => a.is_default) || (fresh.addresses || [])[0];
 if (addr) {
 setFormData({
 city: addr.city || '',
 district: addr.district || '',
 street: addr.street || '',
 building: addr.building || '',
 postal_code: addr.postal_code || '',
 delivery_notes: addr.delivery_notes || ''
 });
 }
 })
 .catch(() => {});
 }, [user]);

  // Return from a 3D-Secure / redirect bank step: the payment succeeded on the
  // Stripe side, so confirm it now (this also creates the order).
  // Also handles returns from Tabby / Tamara / Paymob redirect checkouts.
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const pi = params.get('pi');
  if (pi) {
  setPaymentBusy(true);
  setPaymentError('');
  fetch('/api/payments/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payment_intent_id: pi })
  })
  .then(async res => {
  const data = await res.json();
  if (!res.ok || !data.id) {
  setPendingOrder({});
  setPaymentError(data.error_ar || data.error_en || t('تعذر تأكيد الدفع، أعد المحاولة', 'Could not confirm payment, please retry'));
  return;
  }
  clearCart();
  onNavigate(`/order-confirmation/${data.id}`);
  })
  .catch(() => {
  setPendingOrder({});
  setPaymentError(t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  })
  .finally(() => setPaymentBusy(false));
  return;
  }

  const gateway = params.get('gateway');
  const result = params.get('result');
  const cleanUrl = () => {
  try { window.history.replaceState({}, '', '/checkout'); } catch { /* noop */ }
  };

  if (gateway === 'paymob' && (params.get('hmac') || params.get('success') !== null)) {
  // Paymob appends the full transaction payload to the callback URL.
  const payload: Record<string, string> = {};
  params.forEach((v, k) => { payload[k] = v; });
  setPaymentBusy(true);
  setPaymentError('');
  fetch('/api/payments/paymob/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
  })
  .then(async res => {
  const data = await res.json();
  if (!res.ok || !data.id) {
  setPaymentError(data.error_ar || data.error_en || t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  return;
  }
  try { sessionStorage.removeItem('pending_gateway_payment'); } catch { /* noop */ }
  clearCart();
  cleanUrl();
  onNavigate(`/order-confirmation/${data.id}`);
  })
  .catch(() => {
  setPaymentError(t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  })
  .finally(() => setPaymentBusy(false));
  return;
  }

  if ((gateway === 'tabby' || gateway === 'tamara')) {
  if (result === 'cancel' || result === 'failure') {
  setPaymentError(t('تم إلغاء عملية الدفع، يمكنك المحاولة مرة أخرى', 'Payment was cancelled, you can try again'));
  cleanUrl();
  return;
  }
  if (result === 'success') {
  let stored: any = null;
  try { stored = JSON.parse(sessionStorage.getItem('pending_gateway_payment') || 'null'); } catch { stored = null; }
  const sessionId = stored?.session_id || params.get('payment_id') || params.get('paymentId') || params.get('order_id') || params.get('orderId') || '';
  if (!stored || stored.gateway !== gateway || !sessionId) {
  setPaymentError(t('تعذر العثور على جلسة الدفع، أعد المحاولة', 'Payment session not found, please retry'));
  cleanUrl();
  return;
  }
  setPaymentBusy(true);
  setPaymentError('');
  fetch(`/api/payments/${gateway}/confirm`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ session_id: sessionId })
  })
  .then(async res => {
  const data = await res.json();
  if (!res.ok || !data.id) {
  setPaymentError(data.error_ar || data.error_en || t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  return;
  }
  try { sessionStorage.removeItem('pending_gateway_payment'); } catch { /* noop */ }
  clearCart();
  cleanUrl();
  onNavigate(`/order-confirmation/${data.id}`);
  })
  .catch(() => {
  setPaymentError(t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  })
  .finally(() => setPaymentBusy(false));
  return;
  }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
  e.preventDefault();
  if (items.length === 0) return;
  setIsSubmitting(true);
  setPaymentError('');

  if (paymentMethod === 'cod' && selectedShipping && (selectedShipping as any).cod_supported === false) {
  setIsSubmitting(false);
  setPaymentError(t('شركة الشحن المختارة لا تدعم الدفع عند الاستلام، اختر شركة أخرى أو طريقة دفع مختلفة', 'The selected carrier does not support cash on delivery'));
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
  return;
  }

 const orderPayload = {
 user_id: user?.id || undefined,
 customer_name: customerName,
 email,
 phone,
 shipping_address: {
 id: `addr-${Date.now()}`,
 title: 'عنوان الشحن',
 full_name: customerName,
 phone,
 country: 'المملكة العربية السعودية',
 city: formData.city,
 district: formData.district,
 street: formData.street,
 building: formData.building || '',
 postal_code: formData.postal_code || '',
 delivery_notes: formData.delivery_notes || '',
 is_default: false
 },
  items: items.map(i => {
  // Resolve the exact backend variant UUID so checkout validation accepts
  // the line (falls back to weight-only match, then first variant).
  const vs = i.product.variants || [];
  const v = vs.find(x => x.weight === i.selected_weight && x.grind === i.selected_grind)
  || vs.find(x => x.weight === i.selected_weight)
  || vs[0];
  return {
  variant_id: (v as any)?.id,
  product_id: i.product.id,
  product_name_ar: i.product.name_ar,
  product_name_en: i.product.name_en,
  image: i.product.images?.[0] || '',
  weight: i.selected_weight,
  grind: i.selected_grind,
  quantity: i.quantity,
  unit_price: i.unit_price,
  total_price: i.unit_price * i.quantity,
  sku: (v as any)?.sku || i.product.sku || ''
  };
  }),
 subtotal,
 discount_amount: discountAmount,
 loyalty_discount: loyaltyDiscountSAR,
 shipping_cost: shippingCost,
 tax_amount: taxAmount,
 cod_surcharge: codSurcharge,
 total_amount: finalPayableTotal,
 payment_method: paymentMethod,
 shipping_method: selectedShipping.id,
 status: 'pending',
 payment_status: paymentMethod === 'cod' || isStripeMethod ? 'pending' : 'paid',
 customer_notes: '',
 coupon_code: appliedCoupon?.code,
 loyalty_points_used: loyaltyPointsToRedeem
 };

try {
    if (isStripeMethod) {
      // Card payments: the order is only created AFTER the payment succeeds
      // (status = paid). For now we just stage the payload and open the
      // payment modal, so no pending order shows up early.
      setPendingOrder(orderPayload);
      setPaymentError('');
      setPaymentBusy(true);
      try {
        const cfg = await fetch('/api/payments/config').then(r => r.json()).catch(() => ({ mode: 'sandbox', publishable_key: '' }));
        console.log('[Stripe] /api/payments/config:', cfg);
        // Try the real PaymentIntent backend first (test AND live). When it
        // answers with a client_secret we render the real Stripe card form,
        // so test cards (4242 4242 4242 4242, declines, 3DS, ...) behave
        // exactly like Stripe test mode. Only when the backend has no such
        // route do we fall back to the simulated sandbox payment.
        let intent: any = null;
        // Remember a missing route for this tab session so we don't spam a
        // known-404 on every checkout (a fresh tab retries, picking up the
        // backend the moment it deploys create-intent).
        let skipIntent = false;
        try { skipIntent = sessionStorage.getItem('ci-missing') === '1'; } catch { /* noop */ }
        if (!skipIntent) try {
          const intentRes = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: orderPayload })
          });
          if (intentRes.status === 404) {
            try { sessionStorage.setItem('ci-missing', '1'); } catch { /* noop */ }
          } else if (intentRes.ok) {
            const parsed = await intentRes.json().catch(() => null);
            if (parsed && !parsed.error_ar && !parsed.error_en && parsed.client_secret) intent = parsed;
            else if (parsed && (parsed.error_ar || parsed.error_en)) {
              setPaymentError(parsed.error_ar || parsed.error_en || 'Payment error');
              setIsSubmitting(false);
              setPaymentBusy(false);
              return;
            }
          }
        } catch {
          intent = null;
        }

        if (intent) {
          if (cfg.key_mode_mismatch) {
            setPaymentError(t('توجد مشكلة في مفاتيح Stripe: المفتاح السري والمفتاح العام من وضعين مختلفين (test/live)', 'Stripe key issue: secret and publishable keys are in different modes (test/live)'));
            setIsSubmitting(false);
            setPaymentBusy(false);
            return;
          }
          if (cfg.key_account_mismatch) {
            setPaymentError(t('توجد مشكلة في مفاتيح Stripe: المفتاح السري والمفتاح العام من حسابي Stripe مختلفين', 'Stripe key issue: secret and publishable keys belong to different Stripe accounts'));
            setIsSubmitting(false);
            setPaymentBusy(false);
            return;
          }
          setPaymentMode(intent.mode || cfg.mode || 'sandbox');
          setClientSecret(intent.client_secret || '');
          setPublishableKey(cfg.publishable_key || '');
          setPaymentIntentId(intent.payment_intent_id || '');
        } else if ((cfg.mode || 'sandbox') === 'sandbox') {
          // No PaymentIntent backend — simulated payment UI, which creates
          // the order via POST /api/orders on confirm.
          setPaymentMode('sandbox');
          setPublishableKey(cfg.publishable_key || '');
          setPaymentBusy(false);
          return;
        } else {
          setPaymentError(t('خدمة الدفع غير مفعّلة على الخادم بعد، جرّب الدفع عند الاستلام', 'Card payments are not enabled on the server yet, try cash on delivery'));
          setIsSubmitting(false);
          setPaymentBusy(false);
          return;
        }
      } catch (err) {
        console.error('[Stripe] prepare-payment threw:', err);
        setPaymentError(t('تعذر تجهيز عملية الدفع', 'Could not prepare payment'));
      }
      setPaymentBusy(false);
    } else if (paymentMethod === 'tabby' || paymentMethod === 'tamara' || paymentMethod === 'paymob') {
      // Redirect gateways (Tabby / Tamara / Paymob): create a server-side
      // session, then redirect the customer to the provider checkout.
      // The order is created ONLY after server-side verification on return.
      const endpoint =
        paymentMethod === 'paymob'
          ? '/api/payments/paymob/intention'
          : `/api/payments/${paymentMethod}/create`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderPayload })
        });
        const data = await res.json();
        if (!res.ok || !data.checkout_url) {
          setIsSubmitting(false);
          setPaymentError(data.error_ar || data.error_en || t('تعذر بدء الدفع', 'Could not start payment'));
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
          return;
        }
        try {
          sessionStorage.setItem('pending_gateway_payment', JSON.stringify({ gateway: paymentMethod, session_id: data.session_id }));
        } catch { /* storage unavailable */ }
        window.location.href = data.checkout_url;
        return;
      } catch (err: any) {
        console.error(`[${paymentMethod}] start-payment threw:`, err);
        setIsSubmitting(false);
        setPaymentError(err?.message || t('تعذر بدء الدفع', 'Could not start payment'));
        return;
      }
    } else {
  // Cash on delivery: create the order immediately (payment pending,
  // collected on delivery).
  const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderPayload)
  });
  const data = await res.json();
  if (!data.id) {
  setIsSubmitting(false);
  alert(t('حدث خطأ أثناء معالجة الطلب', 'Failed to place order'));
  return;
  }
  clearCart();
  onNavigate(`/order-confirmation/${data.id}`);
  }
 } catch (err) {
 console.error(err);
 setIsSubmitting(false);
 alert(t('خطأ بالاتصال بالسيرفر', 'Server error occurred'));
 }
 };

  const handlePaymentSuccess = async () => {
  if (!pendingOrder) return;
  setPaymentBusy(true);
  setPaymentError('');
  try {
  // A real Stripe action (test or live) completed in the card form — confirm
  // it server-side. This takes precedence over the sandbox simulation.
  if (paymentIntentId) {
  try {
  const res = await fetch('/api/payments/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payment_intent_id: paymentIntentId })
  });
  if (res.status === 404) {
  // No confirm endpoint on the backend: the order already exists (created
  // at checkout) and Stripe succeeded client-side — the backend webhook
  // reconciles payment. Navigate to it instead of failing.
  if (createdOrderId) {
  clearCart();
  onNavigate(`/order-confirmation/${createdOrderId}`);
  return;
  }
  setPaymentError(t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  return;
  }
  const data = await res.json();
  if (!res.ok || !data.id) {
  setPaymentError(data.error_ar || data.error_en || t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  return;
  }
  clearCart();
  onNavigate(`/order-confirmation/${data.id}`);
  return;
  } catch (err) {
  console.error(err);
  setPaymentError(t('خطأ بالاتصال بالسيرفر', 'Server error occurred'));
  return;
  }
  }
  if (paymentMode === 'sandbox') {
  await handleSandboxPay();
  return;
  }
  // Live mode without a payment intent (shouldn't happen — the card form
  // always sets one) — nothing to confirm.
  setPaymentError(t('تعذر تأكيد الدفع', 'Could not confirm payment'));
  } catch (err) {
 console.error(err);
 setPaymentError(t('خطأ بالاتصال بالسيرفر', 'Server error occurred'));
 } finally {
 setPaymentBusy(false);
 }
 };

const handlePaymentCancel = () => {
  setPendingOrder(null);
  setPaymentMode(null);
  setClientSecret('');
  setPaymentIntentId('');
  setCreatedOrderId(null);
  setPaymentError('');
  setIsSubmitting(false);
};

  const handleSandboxPay = async () => {
  if (!pendingOrder) return;
  setPaymentBusy(true);
  setPaymentError('');
  try {
  // No /api/payments/sandbox-confirm route on the backend — a simulated
  // payment simply creates the order through the standard checkout API.
  const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pendingOrder)
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
  setPaymentError(data.error_ar || data.error_en || t('فشل إتمام الدفع', 'Payment failed'));
  return;
  }
  // Backend returned a real Stripe action (client_secret) — show the card
  // form instead of navigating: the order stays pending until the card is
  // confirmed (test cards like 4242 4242 4242 4242 included).
  const pa = (data as any).payment_action;
  if (pa?.client_secret) {
  setPaymentMode(pa.mode || 'sandbox');
  setClientSecret(pa.client_secret);
  setPublishableKey(pa.publishable_key || '');
  setPaymentIntentId(pa.payment_intent_id || '');
  setCreatedOrderId(data.id || null);
  setPaymentBusy(false);
  return;
  }
  clearCart();
  onNavigate(`/order-confirmation/${data.id}`);
 } catch (err) {
 console.error(err);
 setPaymentError(t('خطأ بالاتصال بالسيرفر', 'Server error occurred'));
 } finally {
 setPaymentBusy(false);
 }
 };

 // Login is required before a customer can place any order.
 if (!user) {
 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-16 px-4">
 <div className="max-w-md mx-auto text-center space-y-6">
 <div className="w-16 h-16 rounded-3xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center mx-auto">
 <User className="w-8 h-8" />
 </div>
 <div className="space-y-2">
 <h1 className="text-2xl font-extrabold font-serif">
 {t('سجّل الدخول لإتمام طلبك', 'Login to complete your order')}
 </h1>
 <p className="text-xs text-[#6B8C8E] leading-relaxed">
 {t('يُشترط تسجيل الدخول (أو إنشاء حساب) قبل إتمام الطلب، حتى تتمكن من متابعة حالة طلبك، وتتبع الشحنة، وكسب نقاط الولاء مع كل عملية شراء.', 'A login (or a new account) is required before placing an order so you can track your order, follow your shipment, and earn loyalty points on every purchase.')}
 </p>
 </div>
 <div className="space-y-3">
 <button
 onClick={() => openAuth()}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3.5 rounded-2xl text-sm font-extrabold transition shadow-2xl shadow-[#0E5257]/40 cursor-pointer flex items-center justify-center gap-2"
 >
 <User className="w-4 h-4" />
 {t('تسجيل الدخول / إنشاء حساب', 'Login / Create Account')}
 </button>
 <button
 onClick={() => onNavigate('/cart')}
 className="w-full text-[#6B8C8E] hover:text-[#6CC6C9] py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
 >
 {t('العودة إلى السلة', 'Back to Cart')}
 </button>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

 {/* Title Bar */}
 <div className="border-b border-[#E8F2F2] pb-6 flex items-center justify-between">
 <div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2E30] font-serif">
 {t('إتمام الشراء والدفع الآمن', 'Checkout')}
 </h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t('أدخل عنوان التوصيل واختر طريقة الدفع المفضلة لتأكيد الشحنة', 'Enter shipping address and select payment method')}
 </p>
 </div>

 <button
 onClick={() => onNavigate('/cart')}
 className="text-xs font-bold text-[#6CC6C9] hover:underline cursor-pointer"
 >
 ← {t('العودة للسلة', 'Back to Cart')}
 </button>
 </div>

 <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

 {/* Main Form Area */}
 <div className="lg:col-span-2 space-y-6">

 {/* Step 1: Contact Details */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] flex items-center gap-2 border-b border-[#E8F2F2] pb-3">
 <User className="w-5 h-5 text-[#6CC6C9]" />
 <span>{t('1. معلومات العميل والاتصال', '1. Contact Details')}</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('الاسم الكامل', 'Full Name')}</label>
 <input
 type="text"
 required
 value={customerName}
 onChange={e => setCustomerName(e.target.value)}
 placeholder="عبدالرحمن العتيبي"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('رقم الجوال (لإشعارات الشحنة والـ SMS)', 'Phone Number')}</label>
 <input
 type="tel"
 required
 value={phone}
 onChange={e => setPhone(e.target.value)}
 placeholder="+966 50 123 4567"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('البريد الإلكتروني (لإرسال الفاتورة الضريبية)', 'Email Address')}</label>
 <input
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="name@example.com"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>
 </div>
 </div>

 {/* Step 2: Shipping Address & City */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] flex items-center gap-2 border-b border-[#E8F2F2] pb-3">
 <MapPin className="w-5 h-5 text-[#6CC6C9]" />
 <span>{t('2. عنوان التوصيل بالمملكة', '2. Shipping Address in KSA')}</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('المدينة', 'City')}</label>
 <select
 value={formData.city}
 onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
 className="w-full focus:outline-none focus:border-[#6CC6C9] cursor-pointer"
 >
 {saudiCities.map(c => (
 <option key={c.id} value={c.name_ar}>
 {language === 'ar' ? c.name_ar : c.name_en}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('الحي', 'District')}</label>
 <input
 type="text"
 required
 value={formData.district}
 onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
 placeholder="حي حطين / النرجس / الملقا"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('تفاصيل الشارع', 'Street Address')}</label>
 <input
 type="text"
 required
 value={formData.street}
 onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
 placeholder="طريق الملك فهد"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div className="grid grid-cols-2 gap-3 sm:col-span-2">
 <div>
 <label className="block text-[10px] text-[#6B8C8E] mb-1">{t('المبنى/الفيلا', 'Building')}</label>
 <input type="text" value={formData.building} onChange={e => setFormData(prev => ({ ...prev, building: e.target.value }))}
 className="w-full " />
 </div>
 <div>
 <label className="block text-[10px] text-[#6B8C8E] mb-1">{t('الرمز البريدي', 'Postal Code')}</label>
 <input type="text" value={formData.postal_code} onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
 className="w-full " />
 </div>
 </div>

 <div className="sm:col-span-2">
 <label className="block text-[10px] text-[#6B8C8E] mb-1">{t('ملاحظات التوصيل', 'Delivery Notes')}</label>
 <input type="text" value={formData.delivery_notes} onChange={e => setFormData(prev => ({ ...prev, delivery_notes: e.target.value }))}
 placeholder={t('مثال: الباب الأزرق على اليمين', 'e.g. Blue door on the right')}
 className="w-full " />
 </div>
 </div>
 </div>

 {/* Step 3: Shipping Provider */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] flex items-center gap-2 border-b border-[#E8F2F2] pb-3">
 <Truck className="w-5 h-5 text-[#6CC6C9]" />
 <span>{t('3. شركات الشحن والتوصيل', '3. Courier & Express Delivery')}</span>
 </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {shippingMethods.length === 0 ? (
    <div className="col-span-full text-center text-xs text-[#6B8C8E] py-4">
      {t('جاري تحميل شركات الشحن...', 'Loading shipping methods...')}
    </div>
  ) : shippingMethods.map(provider => {
  const selected = shippingProviderId === provider.id;
  const isFree = totalAmount >= freeShippingThreshold;
  return (
  <div
  key={provider.id}
  onClick={() => setShippingProviderId(provider.id)}
  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${selected
  ? 'bg-[#0E5257]/20 border-[#6CC6C9]'
  : 'bg-[#FFFFFF] border-[#E8F2F2] hover:border-[#0E5257]'
  }`}
  >
  <div className="space-y-1">
  <span className="font-bold text-xs text-[#4A6869] block">
  {language === 'ar' ? provider.name_ar : provider.name_en}
  {provider.id === 'smsa' && (
  <span className="mr-1.5 inline-block text-[9px] bg-[#6CC6C9]/20 text-[#6CC6C9] px-1.5 py-0.5 rounded font-extrabold align-middle">
  {t('مُوصى به', 'RECOMMENDED')}
  </span>
  )}
  </span>
  <span className="text-[10px] text-[#6B8C8E]">
  {language === 'ar' ? provider.description_ar : provider.description_en}
  {!provider.cod_supported && paymentMethod === 'cod' && (
  <span className="block text-red-400 font-bold">{t('لا تدعم الدفع عند الاستلام', 'Does not support COD')}</span>
  )}
  </span>
  </div>

  <span className="font-extrabold text-xs text-[#6CC6C9]">
  {isFree ? t('مجاناً', 'FREE') : formatPrice(Number(provider.base_fee) || 0)}
  </span>
  </div>
  );
  })}
  </div>
  </div>

 {/* Step 4: Payment Method */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-extrabold text-base text-[#1A2E30] flex items-center gap-2 border-b border-[#E8F2F2] pb-3">
 <CreditCard className="w-5 h-5 text-[#6CC6C9]" />
 <span>{t('4. طريقة الدفع', '4. Payment Option')}</span>
 </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {gatewayList === null ? (
  <div className="col-span-full text-center text-xs text-[#6B8C8E] py-4">
  {t('جاري تحميل طرق الدفع...', 'Loading payment methods...')}
  </div>
  ) : availableMethods.length === 0 ? (
  <div className="col-span-full text-center text-xs text-red-400 py-4">
  {t('لا توجد طرق دفع مفعّلة حالياً', 'No payment methods are currently enabled')}
  </div>
  ) : availableMethods.map(id => {
  const meta: Record<string, { label_ar: string; label_en: string; badge: string; imgs: string[]; hint_ar: string; hint_en: string }> = {
  mada: { label_ar: 'بطاقة مدى MADA', label_en: 'Mada Debit Card', badge: 'MADA', imgs: ['https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/mada.svg'], hint_ar: 'دفع فوري آمن', hint_en: 'Secure instant payment' },
  apple_pay: { label_ar: 'Apple Pay', label_en: 'Apple Pay', badge: 'Apple Pay', imgs: ['https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/apple_pay.svg'], hint_ar: 'عبر Stripe', hint_en: 'via Stripe' },
  visa: { label_ar: 'فيزا / ماستركارد', label_en: 'Visa / Mastercard', badge: 'VISA', imgs: [
  'https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/visa.svg',
  'https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/master.svg'
  ], hint_ar: 'عبر Stripe', hint_en: 'via Stripe' },
  cod: { label_ar: `الدفع عند الاستلام (+${codSurcharge} ﷼)`, label_en: 'Cash on Delivery', badge: 'COD', imgs: [], hint_ar: 'ادفع عند وصول طلبك', hint_en: 'Pay when your order arrives' },
  tabby: { label_ar: 'تابي — قسّمها على 4', label_en: 'Tabby — Split in 4', badge: 'tabby', imgs: [], hint_ar: 'بدون فوائد', hint_en: 'No interest' },
  tamara: { label_ar: 'تمارا — قسّط فاتورتك', label_en: 'Tamara — Split it', badge: 'tamara', imgs: [], hint_ar: 'دفع مرن متوافق مع الشريعة', hint_en: 'Flexible Sharia-compliant payments' },
  paymob: { label_ar: 'بطاقة عبر Paymob', label_en: 'Card via Paymob', badge: 'Paymob', imgs: [], hint_ar: 'مدى والبطاقات والمحافظ', hint_en: 'Cards, mada & wallets' }
  };
  const p = meta[id];
  if (!p) return null;
  const selected = paymentMethod === id;
  return (
  <div
  key={id}
  onClick={() => setPaymentMethod(id as PaymentMethod)}
  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${selected
  ? 'bg-[#0E5257]/20 border-[#6CC6C9]'
  : 'bg-[#FFFFFF] border-[#E8F2F2] hover:border-[#0E5257]'
  }`}
  >
  <span>
  <span className="font-bold text-xs text-[#4A6869] block">
  {language === 'ar' ? p.label_ar : p.label_en}
  </span>
  <span className="text-[10px] text-[#6B8C8E] block">
  {language === 'ar' ? p.hint_ar : p.hint_en}
  </span>
  </span>
  <span className="flex items-center gap-1.5">
  {p.imgs.length > 0 ? p.imgs.map(src => (
  <img
  key={src}
  src={src}
  alt={p.badge}
  className="h-5 w-auto"
  onError={e => {
  const t = e.currentTarget;
  const s = document.createElement('span');
  s.className = 'text-[10px] font-extrabold bg-[#E8F2F2] px-2 py-0.5 rounded text-[#6CC6C9]';
  s.textContent = p.badge;
  t.parentNode?.replaceChild(s, t);
  }}
  />
  )) : (
  <span className="text-[10px] font-extrabold bg-[#E8F2F2] px-2 py-0.5 rounded text-[#6CC6C9]">
  {p.badge}
  </span>
  )}
  </span>
  </div>
  );
  })}
  </div>
  </div>

 </div>

 {/* Checkout Order Review Sidebar */}
 <div className="space-y-6">
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-5 sticky top-28 shadow-2xl">
 <h3 className="font-extrabold text-base text-[#1A2E30] border-b border-[#E8F2F2] pb-3">
 {t('تفاصيل الفاتورة النهائية', 'Final Invoice Summary')}
 </h3>

 {/* Items Summary list */}
 <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
 {items.map(item => (
 <div key={item.id} className="flex justify-between text-xs text-[#4A6869]">
 <span className="truncate max-w-[180px]">
 {item.quantity}x {language === 'ar' ? item.product.name_ar : item.product.name_en} ({item.selected_weight})
 </span>
 <span className="font-bold text-[#1A2E30]">{formatPrice(item.unit_price * item.quantity)}</span>
 </div>
 ))}
 </div>

 {/* Math breakdown */}
 <div className="space-y-2 text-xs text-[#4A6869] pt-3 border-t border-[#E8F2F2]">
 <div className="flex justify-between">
 <span>{t('المجموع الفرعي', 'Subtotal')}:</span>
 <span className="font-bold text-[#1A2E30]">{formatPrice(subtotal)}</span>
 </div>

 {discountAmount > 0 && (
 <div className="flex justify-between text-emerald-400 font-bold">
 <span>{t('الخصم', 'Discount')}:</span>
 <span>-{formatPrice(discountAmount)}</span>
 </div>
 )}

 <div className="flex justify-between">
 <span>{t('تكلفة الشحن والتوصيل', 'Shipping Fee')}:</span>
 <span className="font-bold text-[#1A2E30]">{shippingCost === 0 ? t('مجاناً', 'FREE') : formatPrice(shippingCost)}</span>
 </div>

 <div className="flex justify-between text-[11px] text-[#6B8C8E]">
 <span>{t('ضريبة القيمة المضافة (15%)', 'Includes 15% VAT')}:</span>
 <span>{formatPrice(taxAmount)}</span>
 </div>

 {codSurcharge > 0 && (
 <div className="flex justify-between text-[11px] text-[#6CC6C9]">
 <span>{t('رسوم الدفع عند الاستلام', 'COD Surcharge')}:</span>
 <span>+{formatPrice(codSurcharge)}</span>
 </div>
 )}

  <div className="flex justify-between text-[#1A2E30] font-extrabold text-xl pt-3 border-t border-[#E8F2F2]">
  <span>{t('الإجمالي المطلوب دَفعه', 'Payable Amount')}:</span>
  <span className="text-[#6CC6C9]">{formatPrice(finalPayableTotal)}</span>
  </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-4 rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-2xl shadow-[#0E5257]/40 cursor-pointer flex items-center justify-center gap-2"
 >
 <Lock className="w-4 h-4" />
 <span>{isSubmitting ? t('جاري تأكيد الشراء...', 'Processing Order...') : t('تأكيد الطلب والدفع الآن', 'Place & Confirm Order')}</span>
 </button>

 <div className="text-[10px] text-[#6B8C8E] text-center space-y-1">
 <p className="flex items-center justify-center gap-1">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
 <span>{t('دفع آمن ومضمون بمعايير PCI-DSS العالمية', 'PCI-DSS Compliant Secure Payment')}</span>
 </p>
 <p>{t('سجل تجاري رقم: 1010892341 - ضريبة: 310928374800003', 'CR: 1010892341 | VAT: 310928374800003')}</p>
 </div>

 </div>
 </div>

 </form>

 {/* Payment Modal */}
 {pendingOrder && isStripeMethod && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
 <div className="w-full max-w-md rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] p-6 shadow-2xl">
 <h3 className="font-extrabold text-[#1A2E30] text-base mb-1 flex items-center gap-2">
 <CreditCard className="w-5 h-5 text-[#6CC6C9]" />
 <span>{t('إتمام الدفع الآمن', 'Complete Secure Payment')}</span>
 </h3>
 <p className="text-xs text-[#4A6869] mb-5">
 {t('سيتم تأكيد طلبك تلقائياً بعد نجاح الدفع.', 'Your order will be confirmed automatically once payment succeeds.')}
 {' · '}{t('المبلغ', 'Amount')}: <span className="text-[#6CC6C9] font-extrabold">{formatPrice(finalPayableTotal)}</span>
 </p>

 {paymentBusy ? (
 <div className="py-10 text-center text-xs text-[#6B8C8E]">
 {t('جاري تجهيز نموذج الدفع...', 'Preparing payment form...')}
 </div>
 ) : paymentError ? (
 <div className="space-y-4">
 <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{paymentError}</p>
 <button
 onClick={() => { setPaymentError(''); setPaymentMode(null); setClientSecret(''); setPendingOrder(null); }}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer"
 >
 {t('إعادة المحاولة', 'Retry')}
 </button>
 <button
 onClick={handlePaymentCancel}
 className="w-full text-[#6B8C8E] hover:text-[#6CC6C9] py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
 >
 {t('إلغاء الدفع (لن يتم إنشاء الطلب)', 'Cancel payment (no order will be created)')}
 </button>
 </div>
  ) : clientSecret ? (
  <StripePaymentSection
  publishableKey={publishableKey}
  clientSecret={clientSecret}
  paymentIntentId={paymentIntentId}
  customerName={customerName}
  email={email}
  phone={phone}
  onSuccess={handlePaymentSuccess}
  onCancel={handlePaymentCancel}
  />
  ) : paymentMode === 'sandbox' ? (
 <div className="space-y-4">
 <div className="bg-[#FFFFFF] border border-[#E8F2F2] rounded-2xl p-4 text-xs text-[#4A6869] space-y-2">
 <p className="font-bold text-[#6CC6C9]">{t('وضع تجريبي (Sandbox)', 'Sandbox mode')}</p>
  <p>
  {t(
  'السيرفر في الوضع التجريبي: هذا الزر ينشئ طلباً حقيقياً (تجريبي) بدون خصم من البطاقة. الدفع الحقيقي بالبطاقة يتفعّل تلقائياً عندما يتحول السيرفر للوضع الحي.',
  'Server is in test mode: this button creates a real (test) order without charging the card. Live card payments activate automatically once the server switches to live mode.'
  )}
  </p>
 </div>
 <button
 onClick={handleSandboxPay}
 disabled={paymentBusy}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2"
 >
 <Lock className="w-4 h-4" />
 <span>{paymentBusy ? t('جاري التأكيد...', 'Confirming...') : t('إتمام الدفع (محاكاة)', 'Complete Payment (Simulated)')}</span>
 </button>
 <button
 onClick={handlePaymentCancel}
 className="w-full text-[#6B8C8E] hover:text-[#6CC6C9] py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
 >
 {t('إلغاء', 'Cancel')}
 </button>
 </div>
 ) : null}
 </div>
 </div>
 )}

 </div>
 </div>
 );
};

export default CheckoutPage;
