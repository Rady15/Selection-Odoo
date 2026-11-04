import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { usePolling } from '../hooks/usePolling';
import { Order, Product, Address, Review, OrderItem } from '../types';
import ProductGrid from '../components/storefront/ProductGrid';
import LoginGate from '../components/storefront/LoginGate';
import {
 User,
 Package,
 Heart,
 MapPin,
 LogOut,
 Calendar,
 CheckCircle,
 Clock,
 Truck,
 Plus,
 Minus,
 Pencil,
 Trash2,
 Star,
 Save,
 Send,
 X
} from 'lucide-react';

interface CustomerAccountPageProps {
 onNavigate: (path: string) => void;
}

const EMPTY_ADDRESS: Omit<Address, 'id'> = {
 title: '',
 full_name: '',
 phone: '',
 country: 'SA',
 city: '',
 district: '',
 street: '',
 building: '',
 postal_code: '',
 is_default: false
};

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({ onNavigate }) => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();
 const { user, logout, updateUserInState } = useAuth();
 const isAdmin = user?.role === 'admin';
 const { wishlistIds } = useWishlist();

 const initialTab = (() => {
 const tab = new URLSearchParams(window.location.search).get('tab');
 if (tab === 'wishlist' || tab === 'loyalty' || tab === 'profile' || tab === 'addresses' || tab === 'reviews') return tab;
 return 'orders';
 })() as 'orders' | 'wishlist' | 'loyalty' | 'profile' | 'addresses' | 'reviews';

 const [activeTab, setActiveTab] = useState<typeof initialTab>(initialTab);
 const [orders, setOrders] = useState<Order[]>([]);
 const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
 const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([]);
 const [userReviews, setUserReviews] = useState<Review[]>([]);
 const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; title: string; comment: string }>>({});
 const [reviewSubmitting, setReviewSubmitting] = useState<string | null>(null);

 // Profile tab state
 const [profileName, setProfileName] = useState(user?.name || '');
 const [profileEmail, setProfileEmail] = useState(user?.email || '');
 const [profilePhone, setProfilePhone] = useState(user?.phone || '');
 const [profileSaving, setProfileSaving] = useState(false);
 const [profileSuccess, setProfileSuccess] = useState(false);

 // Addresses tab state
 const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
 const [addressFormOpen, setAddressFormOpen] = useState(false);
 const [editingAddress, setEditingAddress] = useState<Address | null>(null);
 const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>(EMPTY_ADDRESS);
 const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
 const [addressSaving, setAddressSaving] = useState(false);

 useEffect(() => {
 if (user) {
 setProfileName(user.name);
 setProfileEmail(user.email);
 setProfilePhone(user.phone);
 setAddresses(user.addresses || []);
 }
 }, [user]);

 // Admins get their own dashboard; send them there from the account page.
 useEffect(() => {
 if (user && isAdmin) {
 onNavigate('/admin');
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.id, isAdmin]);

 const loadOrders = useCallback(() => {
 if (!user) return;
  fetch(`/api/orders?user_id=${user.id}`)
  .then(res => res.json())
  .then(data => setOrders(prev => {
  const list = Array.isArray(data) ? data : [];
  if (prev.length === list.length && JSON.stringify(prev) === JSON.stringify(list)) return prev;
  return list;
  }))
 .catch(err => console.error(err));
 }, [user]);

 // Refresh the user's orders in real time so status changes show instantly.
 usePolling(loadOrders, 3000, !!user);

 useEffect(() => {
 if (wishlistIds.length > 0) {
 fetch('/api/products')
 .then(res => res.json())
 .then(prods => setWishlistProducts(prods.filter((p: Product) => wishlistIds.includes(p.id))))
 .catch(err => console.error(err));
 } else {
 setWishlistProducts([]);
 }
 }, [wishlistIds]);

 useEffect(() => {
 if (user) {
 fetch('/api/me')
 .then(r => r.json())
 .then(data => setLoyaltyTransactions(data.transactions || []))
 .catch(err => console.error(err));
 }
 }, [user]);

 // Refresh the user record (loyalty balance, addresses) from the server so
 // points earned/redeemed in recent orders show immediately.
 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 fetch(`/api/users/${user.id}`)
 .then(res => (res.ok ? res.json() : null))
 .then(fresh => {
 if (!cancelled && fresh && user) {
 updateUserInState({ ...user, ...fresh });
 }
 })
 .catch(err => console.error(err));
 return () => { cancelled = true; };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.id]);

 useEffect(() => {
 if (user) {
 fetch('/api/me')
 .then(res => res.json())
 .then(data => setUserReviews(data.reviews || []))
 .catch(err => console.error(err));
 }
 }, [user]);

 const reviewedProductIds = new Set(userReviews.map(r => r.product_id));
  const eligibleItems = orders
  .filter(o => o.status === 'delivered')
  .flatMap(o => o.items || [])
 .filter(i => !reviewedProductIds.has(i.product_id))
 .filter((item, idx, arr) => arr.findIndex(x => x.product_id === item.product_id) === idx);

 const submitProductReview = async (item: OrderItem) => {
 const draft = reviewDrafts[item.product_id];
 if (!draft || !draft.comment.trim() || !draft.rating) return;
 setReviewSubmitting(item.product_id);
 try {
 const res = await fetch('/api/reviews', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 product_id: item.product_id,
 user_id: user?.id,
 customer_name: user?.name,
 rating: draft.rating,
 title: draft.title,
 comment: draft.comment,
 verified_purchase: true
 })
 });
 if (res.ok && user) {
 const data = await fetch('/api/me').then(r => r.json());
 setUserReviews(data.reviews || []);
 setReviewDrafts(prev => ({ ...prev, [item.product_id]: { rating: 5, title: '', comment: '' } }));
 }
 } catch (err) {
 console.error(err);
 } finally {
 setReviewSubmitting(null);
 }
 };

