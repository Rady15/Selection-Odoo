import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
 Coffee,
 Mail,
 Phone,
 MessageCircle,
 MapPin,
 ShieldCheck,
 Truck,
 RotateCcw,
 ArrowLeft,
 ArrowRight,
 Send,
 CheckCircle2
} from 'lucide-react';

interface FooterProps {
 onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
 const { language, t } = useLanguage();
 const [email, setEmail] = useState('');
 const [subscribed, setSubscribed] = useState(false);
 const [settings, setSettings] = useState<any>(null);

 const [subscribeLoading, setSubscribeLoading] = useState(false);

 useEffect(() => {
 fetch('/api/public/settings').then(r => r.json()).then(setSettings).catch(() => { });
 }, []);

 const handleSubscribe = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email.trim() || subscribeLoading) return;
 setSubscribeLoading(true);
 try {
 const res = await fetch('/api/newsletter/subscribe', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: email.trim() })
 });
 if (res.ok) {
 setSubscribed(true);
 setEmail('');
 }
 } catch { }
 setSubscribeLoading(false);
 };

 return (
 <footer className="bg-[#FFFFFF] text-[#1A2E30] border-t border-[#E8F2F2] pt-12 pb-8">

 {/* Top Value Proposition Bar */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-[#E8F2F2]/60">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-start">

 <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2]">
 <div className="w-12 h-12 rounded-xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center flex-shrink-0">
 <Coffee className="w-6 h-6" />
 </div>
 <div>
 <h5 className="font-bold text-sm text-[#1A2E30]">
 {t('قهوة مختصة 100%', '100% Specialty Coffee')}
 </h5>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t('محاصيل فردية المنشأ تقييم 85+ درجة', 'Single origin micro-lots 85+ scored')}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2]">
 <div className="w-12 h-12 rounded-xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center flex-shrink-0">
 <Truck className="w-6 h-6" />
 </div>
 <div>
 <h5 className="font-bold text-sm text-[#1A2E30]">
 {t('شحن سريع لجميع المناطق', 'Fast Express Shipping')}
 </h5>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t('شحن مجاني للطلبات فوق 199 ﷼', 'Free shipping on orders above 199 ﷼')}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2]">
 <div className="w-12 h-12 rounded-xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center flex-shrink-0">
 </div>
 <div>
 <h5 className="font-bold text-sm text-[#1A2E30]">
 {t('تحميص أسبوعي طازج', 'Fresh Weekly Roasts')}
 </h5>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t('نضمن لك القهوة بقمة طزاجتها ونكهتها', 'Guaranteed peak freshness & aroma')}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2]">
 <div className="w-12 h-12 rounded-xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center flex-shrink-0">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h5 className="font-bold text-sm text-[#1A2E30]">
 {t('دفع آمن عبر مدى وفيزا وماستركارد و Apple Pay', 'Secure Payment')}
 </h5>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t('معاملات مشفّرة بمعايير PCI-DSS العالمية', 'Encrypted, PCI-DSS compliant transactions')}
 </p>
 </div>
 </div>

 </div>
 </div>

 {/* Main Footer Content */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

 {/* Col 1 & 2: Roastery Branding & Newsletter */}
 <div className="lg:col-span-2 space-y-4">
 <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
 <img src="/coloredlogo.png" alt="Selection Store" className="h-10 w-auto" />
 </div>

 <p className="text-xs text-[#4A6869] leading-relaxed max-w-sm">
 {t(
 'محمصة سليكشن القهوة المختصة - وجهتك الشغوفة لأجود محاصيل القهوة الفاخرة المجلوبة من أفضل المزارع العالمية والمحمصة بأعلى معايير الحرفية والاتقان.',
 'Selection Specialty Coffee Roasters - Your passionate destination for world-class single-origin coffee crops crafted with meticulous precision.'
 )}
 </p>

 {/* Newsletter Box */}
 <div className="pt-2">
 <h6 className="font-bold text-xs text-[#6CC6C9] mb-2 uppercase tracking-wider">
 {t('اشترك بنشرتنا البريدية واحصل على خصم 10%', 'Subscribe & Get 10% OFF')}
 </h6>

 {subscribed ? (
 <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" />
 <span>{t('شكرًا لاشتراكك! كود الخصم WELCOME10 مفعل بك.', 'Subscribed successfully! Use WELCOME10')}</span>
 </div>
 ) : (
 <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
 <input
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder={t('أدخل بريدك الإلكتروني...', 'Enter your email...')}
 className="w-full placeholder-[#6B8C8E]/50 focus:outline-none focus:border-[#6CC6C9]"
 />
 <button
 type="submit"
 disabled={subscribeLoading}
 className="bg-[#0E5257] hover:bg-[#2B7D82] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
 >
 {subscribeLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
 </button>
 </form>
 )}
 </div>
 </div>

 {/* Col 3: Quick Store Links */}
 <div className="space-y-3">
 <h6 className="font-bold text-sm text-[#1A2E30] border-b border-[#E8F2F2] pb-2">
 {t('المتجر والمنتجات', 'Shop & Catalog')}
 </h6>
 <ul className="space-y-2 text-xs text-[#6B8C8E]">
 <li>
 <button onClick={() => onNavigate('/products?category=coffee-crops')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('محاصيل القهوة المختصة', 'Specialty Coffee Crops')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/products?category=tasting-boxes')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('بوكسات ومجموعات التذوق', 'Tasting Boxes & Sets')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/products?category=drip-bags')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('أظرف القهوة المقطرة', 'Drip Coffee Bags')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/products?category=brewing-equipment')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('أدوات ومعدات التحضير', 'Brewing Equipment & Gear')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/coffee-finder')} className="hover:text-[#6CC6C9] transition cursor-pointer flex items-center gap-1">
 <span>{t('مستشار اختيار القهوة', 'Interactive Coffee Quiz')}</span>
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/brewing-guide')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('دليل ودليل تحضير القهوة', 'Brewing & Ratio Guide')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/subscriptions')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('اشتراكات القهوة الشهرية', 'Coffee Subscriptions')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/gift-cards')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('بطاقات الهدايا الرقمية', 'Digital Gift Cards')}
 </button>
 </li>
 </ul>
 </div>

 {/* Col 4: Corporate & Info */}
 <div className="space-y-3">
 <h6 className="font-bold text-sm text-[#1A2E30] border-b border-[#E8F2F2] pb-2">
 {t('عن سليكشن والخدمات', 'Company & Services')}
 </h6>
 <ul className="space-y-2 text-xs text-[#6B8C8E]">
 <li>
 <button onClick={() => onNavigate('/about')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('عن محمصة سليكشن القهوة', 'About Selection Roasters')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/wholesale')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('طلب مبيعات الجملة والمقاهي', 'Wholesale & B2B Orders')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/locations')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('موقع فرع المحمصة بفرع حطين', 'Our Store & Espresso Bar')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/track-order')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('تتبع الشحنات والطلبات', 'Track Order Status')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/faq')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('الأسئلة الشائعة والمساعدة', 'FAQs & Help Center')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/blog')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('مدونة القهوة وثقافة التحميص', 'Coffee Blog & Guides')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/terms')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('الشروط والأحكام', 'Terms & Conditions')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/privacy')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('سياسة الخصوصية', 'Privacy Policy')}
 </button>
 </li>
 <li>
 <button onClick={() => onNavigate('/shipping-policy')} className="hover:text-[#6CC6C9] transition cursor-pointer">
 {t('سياسة الشحن والاسترجاع', 'Shipping & Refunds')}
 </button>
 </li>
 </ul>
 </div>

 {/* Col 5: Support & Contact */}
 <div className="space-y-3">
 <h6 className="font-bold text-sm text-[#1A2E30] border-b border-[#E8F2F2] pb-2">
 {t('خدمة العملاء والفرع', 'Customer Service & Branch')}
 </h6>
 <div className="space-y-2 text-xs text-[#6B8C8E]">
 <p className="flex items-center gap-2">
 <Phone className="w-3.5 h-3.5 text-[#6CC6C9]" />
 <span>{settings?.support_phone || '9200 12345'}</span>
 </p>
 <p className="flex items-center gap-2">
 <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
 <span>{settings?.whatsapp_number || '+966 50 000 0000'} (واتساب)</span>
 </p>
 <p className="flex items-center gap-2">
 <Mail className="w-3.5 h-3.5 text-[#6CC6C9]" />
 <span>{settings?.support_email || 'care@selection.coffee'}</span>
 </p>
 <p className="flex items-start gap-2 pt-1">
 <MapPin className="w-4 h-4 text-[#6CC6C9] flex-shrink-0 mt-0.5" />
 <span>{t(settings?.address_ar || 'الرياض - حي حطين - طريق الملك فهد', settings?.address_en || 'Riyadh - Hittin District - King Fahd Rd')}</span>
 </p>
 </div>
 </div>

 </div>

 {/* Bottom Rights & Payment Badges */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#E8F2F2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B8C8E]">
 <p>
 © {new Date().getFullYear()} {t('جميع الحقوق محفوظة لمحمصة سليكشن القهوة المختصة', 'All rights reserved to Selection Specialty Coffee Roasters')}.
 </p>

 {/* Payment Icons */}
 <div className="flex items-center gap-2 flex-wrap justify-center">
 {[
 { src: 'https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/mada.svg', fallback: 'MADA', alt: 'MADA' },
 { src: 'https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/apple_pay.svg', fallback: 'Apple Pay', alt: 'Apple Pay' },
 { src: 'https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/visa.svg', fallback: 'VISA', alt: 'VISA' },
 { src: 'https://raw.githubusercontent.com/activemerchant/payment_icons/master/app/assets/images/payment_icons/master.svg', fallback: 'Mastercard', alt: 'Mastercard' },
 ].map(p => (
 <img
 key={p.alt}
 src={p.src}
 alt={p.alt}
 className="h-6 w-auto bg-[#F0FAFA] border border-[#E8F2F2] px-2 py-1 rounded"
 onError={e => {
 const t = e.currentTarget;
 const fallback = document.createElement('span');
 fallback.className = 'text-[10px] font-extrabold';
 fallback.textContent = p.fallback;
 t.parentNode?.replaceChild(fallback, t);
 }}
 />
 ))}
 </div>
 </div>

 </footer>
 );
};

export default Footer;
