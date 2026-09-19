import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, GrindType, Coupon } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedWeight: string, selectedGrind: GrindType, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discountAmount: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isFreeShippingEligible: boolean;
  totalItemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  loyaltyPointsToRedeem: number;
  setLoyaltyPointsToRedeem: (pts: number) => void;
  loyaltyDiscountSAR: number;
  taxAmount: number; // 15% VAT included/itemized
  totalAmount: number;
  getStoreSettings: () => any;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [items, setItems] = useState<CartItem[]>(() => {
 try {
 const saved = localStorage.getItem('fursan_cart');
 if (!saved) return [];
 const parsed = JSON.parse(saved);
 if (!Array.isArray(parsed)) return [];
 // Sanitize legacy/stale entries: any item whose unit price or quantity
 // is not a valid positive number would otherwise render as NaN.
 return parsed.filter((it: any) => {
 const unit = Number(it?.unit_price);
 const qty = Number(it?.quantity);
 return Number.isFinite(unit) && Number.isFinite(qty) && unit > 0 && qty > 0;
 });
 } catch {
 return [];
 }
 });

 const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
 const [discountAmount, setDiscountAmount] = useState<number>(0);
 const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
 const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
 const [storeSettings, setStoreSettings] = useState<any>(null);

 useEffect(() => { fetch('/api/public/settings').then(r => r.ok ? r.json() : null).then(setStoreSettings).catch(() => {}); }, []);

 const freeShippingThreshold = Number(storeSettings?.free_shipping_threshold ?? 199);
 const loyaltySarPerPoint = Number(storeSettings?.sar_per_point ?? 0.05) || 0.05;
 const vatRate = Number(storeSettings?.vat_rate ?? 0.15);

  useEffect(() => {
    try {
      localStorage.setItem('fursan_cart', JSON.stringify(items));
    } catch {
      /* storage unavailable/full — cart still works in-memory for this session */
    }
  }, [items]);

 const addToCart = (product: Product, selectedWeight: string, selectedGrind: GrindType, quantity = 1) => {
 const weightOpt = product.weight_options?.find(w => w.value === selectedWeight) || product.weight_options?.[0];
 const basePrice = Number(product.sale_price ?? product.price) || 0;
 const modifier = Number(weightOpt?.priceModifier) || 0;
 const unitPrice = basePrice + modifier;

 const itemId = `${product.id}_${selectedWeight}_${selectedGrind}`;

 setItems(prev => {
 const existing = prev.find(i => i.id === itemId);
 if (existing) {
 return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
 } else {
 return [...prev, {
 id: itemId,
 product_id: product.id,
 product,
 selected_weight: selectedWeight,
 selected_grind: selectedGrind,
 quantity,
 unit_price: unitPrice
 }];
 }
 });

 setIsCartOpen(true);
 };

 const removeFromCart = (id: string) => {
 setItems(prev => prev.filter(i => i.id !== id));
 };

 const updateQuantity = (id: string, quantity: number) => {
 if (quantity <= 0) {
 removeFromCart(id);
 return;
 }
 setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
 };

 const clearCart = () => {
 setItems([]);
 setAppliedCoupon(null);
 setDiscountAmount(0);
 setLoyaltyPointsToRedeem(0);
 };

 const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

 const applyCoupon = async (code: string) => {
 try {
 const res = await fetch('/api/coupons/validate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code, subtotal })
 });
 const data = await res.json();
 if (data.valid) {
 setAppliedCoupon(data.coupon);
 setDiscountAmount(data.discountAmount);
 return { success: true, message: 'تم تطبيق كود الخصم بنجاح' };
 } else {
 return { success: false, message: data.message_ar || data.message_en };
 }
 } catch (err) {
 return { success: false, message: 'خطأ في التحقق من الكود' };
 }
 };

 const removeCoupon = () => {
 setAppliedCoupon(null);
 setDiscountAmount(0);
 };

 const loyaltyDiscountSAR = Number((loyaltyPointsToRedeem * loyaltySarPerPoint).toFixed(2));

 const totalDiscount = discountAmount + loyaltyDiscountSAR;
 const isFreeShippingEligible = subtotal >= freeShippingThreshold || appliedCoupon?.discount_type === 'free_shipping';
 const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

 const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
 const taxAmount = parseFloat((subtotalAfterDiscount * vatRate).toFixed(2));
 const totalAmount = parseFloat((subtotalAfterDiscount + taxAmount).toFixed(2));

const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getStoreSettings = () => storeSettings;

  return (
  <CartContext.Provider value={{
  items,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  subtotal,
  discountAmount,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  freeShippingThreshold,
  amountNeededForFreeShipping,
  isFreeShippingEligible,
  totalItemCount,
  isCartOpen,
  openCart: () => setIsCartOpen(true),
  closeCart: () => setIsCartOpen(false),
  loyaltyPointsToRedeem,
  setLoyaltyPointsToRedeem,
  loyaltyDiscountSAR,
  taxAmount,
  totalAmount,
  getStoreSettings
  }}>
  {children}
  </CartContext.Provider>
  );
};

export const useCart = () => {
 const context = useContext(CartContext);
 if (!context) throw new Error('useCart must be used within CartProvider');
 return context;
};