const [profileError, setProfileError] = useState<string>('');
const [addressError, setAddressError] = useState<string>('');

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileSuccess(false);
    setProfileError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, email: profileEmail, phone: profilePhone })
      });
      const data = await res.json();
      if (res.ok) {
        updateUserInState({ ...user, ...data.user });
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(data.error_ar || data.error_en || t('فشل حفظ الملف الشخصي', 'Failed to save profile'));
      }
    } catch (err: any) {
      setProfileError(err.message || t('خطأ بالاتصال بالسيرفر', 'Server error'));
    } finally {
      setProfileSaving(false);
    }
  };

  const saveAddresses = async (updated: Address[]) => {
    if (!user) return;
    setAddressSaving(true);
    setAddressError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: updated })
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.user?.addresses || updated);
        updateUserInState({ ...user, addresses: data.user?.addresses || updated });
      } else {
        setAddressError(data.error_ar || data.error_en || t('فشل حفظ العناوين', 'Failed to save addresses'));
      }
    } catch (err: any) {
      setAddressError(err.message || t('خطأ بالاتصال بالسيرفر', 'Server error'));
    } finally {
      setAddressSaving(false);
    }
  };

 const handleSaveAddress = () => {
 let updated: Address[];
 if (editingAddress) {
 updated = addresses.map(a => a.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } as Address : a);
 } else {
 const newAddr: Address = { ...addressForm, id: `addr_${Date.now()}` } as Address;
 updated = [...addresses, newAddr];
 }
 if (addressForm.is_default) {
 updated = updated.map(a => ({ ...a, is_default: a.id === (editingAddress?.id || updated[updated.length - 1].id) }));
 }
 saveAddresses(updated);
 setAddressFormOpen(false);
 setEditingAddress(null);
 setAddressForm(EMPTY_ADDRESS);
 };

 const handleDeleteAddress = (id: string) => {
 const updated = addresses.filter(a => a.id !== id);
 saveAddresses(updated);
 setDeleteConfirmId(null);
 };

 const handleSetDefault = (id: string) => {
 const updated = addresses.map(a => ({ ...a, is_default: a.id === id }));
 saveAddresses(updated);
 };

 const openEditAddress = (addr: Address) => {
 setEditingAddress(addr);
 setAddressForm({
 title: addr.title,
 full_name: addr.full_name,
 phone: addr.phone,
 country: addr.country,
 city: addr.city,
 district: addr.district,
 street: addr.street,
 building: addr.building || '',
 postal_code: addr.postal_code || '',
 delivery_notes: addr.delivery_notes || '',
 is_default: addr.is_default
 });
 setAddressFormOpen(true);
 };

 if (user && isAdmin) {
 return (
 <div className="min-h-[70vh] flex items-center justify-center text-sm text-[#6B8C8E]">
 {t('جاري التحويل إلى لوحة التحكم...', 'Redirecting to admin dashboard...')}
 </div>
 );
 }

 if (!user) {
 return <LoginGate onNavigate={onNavigate}>{null}</LoginGate>;
 }

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

 {/* Profile Welcome Header */}
 <div className="p-8 rounded-3xl bg-gradient-to-r from-[#F0FAFA] via-[#E8F2F2] to-[#F0FAFA] border border-[#E8F2F2] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-2xl bg-[#0E5257] text-white font-extrabold text-2xl flex items-center justify-center shadow-xl">
 {user.name.charAt(0)}
 </div>
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('أهلاً بك،', 'Welcome,')} {user.name}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{user.email} • {user.phone}</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="p-3 rounded-2xl bg-[#0E5257]/20 border border-[#0E5257]/40 text-center">
 <span className="text-[10px] text-[#6B8C8E] block">{t('رصيد نقاط سليكشن', 'Loyalty Points')}</span>
 <span className="font-extrabold text-lg text-[#6CC6C9]">{user.loyalty_points} {t('نقطة', 'pts')}</span>
 </div>

 <button
 onClick={() => {
 logout();
 onNavigate('/');
 }}
 className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2] text-red-400 hover:bg-red-500/10 transition cursor-pointer"
 title={t('تسجيل الخروج', 'Logout')}
 >
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Tab Navigation */}
 <div className="flex border-b border-[#E8F2F2] gap-6 text-sm font-bold overflow-x-auto">
 <button
 onClick={() => setActiveTab('orders')}
 className={`pb-3 transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-[#6CC6C9] text-[#6CC6C9]' : 'border-transparent text-[#6B8C8E] hover:text-[#6CC6C9]'
 }`}
 >
 <Package className="w-4 h-4" />
 <span>{t('طلباتي الأخيرة', 'My Orders')}</span>
 </button>

 <button
 onClick={() => setActiveTab('wishlist')}
 className={`pb-3 transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'wishlist' ? 'border-[#6CC6C9] text-[#6CC6C9]' : 'border-transparent text-[#6B8C8E] hover:text-[#6CC6C9]'
 }`}
 >
 <Heart className="w-4 h-4" />
 <span>{t('المفضلة', 'Wishlist')} ({wishlistIds.length})</span>
 </button>

 <button
 onClick={() => setActiveTab('loyalty')}
 className={`pb-3 transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'loyalty' ? 'border-[#6CC6C9] text-[#6CC6C9]' : 'border-transparent text-[#6B8C8E] hover:text-[#6CC6C9]'
 }`}
 >
 <span>{t('برنامج الولاء والخصومات', 'Loyalty Rewards')}</span>
 </button>

 <button
 onClick={() => setActiveTab('profile')}
 className={`pb-3 transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-[#6CC6C9] text-[#6CC6C9]' : 'border-transparent text-[#6B8C8E] hover:text-[#6CC6C9]'
 }`}
 >
 <User className="w-4 h-4" />
 <span>{t('الملف الشخصي', 'Profile')}</span>
 </button>

 <button
 onClick={() => setActiveTab('addresses')}
 className={`pb-3 transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'addresses' ? 'border-[#6CC6C9] text-[#6CC6C9]' : 'border-transparent text-[#6B8C8E] hover:text-[#6CC6C9]'
 }`}
 >
 <MapPin className="w-4 h-4" />
 <span>{t('العناوين', 'Addresses')}</span>
 </button>

 <button
 onClick={() => setActiveTab('reviews')}
 className={`pb-3 transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'reviews' ? 'border-[#6CC6C9] text-[#6CC6C9]' : 'border-transparent text-[#6B8C8E] hover:text-[#6CC6C9]'
 }`}
 >
 <Star className="w-4 h-4" />
 <span>{t('التقييمات', 'My Reviews')}</span>
 </button>
 </div>

 {/* Tab Content: Orders */}
 {activeTab === 'orders' && (
 <div className="space-y-4">
 {orders.length === 0 ? (
 <p className="text-xs text-[#6B8C8E] text-center py-12">{t('لا توجد طلبات سابقة معالجة حتى الآن.', 'No past orders yet.')}</p>
 ) : (
 orders.map(ord => (
 <div key={ord.id} className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E8F2F2] pb-3 gap-2">
 <div>
 <span className="font-extrabold text-sm text-[#6CC6C9]">{ord.order_number}</span>
 <span className="text-xs text-[#6B8C8E] block">
 {new Date(ord.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className={`text-xs font-bold px-3 py-1 rounded-full ${
 ord.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
 ord.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
 ord.status === 'roasting' ? 'bg-amber-500/20 text-amber-400' :
 ord.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
 ord.status === 'paid' || (ord.payment_status === 'paid' && ord.status === 'pending') ? 'bg-purple-500/20 text-purple-400' :
 'bg-[#0E5257]/20 text-[#6CC6C9]'
 }`}>
 {language === 'ar' ? ({
 pending: 'معلق', paid: 'تم الإنشاء', roasting: 'قيد التحميص',
 shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي'
 } as Record<string, string>)[ord.payment_status === 'paid' && ord.status === 'pending' ? 'paid' : ord.status] || ord.status
 : (ord.payment_status === 'paid' && ord.status === 'pending' ? 'Created' : ord.status)}
 </span>
 {ord.tracking_number && (
 <a
 href={ord.tracking_url || `https://www.smsaexpress.com/tracking/${ord.tracking_number}`}
 target="_blank"
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className="flex items-center gap-1 text-[10px] text-[#6CC6C9] hover:underline cursor-pointer"
 >
 <Truck className="w-3 h-3" />
 {t('تتبع', 'Track')}
 </a>
 )}
 </div>
 </div>

  <div className="space-y-2">
  {(ord.items || []).map((i: any, idx) => (
 <div key={idx} className="flex justify-between text-xs text-[#4A6869]">
 <span>{i.quantity}x {language === 'ar' ? (i.product_name_ar || i.name_ar) : (i.product_name_en || i.name_en)}{i.weight ? ` (${i.weight})` : ''}</span>
 <span className="font-bold text-[#1A2E30]">{formatPrice(typeof i.total_price === 'number' ? i.total_price : i.price)}</span>
 </div>
 ))}
 </div>

 <div className="flex justify-between items-center pt-3 border-t border-[#E8F2F2]">
  <span className="text-xs text-[#6B8C8E]">{t('الإجمالي:', 'Total:')} <strong className="text-[#1A2E30] text-sm font-extrabold">{formatPrice(ord.total_amount)}</strong></span>
 <button
 onClick={() => onNavigate(`/track-order/${encodeURIComponent(ord.order_number)}`)}
 className="text-xs text-[#6CC6C9] hover:underline cursor-pointer"
 >
 {t('تتبع وحالة الشحنة ←', 'Track Shipment →')}
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {/* Tab Content: Wishlist */}
 {activeTab === 'wishlist' && (
 <ProductGrid products={wishlistProducts} onNavigate={onNavigate} />
 )}

 {/* Tab Content: Loyalty Hub (Enhanced) */}
 {activeTab === 'loyalty' && (
 <div className="space-y-6">
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 text-center max-w-xl mx-auto">
 <div className="w-16 h-16 rounded-full bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center mx-auto">
 </div>

 <h3 className="font-extrabold text-xl text-[#1A2E30] font-serif">{t('نادي سليكشن للولاء والمكافآت', 'Selection Rewards Club')}</h3>
 <p className="text-xs text-[#4A6869] leading-relaxed">
 {t('تكسب 1 نقطة مقابل كل 1 ﷼ تنفقه في شراء محاصيل القهوة. استبدل نقاطك بكوبونات خصم أو شحن مجاني عند السلة.', 'Earn 1 point for every 1 SAR spent. Redeem points for discount coupons at checkout.')}
 </p>

 <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2]">
 <span className="text-xs text-[#6B8C8E] block">{t('نقاطك القابلة للاستبدال', 'Redeemable Points')}</span>
 <span className="text-3xl font-extrabold text-[#6CC6C9]">{user.loyalty_points} {t('نقطة', 'pts')}</span>
 </div>
 </div>

 {/* Earning & Redemption Rates */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
 <div className="p-5 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2">
 <div className="flex items-center gap-2">
 <Star className="w-4 h-4 text-yellow-500" />
 <span className="text-xs font-bold text-[#1A2E30]">{t('كيف تكسب النقاط', 'How to Earn')}</span>
 </div>
 <p className="text-xs text-[#6B8C8E] leading-relaxed">
 {t('1 نقطة لكل 1 ﷼ من المشتريات', '1 point per 1 SAR spent')}
 </p>
 </div>

 <div className="p-5 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-[#1A2E30]">{t('معدل الاستبدال', 'Redemption Rate')}</span>
 </div>
 <p className="text-xs text-[#6B8C8E] leading-relaxed">
 {t('20 نقطة = 1 ﷼', '20 points = 1 SAR')}
 </p>
 </div>
 </div>

 {/* Recent Points Activity */}
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] max-w-xl mx-auto space-y-4">
 <h4 className="text-sm font-extrabold text-[#1A2E30]">{t('آخر حركة نقاط', 'Recent Points Activity')}</h4>
 {loyaltyTransactions.length > 0 ? (
 <div className="space-y-3 max-h-80 overflow-y-auto">
 {loyaltyTransactions.map((tx: any) => (
 <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2]">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'earned' ? 'bg-emerald-500/20' :
 tx.type === 'redeemed' ? 'bg-red-500/20' :
 'bg-[#6CC6C9]/20'
 }`}>
 {tx.type === 'earned' ? <Plus className="w-4 h-4 text-emerald-400" /> :
 tx.type === 'redeemed' ? <Minus className="w-4 h-4 text-red-400" /> : <Pencil className="w-4 h-4 text-[#6CC6C9]" />}
 </div>
 <div>
 <span className="text-xs font-bold text-[#1A2E30] block">
 {language === 'ar' ? tx.description_ar : tx.description_en}
 </span>
 <span className="text-[10px] text-[#6B8C8E]">{new Date(tx.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
 </div>
 </div>
 <span className={`text-sm font-extrabold ${tx.type === 'earned' ? 'text-emerald-400' :
 tx.type === 'redeemed' ? 'text-red-400' :
 'text-[#6CC6C9]'
 }`}>
 {tx.type === 'redeemed' ? '-' : '+'}{tx.points} {t('نقطة', 'pts')}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-[#6B8C8E] text-center py-6">
 {t('ابدأ التسوق لكسب نقاط الولاء', 'Start shopping to earn loyalty points')}
 </p>
 )}
 </div>
 </div>
 )}

 {/* Tab Content: Profile Editing */}
 {activeTab === 'profile' && (
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] max-w-xl mx-auto space-y-6">
 <h3 className="font-extrabold text-lg text-[#1A2E30] font-serif">{t('الملف الشخصي', 'Profile Information')}</h3>

 {profileError && (
  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{profileError}</div>
)}
{addressError && (
  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{addressError}</div>
)}

{profileSuccess && (
 <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-emerald-400" />
 <span className="text-xs font-bold text-emerald-400">{t('تم حفظ التغييرات بنجاح', 'Changes saved successfully')}</span>
 </div>
 )}

 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-[#6B8C8E]">{t('الاسم الكامل', 'Full Name')}</label>
 <input
 type="text"
 value={profileName}
 onChange={e => setProfileName(e.target.value)}
 className="w-full p-3 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] text-[#1A2E30] text-sm focus:border-[#6CC6C9] focus:outline-none transition"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-[#6B8C8E]">{t('البريد الإلكتروني', 'Email')}</label>
 <input
 type="email"
 value={profileEmail}
 onChange={e => setProfileEmail(e.target.value)}
 className="w-full p-3 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] text-[#1A2E30] text-sm focus:border-[#6CC6C9] focus:outline-none transition"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-[#6B8C8E]">{t('رقم الهاتف', 'Phone Number')}</label>
 <input
 type="tel"
 value={profilePhone}
 onChange={e => setProfilePhone(e.target.value)}
 className="w-full p-3 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] text-[#1A2E30] text-sm focus:border-[#6CC6C9] focus:outline-none transition"
 />
 </div>
 </div>

 <button
 onClick={saveProfile}
 disabled={profileSaving}
 className="w-full py-3 rounded-xl bg-[#0E5257] hover:bg-[#6CC6C9] text-white text-sm font-bold transition cursor-pointer disabled:opacity-50"
 >
 {profileSaving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}
 </button>
 </div>
 )}

 {/* Tab Content: Reviews */}
 {activeTab === 'reviews' && (
 <div className="space-y-6">
 {eligibleItems.length > 0 && (
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <div>
 <h3 className="font-extrabold text-lg text-[#1A2E30] font-serif">{t('قيّم منتجاتك بعد الاستلام', 'Review Your Delivered Orders')}</h3>
 <p className="text-xs text-[#6B8C8E] mt-1">
 {t('شارك تجربتك مع المحاصيل التي استلمتها، ستظهر تقييماتك مباشرة في صفحة المنتج.', 'Share your experience with the crops you received. Your review will appear on the product page instantly.')}
 </p>
 </div>

 <div className="space-y-4">
 {eligibleItems.map(item => {
 const draft = reviewDrafts[item.product_id] || { rating: 5, title: '', comment: '' };
 return (
 <div key={item.product_id} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2] space-y-3">
 <div className="flex items-center gap-3">
 {item.image && (
 <img
 src={item.image}
 alt=""
 className="w-14 h-14 rounded-xl object-cover border border-[#E8F2F2]"
 />
 )}
 <div className="flex-1">
 <p className="text-sm font-bold text-[#1A2E30]">{language === 'ar' ? (item.product_name_ar || item.name_ar) : (item.product_name_en || item.name_en)}</p>
 <p className="text-[10px] text-[#6B8C8E]">{item.weight ? `${item.weight} • ` : ''}{item.quantity}x</p>
 </div>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
 {t('مستلمة', 'Delivered')}
 </span>
 </div>

 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map(s => (
 <button
 key={s}
 type="button"
 onClick={() => setReviewDrafts(prev => ({ ...prev, [item.product_id]: { ...draft, rating: s } }))}
 className="cursor-pointer"
 >
 <Star className={`w-6 h-6 ${s <= draft.rating ? 'text-yellow-500 fill-yellow-500' : 'text-[#E8F2F2]'}`} />
 </button>
 ))}
 <span className="text-[10px] text-[#6B8C8E] ms-2">{draft.rating}/5</span>
 </div>

 <input
 type="text"
 value={draft.title}
 onChange={e => setReviewDrafts(prev => ({ ...prev, [item.product_id]: { ...draft, title: e.target.value } }))}
 placeholder={t('عنوان التقييم (اختياري)', 'Review title (optional)')}
 className="w-full p-2.5 rounded-xl focus:border-[#6CC6C9] focus:outline-none transition"
 />

 <textarea
 rows={2}
 value={draft.comment}
 onChange={e => setReviewDrafts(prev => ({ ...prev, [item.product_id]: { ...draft, comment: e.target.value } }))}
 placeholder={t('اكتب ملاحظاتك عن النكهة وطريقة التحضير...', 'Write your notes on flavor and brewing method...')}
 className="w-full p-2.5 rounded-xl focus:border-[#6CC6C9] focus:outline-none transition"
 />

 <button
 onClick={() => submitProductReview(item)}
 disabled={reviewSubmitting === item.product_id || !draft.comment.trim()}
 className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0E5257] hover:bg-[#6CC6C9] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
 >
 <Send className="w-3.5 h-3.5" />
 <span>{reviewSubmitting === item.product_id ? t('جاري النشر...', 'Publishing...') : t('نشر التقييم', 'Publish Review')}</span>
 </button>
 </div>
 );
 })}
 </div>
 </div>
 )}

 <div>
 <h3 className="font-extrabold text-lg text-[#1A2E30] font-serif mb-4">{t('تقييماتي', 'My Reviews')}</h3>
 {userReviews.length === 0 ? (
 <p className="text-xs text-[#6B8C8E] text-center py-12">{t('لا توجد تقييمات بعد', 'No reviews yet')}</p>
 ) : (
 userReviews.map(rev => (
 <div key={rev.id} className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map(s => (
 <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'text-yellow-500 fill-yellow-500' : 'text-[#E8F2F2]'}`} />
 ))}
 </div>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rev.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
 rev.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
 'bg-red-500/20 text-red-400'
 }`}>
 {rev.status}
 </span>
 </div>
 <div>
 <p className="text-sm font-bold text-[#1A2E30]">{rev.title}</p>
 <p className="text-xs text-[#4A6869] mt-1">{rev.comment}</p>
 </div>
 <div className="flex items-center justify-between text-[10px] text-[#6B8C8E]">
 <span>{new Date(rev.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
 {rev.verified_purchase && (
 <span className="text-emerald-400 font-bold">{t('مشتريات مؤكدة', 'Verified Purchase')}</span>
 )}
 </div>
 {rev.staff_reply_ar && (
 <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] text-xs text-[#4A6869]">
 <span className="font-bold text-[#6CC6C9] block mb-1">{t('رد الإدارة:', 'Staff Reply:')}</span>
 {language === 'ar' ? rev.staff_reply_ar : rev.staff_reply_en}
 </div>
 )}
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {/* Tab Content: Address Management */}
 {activeTab === 'addresses' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-extrabold text-lg text-[#1A2E30] font-serif">{t('عناويني', 'My Addresses')}</h3>
 <button
 onClick={() => { setEditingAddress(null); setAddressForm(EMPTY_ADDRESS); setAddressFormOpen(true); }}
 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E5257] hover:bg-[#6CC6C9] text-white text-xs font-bold transition cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 {t('إضافة عنوان', 'Add Address')}
 </button>
 </div>

 {addresses.length === 0 ? (
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] text-center">
 <MapPin className="w-12 h-12 text-[#0E5257] mx-auto mb-3" />
 <p className="text-xs text-[#6B8C8E]">{t('لا توجد عناوين محفوظة بعد', 'No saved addresses yet')}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {addresses.map(addr => (
 <div key={addr.id} className={`p-5 rounded-2xl bg-[#F0FAFA] border space-y-3 ${addr.is_default ? 'border-[#6CC6C9]' : 'border-[#E8F2F2]'}`}>
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <span className="text-sm font-extrabold text-[#1A2E30]">{addr.title}</span>
 {addr.is_default && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6CC6C9]/20 text-[#6CC6C9]">{t('افتراضي', 'Default')}</span>
 )}
 </div>
 </div>

 <div className="space-y-1 text-xs text-[#6B8C8E]">
 <p className="text-[#4A6869]">{addr.full_name}</p>
 <p>{addr.phone}</p>
 <p>{addr.city} - {addr.district}</p>
 <p>{addr.street}{addr.building ? `, ${t('مبنى', 'Bldg')} ${addr.building}` : ''}</p>
 {addr.postal_code && <p>{t('الرمز البريدي:', 'Postal:')} {addr.postal_code}</p>}
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-[#E8F2F2]">
 {!addr.is_default && (
 <button
 onClick={() => handleSetDefault(addr.id)}
 className="text-[10px] text-[#6CC6C9] hover:underline cursor-pointer font-bold"
 >
 {t('تعيين كافتراضي', 'Set Default')}
 </button>
 )}
 <button
 onClick={() => openEditAddress(addr)}
 className="p-1.5 rounded-lg transition cursor-pointer"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>
 {deleteConfirmId === addr.id ? (
 <div className="flex items-center gap-1 ml-auto">
 <button
 onClick={() => handleDeleteAddress(addr.id)}
 className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
 >
 {t('تأكيد', 'Confirm')}
 </button>
 <button
 onClick={() => setDeleteConfirmId(null)}
 className="text-[10px] font-bold text-[#6B8C8E] hover:text-[#6CC6C9] cursor-pointer"
 >
 {t('إلغاء', 'Cancel')}
 </button>
 </div>
 ) : (
 <button
 onClick={() => setDeleteConfirmId(addr.id)}
 className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E8F2F2] text-red-400 hover:bg-red-500/10 transition cursor-pointer ml-auto"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Address Form Modal */}
 {addressFormOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
 <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] p-6 space-y-5">
 <div className="flex items-center justify-between">
 <h3 className="font-extrabold text-lg text-[#1A2E30] font-serif">
 {editingAddress ? t('تعديل العنوان', 'Edit Address') : t('إضافة عنوان جديد', 'Add New Address')}
 </h3>
 <button
 onClick={() => { setAddressFormOpen(false); setEditingAddress(null); }}
 className="p-2 rounded-xl transition cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="space-y-4">
 {[
 { key: 'title', label: t('عنوان العنوان', 'Address Title'), type: 'text' },
 { key: 'full_name', label: t('الاسم الكامل', 'Full Name'), type: 'text' },
 { key: 'phone', label: t('رقم الهاتف', 'Phone'), type: 'tel' },
 { key: 'city', label: t('المدينة', 'City'), type: 'text' },
 { key: 'district', label: t('الحي', 'District'), type: 'text' },
 { key: 'street', label: t('الشارع', 'Street'), type: 'text' },
 { key: 'building', label: t('رقم المبنى', 'Building No.'), type: 'text' },
 { key: 'postal_code', label: t('الرمز البريدي', 'Postal Code'), type: 'text' }
 ].map(field => (
 <div key={field.key} className="space-y-1.5">
 <label className="text-xs font-bold text-[#6B8C8E]">{field.label}</label>
 <input
 type={field.type}
 value={(addressForm as any)[field.key] || ''}
 onChange={e => setAddressForm(prev => ({ ...prev, [field.key]: e.target.value }))}
 className="w-full p-3 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] text-[#1A2E30] text-sm focus:border-[#6CC6C9] focus:outline-none transition"
 />
 </div>
 ))}

 <label className="flex items-center gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={addressForm.is_default}
 onChange={e => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
 className="w-4 h-4 accent-[#6CC6C9] rounded"
 />
 <span className="text-xs font-bold text-[#6B8C8E]">{t('تعيين كعنوان افتراضي', 'Set as default address')}</span>
 </label>
 </div>

 <button
 onClick={handleSaveAddress}
 disabled={addressSaving || !addressForm.title || !addressForm.full_name || !addressForm.city}
 className="w-full py-3 rounded-xl bg-[#0E5257] hover:bg-[#6CC6C9] text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
 >
 <Save className="w-4 h-4" />
 {addressSaving ? t('جاري الحفظ...', 'Saving...') : t('حفظ العنوان', 'Save Address')}
 </button>
 </div>
 </div>
 )}
 </div>
 )}

 </div>
 </div>
 );
};

export default CustomerAccountPage;
