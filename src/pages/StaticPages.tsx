import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import {
 Coffee,
 Mail,
 Phone,
 MessageSquare,
 MapPin,
 Send,
 CheckCircle,
 HelpCircle,
 BookOpen,
 Calendar,
 Gift,
 Truck,
 Search,
 ChevronDown,
 ChevronUp,
 Sliders,
 Flame,
 Award,
 Clock,
 ExternalLink,
 ShieldCheck,
 PackageCheck,
 RotateCcw,
 Zap
} from 'lucide-react';

interface PageProps {
 onNavigate: (path: string) => void;
}

// 1. ABOUT PAGE
export const AboutPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">

 <div className="text-center space-y-4">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0E5257] to-[#6CC6C9] p-0.5 mx-auto shadow-xl">
 <div className="w-full h-full bg-[#FFFFFF] rounded-[14px] flex items-center justify-center">
 <Coffee className="w-8 h-8 text-[#6CC6C9]" />
 </div>
 </div>
 <h1 className="text-3xl sm:text-5xl font-extrabold font-serif animate-cup-fill">
 {t('قصة محمصة سليكشن القهوة المختصة', 'About Selection Coffee Roasters')}
 </h1>
 <p className="text-xs sm:text-sm text-[#6B8C8E] max-w-xl mx-auto leading-relaxed">
 {t(
 'حكاية شغف وإتقان من أعالي جبال القهوة العالمية إلى كوبك اليومي. نسعى لإلهام مجتمع القهوة بالربط بين المزارع الاستثنائي والمستهلك الشغوف.',
 'Passionate specialty coffee roasters dedicated to 85+ score micro-lots and sustainable direct-trade partnerships.'
 )}
 </p>
 </div>

 {/* Brand Core Values */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-6 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2 text-center">
 <Award className="w-8 h-8 text-[#6CC6C9] mx-auto" />
 <h3 className="font-bold text-base text-[#1A2E30]">{t('تقييم 85+ درجة', '85+ SCA Score')}</h3>
 <p className="text-xs text-[#6B8C8E]">
 {t('نختار فقط المحاصيل ذات التقييم المرتفع في مقياس القهوة المختصة العالمي.', 'We source strictly top-tier specialty lots certified by SCA standards.')}
 </p>
 </div>

 <div className="p-6 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2 text-center">
 <Flame className="w-8 h-8 text-[#0E5257] mx-auto" />
 <h3 className="font-bold text-base text-[#1A2E30]">{t('تحميص أسبوعي متقن', 'Craft Precision Roasting')}</h3>
 <p className="text-xs text-[#6B8C8E]">
 {t('نستخدم أحدث محامص Loring الحافظة للبيئة لإبراز الإيحاءات الفاكهية والزهرية.', 'Eco-friendly Loring roasters to highlight subtle fruit & floral notes.')}
 </p>
 </div>

 <div className="p-6 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2 text-center">
 <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
 <h3 className="font-bold text-base text-[#1A2E30]">{t('تجارة مباشرة مع المزارعين', 'Direct Trade Freshness')}</h3>
 <p className="text-xs text-[#6B8C8E]">
 {t('نعمل مباشرة مع المزارعين في إثيوبيا، كولومبيا، السلفادور وجبال جازان.', 'Sourced directly from farmers in Ethiopia, Colombia, El Salvador & Saudi Arabia.')}
 </p>
 </div>
 </div>

 {/* Detailed Story Box */}
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 text-xs sm:text-sm text-[#4A6869] leading-relaxed shadow-xl">
 <h3 className="text-lg font-bold text-[#1A2E30] border-b border-[#E8F2F2] pb-3">
 {t('رؤيتنا ورسالتنا', 'Our Vision & Heritage')}
 </h3>
 <p>
 تأسست محمصة سليكشن القهوة في العاصمة الرياض بهدف إعادة تعريف تجربة تذوق القهوة المختصة في المملكة والخليج العربي. نحن نؤمن بأن كل حبة قهوة تحمل هوية أرضها وتضاريس مزارعها.
 </p>
 <p>
 يقوم فريقنا المحترف من المحمصين المعتمدين من جمعية القهوة المختصة (SCA) بضبط منحنيات التحميص بعناية فائقة لكافة أنواع التحضير سواء للتقطير والفلتر أو الإسبرسو أو القهوة السعودية الأصيلة.
 </p>
 <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8F2F2] text-center font-bold text-[#6CC6C9]">
 سجل تجاري رقم: 1010892341 • الرقم الضريبي للمنشأة: 310928374800003
 </div>
 </div>

 </div>
 </div>
 );
};

// 2. WHOLESALE PAGE
export const WholesalePage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 const [name, setName] = useState('');
 const [company, setCompany] = useState('');
 const [phone, setPhone] = useState('');
 const [email, setEmail] = useState('');
 const [city, setCity] = useState('');
 const [estimateVolume, setEstimateVolume] = useState('10kg - 50kg شهرياً');
 const [submitting, setSubmitting] = useState(false);
 const [submitted, setSubmitted] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: company,
          contact_name: name,
          email,
          phone,
          city,
          monthly_coffee_kg: estimateVolume,
          message: ''
        })
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch (err) {
      alert(t('فشل إرسال الطلب', 'Failed to submit request'));
    } finally {
      setSubmitting(false);
    }
  };

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
 <div className="text-center space-y-3">
 <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2E30] font-serif">
 {t('مبيعات الجملة والتموين للمقاهي والشركات', 'Wholesale & B2B Supply')}
 </h1>
 <p className="text-xs sm:text-sm text-[#6B8C8E]">
 {t('نوفر لمقهتك ومكتبك محاصيل قهوة مختصة محمصة طازجة بملفات تحميص ثبات عالية وأسعار تنافسية.', 'Custom roasting profiles, barista training & weekly wholesale supply for cafes.')}
 </p>
 </div>

 {submitted ? (
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-emerald-500/40 text-center space-y-3 shadow-xl">
 <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
 <h3 className="font-bold text-lg text-[#1A2E30]">{t('تم استلام طلب الجملة بنجاح!', 'Wholesale Request Received!')}</h3>
 <p className="text-xs text-[#6B8C8E]">
 {t('سيقوم مدير حسابات الجملة بالتواصل معكم وتزويدكم بقائمة الأسعار وعينات التذوق.', 'Our B2B account manager will contact you with pricing and sample packs.')}
 </p>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4 text-xs shadow-xl">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('اسم المقهى / الشركة', 'Company / Cafe Name')}</label>
 <input
 type="text"
 required
 value={company}
 onChange={e => setCompany(e.target.value)}
 placeholder="مقهى سليكشن المختص"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('اسم المسؤول', 'Contact Person')}</label>
 <input
 type="text"
 required
 value={name}
 onChange={e => setName(e.target.value)}
 placeholder="سعود الشمري"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('رقم الجوال والواتساب', 'Phone Number')}</label>
 <input
 type="tel"
 required
 value={phone}
 onChange={e => setPhone(e.target.value)}
 placeholder="+966 50 123 4567"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('البريد الإلكتروني', 'Email Address')}</label>
 <input
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="b2b@cafe.com"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('المدينة', 'City')}</label>
 <input
 type="text"
 required
 value={city}
 onChange={e => setCity(e.target.value)}
 placeholder="الرياض / جدة / الدمام"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('حجم الاستهلاك الشهري التقديري', 'Monthly Est. Volume')}</label>
 <select
 value={estimateVolume}
 onChange={e => setEstimateVolume(e.target.value)}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 >
 <option value="10kg - 50kg شهرياً">10kg - 50kg شهرياً</option>
 <option value="50kg - 150kg شهرياً">50kg - 150kg شهرياً</option>
 <option value="أكثر من 150kg شهرياً">أكثر من 150kg شهرياً</option>
 </select>
 </div>
 </div>

 <button
 type="submit"
 disabled={submitting}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
 >
 <Send className="w-4 h-4" />
 <span>{submitting ? t('جاري التقديم...', 'Submitting...') : t('تقديم طلب قائمة أسعار الجملة والـ B2B', 'Submit B2B Inquiry')}</span>
 </button>
 </form>
 )}
 </div>
 </div>
 );
};

// 3. CONTACT PAGE
export const ContactPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 const [submitted, setSubmitted] = useState(false);
 const [loading, setLoading] = useState(false);
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [phone, setPhone] = useState('');
 const [message, setMessage] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, subject: '', message })
    });
    if (!res.ok) throw new Error('Failed to send');
    setSubmitted(true);
  } catch (err) {
    alert(t('حدث خطأ، يرجى المحاولة مرة أخرى', 'Error sending message'));
  } finally {
    setLoading(false);
  }
};

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
 <div className="text-center space-y-3">
 <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('تواصل معنا وخدمة العملاء', 'Contact Us & Support')}</h1>
 <p className="text-xs text-[#6B8C8E]">{t('نحن هنا لمساعدتك والإجابة عن جميع استفساراتك حول الطلبات والشحن.', 'Our customer support team is available 7 days a week.')}</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2 shadow">
 <Phone className="w-6 h-6 text-[#6CC6C9] mx-auto" />
 <h4 className="font-bold text-sm text-[#1A2E30]">{t('الهاتف المجاني', 'Toll Free')}</h4>
 <p className="text-xs text-[#6B8C8E]">9200 12345</p>
 </div>
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2 shadow">
 <MessageSquare className="w-6 h-6 text-emerald-400 mx-auto" />
 <h4 className="font-bold text-sm text-[#1A2E30]">{t('خدمة الواتساب', 'WhatsApp')}</h4>
 <p className="text-xs text-[#6B8C8E]">+966 50 000 0000</p>
 </div>
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-2 shadow">
 <Mail className="w-6 h-6 text-[#6CC6C9] mx-auto" />
 <h4 className="font-bold text-sm text-[#1A2E30]">{t('البريد الإلكتروني', 'Email Support')}</h4>
 <p className="text-xs text-[#6B8C8E]">care@selection.coffee</p>
 </div>
 </div>

 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <h3 className="font-bold text-base text-[#1A2E30] border-b border-[#E8F2F2] pb-3">
 {t('أرسل لنا رسالة مباشرة', 'Send Us a Direct Message')}
 </h3>
 {submitted ? (
 <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
 <CheckCircle className="w-4 h-4" />
 <span>{t('تم إرسال رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت.', 'Message sent successfully! We will reply shortly.')}</span>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4 text-xs">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('الاسم الكريم', 'Your Name')} className=" focus:outline-none focus:border-[#6CC6C9]" />
 <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('البريد الإلكتروني', 'Your Email')} className=" focus:outline-none focus:border-[#6CC6C9]" />
 </div>
 <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('رقم الجوال (اختياري)', 'Phone (optional)')} className="w-full focus:outline-none focus:border-[#6CC6C9]" />
 <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('نص الرسالة أو الاستفسار...', 'Your Message...')} className="w-full focus:outline-none focus:border-[#6CC6C9]" />
 <button type="submit" disabled={loading} className="bg-[#0E5257] hover:bg-[#2B7D82] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition">
 {loading ? t('جاري الإرسال...', 'Sending...') : t('إرسال الرسالة', 'Send Message')}
 </button>
 </form>
 )}
 </div>
 </div>
 </div>
 );
};

// 4. TERMS PAGE
export const TermsPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
 <h1 className="text-2xl font-bold text-[#1A2E30] font-serif">{t('الشروط والأحكام', 'Terms & Conditions')}</h1>
 <div className="p-8 bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl text-xs text-[#4A6869] space-y-6 leading-relaxed">

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">1. {t('التعريفات', 'Definitions')}</h4>
 <p>{t('يشمل مصطلح "المتجر" موقع سليكشن للقهوة المختصة إلكترونياً. "العميل" هو أي شخص يقوم بشراء منتجات من المتجر. "المنتجات" تشمل البن المحمص وأدوات التحضير والأكواب والبطاقات الإلكترونية.', '"The Store" refers to Selection Specialty Coffee online store. "Customer" is any person purchasing products. "Products" include roasted coffee, brewing equipment, cups, and e-gift cards.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">2. {t('الأسعار وضريبة القيمة المضافة', 'Pricing & Tax')}</h4>
 <p>{t('جميع الأسعار معروضة بالريال السعودي وتشمل ضريبة القيمة المضافة 15% وفقاً لأنظمة هيئة الزكاة والدخل بالمملكة العربية السعودية. يحتفظ المتجر بحق تعديل الأسعار في أي وقت دون إشعار مسبق.', 'All prices are displayed in Saudi Riyal (SAR) and include 15% VAT per ZATCA regulations. The store reserves the right to change prices without prior notice.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">3. {t('الطلب والدفع', 'Ordering & Payment')}</h4>
 <p>{t('تُعتبر الطلبات مقبولة فقط بعد تأكيد الدفع بنجاح. نقبل الدفع عبر مدى، Apple Pay، فيزا/ماستركارد، والدفع عند الاستلام. يتم تجهيز الطلب خلال 24 ساعة عمل بعد تأكيد الدفع.', 'Orders are accepted only upon successful payment confirmation. We accept Mada, Apple Pay, Visa/Mastercard, and COD. Orders are processed within 24 business hours after payment confirmation.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">4. {t('الشحن والتوصيل', 'Shipping & Delivery')}</h4>
 <p>{t('نستخدم شركات سمسا وأرامكس للتوصيل. الشحن مجاني للطلبات فوق 199 ﷼ داخل المملكة. مدة التوصيل داخل الرياض 24-48 ساعة، وللمدن الأخرى 2-4 أيام عمل. يتحمل العميل تكلفة الشحن الإضافي للطلبات تحت 199 ﷼.', 'We use SMSA and Aramex for delivery. Free shipping on orders over 199 ﷼ within Saudi Arabia. Riyadh delivery: 24-48 hours. Other cities: 2-4 business days.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">5. {t('طلب القهوة المطحونة', 'Grinding Requests')}</h4>
 <p>{t('يُطحن البن مجاناً حسب طلب العميل (فلتر، إسبرسو، فرنسي، أيروبريس، أو تركي). نوصي بشدة باختيار الحبوب الكاملة لضمان أطول صلاحية وطزاجة. لا يمكن استرجاع القهوة بعد الطحن.', 'Coffee is ground free of charge per customer request (filter, espresso, french press, aeropress, or Turkish). We strongly recommend whole beans for maximum freshness. Ground coffee cannot be returned.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">6. {t('الاسترجاع والاستبدال', 'Returns & Exchanges')}</h4>
 <p>{t('بما أن القهوة منتج غذائي محمص خصيصاً، لا يمكن استرجاعها بعد فتح الغلاف. للأدوات والأكواب، يمكن الإرجاع خلال 7 أيام من الاستلام بشرط عدم الاستخدام والحفاظ على العلبة الأصلية. في حالة وجود عيب في المنتج، يُستبدل فوراً على نفقتنا.', 'As coffee is a perishable roasted product, returns are not accepted after opening. Equipment and cups may be returned within 7 days if unused and in original packaging. Defective products are replaced immediately at our cost.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">7. {t('نظام الولاء والنقاط', 'Loyalty & Points')}</h4>
 <p>{t('يحصل العملاء المسجلون على نقطة واحدة لكل ريال سعودي ينفقون. يمكن تحويل 20 نقطة إلى خصم بقيمة 1 ريال سعودي عند الدفع. النقاط غير قابلة للتحويل لأطراف أخرى أو السحب كنقود.', 'Registered customers earn 1 loyalty point per 1 SAR spent. 20 points can be redeemed for 1 ﷼ discount at checkout. Points are non-transferable and cannot be redeemed for cash.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">8. {t('المسؤولية والliability', 'Liability')}</h4>
 <p>{t('يتحمل المتجر المسؤولية عن أي أضرار مباشرة ناتجة عن خطأ في الشحن أو التغليف. لا يتحمل المتجر المسؤولية عن أي أضرار غير مباشرة أو فقدان الأرباح. يخضع أي نزاع لقوانين المملكة العربية السعودية ومحاكم الرياض المختصة.', 'The store is liable for direct damages due to shipping or packaging errors. The store is not liable for indirect damages or loss of profits. Disputes are governed by Saudi law and Riyadh courts.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">9. {t('التعديلات', 'Modifications')}</h4>
 <p>{t('يحتفظ المتجر بحق تعديل هذه الشروط في أي وقت. ت 적용 الشروط المحدثة على جميع الطلبات الجديدة من تاريخ نشرها. يُنصح بمراجعة هذه الصفحة دورياً.', 'The store reserves the right to modify these terms at any time. Updated terms apply to all new orders from the date of publication.')}</p>
 </div>

 <p className="text-[10px] text-[#6B8C8E] pt-4 border-t border-[#E8F2F2]">
 {t('آخر تحديث: يوليو 2026', 'Last updated: July 2026')} · {t('سجل تجاري: 1010892341', 'CR: 1010892341')} · {t('رقم ضريبي: 310928374800003', 'VAT: 310928374800003')}
 </p>
 </div>
 </div>
 </div>
 );
};

// 5. PRIVACY PAGE
export const PrivacyPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
 <h1 className="text-2xl font-bold text-[#1A2E30] font-serif">{t('سياسة الخصوصية', 'Privacy Policy')}</h1>
 <div className="p-8 bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl text-xs text-[#4A6869] space-y-6 leading-relaxed">

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">1. {t('جمع البيانات', 'Data Collection')}</h4>
 <p>{t('نقوم بجمع البيانات التالية عند التسجيل أو الشراء: الاسم الكامل، البريد الإلكتروني، رقم الجوال، عنوان الشحن، وسجل الطلبات. لا نجمع أي بيانات مالية حساسة如بيانات البطاقة البنكية.', 'We collect the following data upon registration or purchase: full name, email, phone number, shipping address, and order history. We do not collect sensitive financial data such as credit card information.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">2. {t('استخدام البيانات', 'Data Usage')}</h4>
 <p>{t('تُستخدم بياناتك لـ: معالجة طلباتك وتوصيلها، إرسال تحديثات حالة الطلب، تحسين تجربة التسوق، إرسال العروض الترويجية (بموافقتك)، والامتثال للمتطلبات القانونية.', 'Your data is used to: process and deliver your orders, send order status updates, improve your shopping experience, send promotional offers (with your consent), and comply with legal requirements.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">3. {t('مشاركة البيانات مع أطراف ثالثة', 'Third-Party Sharing')}</h4>
 <p>{t('لا نبيع أو نؤجر بياناتك لأي طرف ثالث. نشارك بياناتك فقط مع: شركات الشحن (سمسا، أرامكس) لتوصيل طلبك، ومزودي خدمات الدفع لمعالجة المدفوعات، والجهات الحكومية عند الطلب القانوني.', 'We do not sell or rent your data. We share data only with: shipping companies (SMSA, Aramex) for delivery, payment processors for transactions, and government authorities upon legal request.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">4. {t('حماية البيانات', 'Data Protection')}</h4>
 <p>{t('نستخدم تقنيات تشفير SSL/TLS لحماية جميع البيانات المنقولة. يتم تخزين كلمات المرور بشكل مشفر ولا يمكن الوصول لها. نلتزم بنظام حماية البيانات الشخصية السعودي (PDPL).', 'We use SSL/TLS encryption for all transmitted data. Passwords are stored encrypted and are inaccessible. We comply with the Saudi Personal Data Protection Law (PDPL).')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">5. {t('ملفات الارتباط (Cookies)', 'Cookies')}</h4>
 <p>{t('نستخدم ملفات ارتباط تقنية ضرورية لعمل الموقع بشكل صحيح (مثل سلة المشتريات وتفضيلات اللغة). لا نستخدم ملفات ارتباط تتبع شخصي أو إعلانية من أطراف ثالثة.', 'We use essential technical cookies for site functionality (e.g., cart, language preferences). We do not use personal tracking or third-party advertising cookies.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">6. {t('حقوقك', 'Your Rights')}</h4>
 <p>{t('لك الحق في: الوصول لبياناتك الشخصية، تعديلها أو حذفها، طلب نسخة من بياناتك، الاعتراض على معالجتها. للاستفسار، تواصل معنا على care@selection.coffee', 'You have the right to: access your personal data, modify or delete it, request a copy, object to processing. For inquiries, contact us at care@selection.coffee')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">7. {t('الاحتفاظ بالبيانات', 'Data Retention')}</h4>
 <p>{t('نحتفظ ببياناتك طالما أن حسابك نشط أو لمدة 5 سنوات بعد آخر طلب وفقاً للمتطلبات المحاسبية والقانونية في المملكة العربية السعودية.', 'We retain your data while your account is active or for 5 years after your last order, per accounting and legal requirements in Saudi Arabia.')}</p>
 </div>

 <div>
 <h4 className="font-bold text-[#1A2E30] text-sm mb-2">8. {t('الاتصال بنا', 'Contact Us')}</h4>
 <p>{t(' لأي استفسارات حول سياسة الخصوصية، يرجى التواصل عبر البريد الإلكتروني care@selection.coffee أو الاتصال على 9200 12345.', 'For any privacy-related inquiries, please email care@selection.coffee or call 9200 12345.')}</p>
 </div>

 <p className="text-[10px] text-[#6B8C8E] pt-4 border-t border-[#E8F2F2]">
 {t('آخر تحديث: يوليو 2026', 'Last updated: July 2026')} · {t('متوافق مع نظام حماية البيانات الشخصية السعودي (PDPL)', 'Compliant with Saudi PDPL')}
 </p>
 </div>
 </div>
 </div>
 );
};

// 6. SHIPPING POLICY PAGE
export const ShippingPolicyPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
 <h1 className="text-2xl font-bold text-[#1A2E30] font-serif">{t('سياسة الشحن والاسترجاع', 'Shipping & Refunds')}</h1>
 <div className="p-8 bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl text-xs text-[#4A6869] space-y-4 leading-relaxed">
 <h4 className="font-bold text-[#1A2E30] text-sm">مدة التوصيل والتكلفة</h4>
 <p>تستغرق عملية التوصيل داخل الرياض من 24 إلى 48 ساعة، ولجميع مدن المملكة عبر أرامكس وسمسا من 2 إلى 4 أيام عمل.</p>
 <p className="p-3 bg-[#FFFFFF] rounded-xl text-[#6CC6C9] font-bold">
 الشحن مجاني لجميع الطلبات التي تتجاوز قيمتها 199 ريال سعودي.
 </p>
 <h4 className="font-bold text-[#1A2E30] text-sm">سياسة الاسترجاع والتعويض</h4>
 <p>نظراً لأن القهوة منتج غذائي قابل للتلف ومحمص خصيصاً، لا يمكن استرجاع القهوة المطحونة بعد فتح الغلاف، ولكن نضمن تعويض العميل كاملاً في حال وجود أي خطأ بالطلب أو تلف بالشحنة.</p>
 </div>
 </div>
 </div>
 );
};

// 7. FAQ PAGE
export const FaqPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 const [openIndex, setOpenIndex] = useState<number | null>(0);
 const [searchTerm, setSearchTerm] = useState('');

 const faqs = [
 {
 q_ar: 'متى يتم تحميص القهوة قبل الشحن؟',
 q_en: 'When is the coffee roasted before shipping?',
 a_ar: 'نضمن لك وصول القهوة بتاريخ تحميص حديث جداً (خلال 3 إلى 10 أيام من تاريخ التحميص) لضمان اكتمال انبعاث الغازات وترسب النكهات المثالية.',
 a_en: 'We guarantee coffee delivered within 3-10 days from roasting date so degas cycle reaches optimal flavor peak.'
 },
 {
 q_ar: 'ما هو التاريخ الأنسب لاستخدام القهوة بعد التحميص؟',
 q_en: 'What is the ideal rested period for specialty coffee?',
 a_ar: 'نوصي بترك القهوة ترتاح لمدة 7 إلى 14 يوماً من تاريخ التحميص للإسبرسو، و5 إلى 10 أيام للفلتر للحصول على أفضل استخلاص ووضوح للإيحاءات.',
 a_en: 'We recommend resting 7-14 days for espresso and 5-10 days for drip filter brewing.'
 },
 {
 q_ar: 'هل الشحن مجاني لجميع مناطق المملكة؟',
 q_en: 'Is shipping free across Saudi Arabia?',
 a_ar: 'نعم! الشحن مجاني بالكامل لأي طلب بقيمة 199 ريال سعودي أو أكثر لجميع مدن ومناطق المملكة عبر سمسا وأرامكس وفاستلو.',
 a_en: 'Yes! Free express shipping applies on all orders above 199 ﷼ anywhere in KSA.'
 },
 {
 q_ar: 'هل توفرون خيارات الدفع عند الاستلام؟',
 q_en: 'Do you offer Cash on Delivery?',
 a_ar: 'نعم، يمكنك الدفع نقداً أو بالبطاقة عند الاستلام برسوم إضافية 15 ﷼، أو الدفع مقدماً عبر مدى، فيزا/ماستركارد، أو Apple Pay.',
 a_en: 'Yes, you can pay in cash or by card on delivery for a 15 ﷼ surcharge, or pay upfront via Mada, Visa/Mastercard, or Apple Pay.'
 },
 {
 q_ar: 'ما الفرق بين القهوة المغسولة والمعالجة بالتجفيف الطبيعي؟',
 q_en: 'What is the difference between Washed & Natural processing?',
 a_ar: 'المعالجة المغسولة تبرز حمضية القهوة النقية والوضوح العالي، بينما المعالجة المجففة تمنح القهوة قواماً ثقيلاً وإيحاءات فاكهية حلاوتها بارزة.',
 a_en: 'Washed processing produces clean high clarity and bright acidity, while Natural process yields heavier body & juicy fruity sweetness.'
 }
 ];

 const filteredFaqs = faqs.filter(f => f.q_ar.includes(searchTerm) || f.q_en.toLowerCase().includes(searchTerm.toLowerCase()));

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
 <div className="text-center space-y-3">
 <HelpCircle className="w-12 h-12 text-[#6CC6C9] mx-auto" />
 <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('الأسئلة الشائعة والأجوبة', 'Frequently Asked Questions')}</h1>
 <p className="text-xs text-[#6B8C8E]">{t('كل ما تحتاج معرفته عن التحميص، درجات الطحن، الشحن، وطرق الدفع.', 'Everything you need to know about roast dates, grinding & order fulfillment.')}</p>
 </div>

 {/* Search FAQ */}
 <div className="relative max-w-md mx-auto">
 <Search className="w-4 h-4 text-[#6B8C8E] absolute right-3 top-3.5" />
 <input
 type="text"
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 placeholder={t('ابحث في الأسئلة الشائعة...', 'Search FAQs...')}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 {/* Accordion List */}
 <div className="space-y-3">
 {filteredFaqs.map((faq, idx) => {
 const isOpen = openIndex === idx;
 return (
 <div key={idx} className="bg-[#F0FAFA] border border-[#E8F2F2] rounded-2xl overflow-hidden transition">
 <button
 onClick={() => setOpenIndex(isOpen ? null : idx)}
 className="w-full text-start p-5 flex items-center justify-between font-bold text-sm text-[#1A2E30] hover:text-[#6CC6C9] cursor-pointer"
 >
 <span>{t(faq.q_ar, faq.q_en)}</span>
 {isOpen ? <ChevronUp className="w-4 h-4 text-[#6CC6C9]" /> : <ChevronDown className="w-4 h-4 text-[#6B8C8E]" />}
 </button>
 {isOpen && (
 <div className="px-5 pb-5 pt-0 text-xs text-[#4A6869] leading-relaxed border-t border-[#E8F2F2]/50 mt-1">
 <p className="pt-3">{t(faq.a_ar, faq.a_en)}</p>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
};

// 8. BREWING GUIDE PAGE
export const BrewingGuidePage: React.FC<PageProps> = () => {
 const { t } = useLanguage();
 const [selectedMethod, setSelectedMethod] = useState<'v60' | 'espresso' | 'french_press' | 'aeropress' | 'saudi'>('v60');
 const [coffeeGrams, setCoffeeGrams] = useState(20);

 const recipes = {
 v60: {
 title_ar: 'دليل تحضير V60 / فلتر التقطير',
 title_en: 'V60 Drip Filter Recipe',
 ratio: 15, // 1g coffee : 15ml water
 temp: '91°C - 93°C',
 grind: 'طحنة متوسطة النعومة (مثل ملح الطعام الناعم)',
 time: '2:30 - 3:00 دقيقة',
 steps_ar: [
 'ضع الفلتر الورقي بالقمع واغسله بماء ساخن للتخلص من طعم الورق وتسخين الأداة.',
 'ضع كمية القهوة المطحونة وقم بتسوية السطح بحركة خفيفة.',
 'الترطيب الأول: صب ضعف كمية القهوة ماء (مثلاً 60 مل) وانتظر 45 ثانية لمشاهدة الانبعاث الفوار (Bloom).',
 'الصبة الثانية: صب الماء بحركات دائرية هادئة حتى تصل للثلاثين بالمئة.',
 'الصبة الثالثة والأخيرة: أكمل الصب حتى الوصول للوزن المطلوب ودع الماء ينزل بالكامل.'
 ]
 },
 espresso: {
 title_ar: 'دليل استخلاص الإسبرسو الفاخر',
 title_en: 'Espresso Extraction Recipe',
 ratio: 2, // 1g coffee : 2ml espresso
 temp: '93°C',
 grind: 'طحنة ناعمة وموحدة',
 time: '25 - 30 ثانية',
 steps_ar: [
 'تأكد من نظافة وجفاف بورتفلتر المكينة.',
 'زن القهوة المطحونة بدقة واستخدم أداة توزيع القهوة (WDT).',
 'كبس متساوي بقوة متزنة بدون إمالة.',
 'ابدأ الاستخلاص فور تركيب البورتفلتر للحصول على كريما غنية وطبقات نكهة متوازنة.'
 ]
 },
 french_press: {
 title_ar: 'دليل الفرنش بريس (القوام الثقيل)',
 title_en: 'French Press Coarse Recipe',
 ratio: 16,
 temp: '94°C',
 grind: 'طحنة خشنة جداً',
 time: '4:00 دقائق',
 steps_ar: [
 'أضف القهوة الخشنة في وعاء الفرنش بريس.',
 'أضف الماء بالكامل وحرّك برفق باستخدام ملعقة خشبية.',
 'ضع الغطاء بدون ضغط المكبس وانتظر 4 دقائق.',
 'ازل الرغوة العائمة ثم اضغط المكبس ببطء واستمتع بقوام غني.'
 ]
 },
 aeropress: {
 title_ar: 'دليل الأيروبريس (الاستخلاص السريع)',
 title_en: 'Aeropress Recipe',
 ratio: 14,
 temp: '88°C - 90°C',
 grind: 'طحنة متوسطة',
 time: '1:45 دقيقة',
 steps_ar: [
 'استخدم الطريقة المقلوبة (Inverted Method) للحصول على تحكم كامل.',
 'أضف القهوة والماء ثم حرّك لمدة 10 ثوانٍ.',
 'ركب الفلتر واقلب الأداة فوق الكوب ثم اضغط بثبات لمدة 30 ثانية.'
 ]
 },
 saudi: {
 title_ar: 'دليل تحضير القهوة السعودية الأصيلة',
 title_en: 'Authentic Saudi Coffee Recipe',
 ratio: 20,
 temp: 'غليان مستمر',
 grind: 'طحنة خولانية فاتحة مع هيل وعفران',
 time: '15 - 20 دقيقة',
 steps_ar: [
 'أضف الماء في الدلة واتركه يغلي.',
 'أضف القهوة الخولانية واتركها تطبخ على نار هادئة لمدة 15 دقيقة.',
 'أضف الهيل المجهش والزعفران والشيخ في المزيار أو الدلة ودعها تركد دقائق قبل التقديم.'
 ]
 }
 };

 const currentRecipe = recipes[selectedMethod];
 const calculatedWater = coffeeGrams * currentRecipe.ratio;

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

 <div className="text-center space-y-3">
 <BookOpen className="w-12 h-12 text-[#6CC6C9] mx-auto" />
 <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('حاسبة ودليل تحضير القهوة', 'Interactive Brewing Guide')}</h1>
 <p className="text-xs text-[#6B8C8E]">{t('الوصفات الاحترافية ونسب القهوة للماء المعتمدة من خبراؤنا بالمحمصة.', 'Master Coffee-to-Water ratios and pouring techniques.')}</p>
 </div>

 {/* Method Switcher Buttons */}
 <div className="flex items-center justify-center gap-2 flex-wrap">
 {(Object.keys(recipes) as Array<keyof typeof recipes>).map(key => (
 <button
 key={key}
 onClick={() => setSelectedMethod(key)}
 className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${selectedMethod === key
 ? 'bg-[#0E5257] text-white border-[#6CC6C9]'
 : ''
 }`}
 >
 {key.toUpperCase()}
 </button>
 ))}
 </div>

 {/* Interactive Ratio Calculator */}
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 shadow-xl">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E8F2F2] pb-6">
 <div>
 <h3 className="font-bold text-lg text-[#1A2E30] font-serif">{currentRecipe.title_ar}</h3>
 <p className="text-xs text-[#6B8C8E] mt-1">{t('درجة الحرارة المثالية:', 'Ideal Temp:')} <span className="text-[#6CC6C9] font-bold">{currentRecipe.temp}</span></p>
 </div>

 <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E8F2F2] text-center w-full sm:w-auto">
 <span className="text-[10px] text-[#6B8C8E] block uppercase">{t('نسبة القهوة للماء', 'Brew Ratio')}</span>
 <span className="text-xl font-extrabold text-[#6CC6C9]">1 : {currentRecipe.ratio}</span>
 </div>
 </div>

 {/* Coffee Slider */}
 <div className="space-y-3 bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8F2F2]">
 <div className="flex justify-between items-center text-xs">
 <label className="font-bold text-[#1A2E30]">{t('كمية القهوة المطحونة (جرام):', 'Coffee Dose (grams):')}</label>
 <span className="text-lg font-extrabold text-[#6CC6C9]">{coffeeGrams}g</span>
 </div>
 <input
 type="range"
 min="10"
 max="60"
 step="1"
 value={coffeeGrams}
 onChange={e => setCoffeeGrams(Number(e.target.value))}
 className="w-full accent-[#6CC6C9] cursor-pointer"
 />

 <div className="pt-2 border-t border-[#E8F2F2] flex justify-between items-center text-xs">
 <span className="text-[#6B8C8E]">{t('كمية الماء المطلوبة بالمليلتر:', 'Required Water (ml):')}</span>
 <span className="text-xl font-extrabold text-emerald-400">{calculatedWater} ml</span>
 </div>
 </div>

 {/* Steps List */}
 <div className="space-y-3">
 <h4 className="font-bold text-sm text-[#1A2E30]">{t('خطوات التحضير:', 'Brewing Steps:')}</h4>
 <ol className="space-y-2.5 text-xs text-[#4A6869]">
 {currentRecipe.steps_ar.map((step, i) => (
 <li key={i} className="flex items-start gap-3 bg-[#FFFFFF]/50 p-3 rounded-xl border border-[#E8F2F2]/40">
 <span className="w-5 h-5 rounded-full bg-[#0E5257] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
 {i + 1}
 </span>
 <span className="leading-relaxed">{step}</span>
 </li>
 ))}
 </ol>
 </div>

 </div>

 </div>
 </div>
 );
};

// 9. SUBSCRIPTIONS PAGE
export const SubscriptionsPage: React.FC<PageProps> = ({ onNavigate }) => {
 const { t } = useLanguage();

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">

 <div className="text-center space-y-3">
 <Calendar className="w-12 h-12 text-[#6CC6C9] mx-auto" />
 <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2E30] font-serif">{t('اشتراكات القهوة الشهري - نادي سليكشن', 'Selection Coffee Subscription Club')}</h1>
 <p className="text-xs sm:text-sm text-[#6B8C8E] max-w-lg mx-auto">
 {t('قهوتك المفضلة تصلك محمصة طازجة لباب بيتك أسبوعياً أو شهرياً بدون عناء إعادة الطلب وبخصم حالم.', 'Freshly roasted micro-lots delivered to your doorstep automatically with exclusive perks.')}
 </p>
 </div>

 {/* Subscription Tiers */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 flex flex-col justify-between shadow-xl">
 <div className="space-y-3">
 <span className="text-[10px] bg-[#0E5257]/30 text-[#6CC6C9] font-bold px-2.5 py-1 rounded-full uppercase">
 {t('للمبتدئين', 'Starter Plan')}
 </span>
 <h3 className="font-bold text-xl text-[#1A2E30] font-serif">{t('بوكس المستكشف (2 كيس)', 'The Explorer (2 Bags)')}</h3>
 <p className="text-xs text-[#6B8C8E]">{t('كيسان قهوة مختصة (250غ لكل كيس) بتنوع محاصيل فاكهية ومغسولة.', '2 bags of single origin specialty crops monthly.')}</p>
 <div className="pt-2 text-2xl font-extrabold text-[#6CC6C9]">
 119 <span className="text-xs text-[#6B8C8E] font-normal">﷼ / شهرياً</span>
 </div>
 </div>

 <button onClick={() => onNavigate('/products')} className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer">
 {t('اشترك الآن', 'Subscribe Starter')}
 </button>
 </div>

 <div className="p-8 rounded-3xl bg-[#F0FAFA] border-2 border-[#6CC6C9] space-y-6 flex flex-col justify-between shadow-2xl relative">
 <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6CC6C9] text-black text-[10px] font-extrabold px-3 py-1 rounded-full shadow">
 {t('الأكثر طلباً', 'MOST POPULAR')}
 </span>
 <div className="space-y-3 pt-2">
 <span className="text-[10px] bg-[#6CC6C9]/20 text-[#6CC6C9] font-bold px-2.5 py-1 rounded-full uppercase">
 {t('لعشاق القهوة', 'Coffee Connoisseur')}
 </span>
 <h3 className="font-bold text-xl text-[#1A2E30] font-serif">{t('بوكس المحمص الخاص (3 أكياس)', 'Roaster Choice (3 Bags)')}</h3>
 <p className="text-xs text-[#6B8C8E]">{t('3 أكياس قهوة مختصة مختارة بعناية من أحدث المحاصيل العالمية الحصرية.', '3 bags of rare high-score micro-lots.')}</p>
 <div className="pt-2 text-3xl font-extrabold text-[#6CC6C9]">
 169 <span className="text-xs text-[#6B8C8E] font-normal">﷼ / شهرياً</span>
 </div>
 </div>

 <button onClick={() => onNavigate('/products')} className="w-full bg-[#6CC6C9] hover:bg-amber-500 text-black py-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg">
 {t('اشترك بالنادي الفاخر', 'Subscribe Pro')}
 </button>
 </div>

 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 flex flex-col justify-between shadow-xl">
 <div className="space-y-3">
 <span className="text-[10px] bg-[#0E5257]/30 text-[#6CC6C9] font-bold px-2.5 py-1 rounded-full uppercase">
 {t('للمكاتب وعشاق التقطير', 'Office & Drip Lovers')}
 </span>
 <h3 className="font-bold text-xl text-[#1A2E30] font-serif">{t('بوكس الأظرف المقطرة (30 ظرف)', 'Drip Bags Box (30 Bags)')}</h3>
 <p className="text-xs text-[#6B8C8E]">{t('30 ظرف قهوة مقطرة جاهزة سريع التحضير في العمل والأسفار.', '30 ready drip bags perfect for work & travel.')}</p>
 <div className="pt-2 text-2xl font-extrabold text-[#6CC6C9]">
 139 <span className="text-xs text-[#6B8C8E] font-normal">﷼ / شهرياً</span>
 </div>
 </div>

 <button onClick={() => onNavigate('/products')} className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer">
 {t('اشترك بالأظرف', 'Subscribe Drip Pack')}
 </button>
 </div>

 </div>

 </div>
 </div>
 );
};

// 10. LOCATIONS PAGE
export const LocationsPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
 <div className="text-center space-y-3">
 <MapPin className="w-12 h-12 text-[#6CC6C9] mx-auto" />
 <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('فرع المحمصة ومقهى الإسبرسو', 'Roastery Location & Espresso Bar')}</h1>
 <p className="text-xs text-[#6B8C8E]">{t('تفضل بزيارتنا لتذوق أحدث المحاصيل طازجة واستلام طلباتك مباشرة.', 'Visit our flagship espresso bar in Riyadh or order drive-thru pickup.')}</p>
 </div>

 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 shadow-xl">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <h3 className="font-bold text-lg text-[#1A2E30] font-serif">{t('الفرع الرئيسي - حطين (الرياض)', 'Flagship Branch - Hittin (Riyadh)')}</h3>
 <div className="space-y-2 text-xs text-[#4A6869]">
 <p className="flex items-center gap-2">
 <MapPin className="w-4 h-4 text-[#6CC6C9]" />
 <span>طريق الملك فهد الفرعي - حي حطين - الرياض</span>
 </p>
 <p className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-[#6CC6C9]" />
 <span>يومياً من الساعة 6:00 صباحاً حتى 12:00 منتصف الليل</span>
 </p>
 <p className="flex items-center gap-2">
 <Phone className="w-4 h-4 text-[#6CC6C9]" />
 <span>+966 11 234 5678</span>
 </p>
 </div>

 <div className="pt-2 flex gap-3">
 <a
 href="https://maps.google.com"
 target="_blank"
 rel="noreferrer"
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>{t('افتح في خرائط جوجل', 'Google Maps')}</span>
 </a>
 </div>
 </div>

 <div className="rounded-2xl overflow-hidden border border-[#E8F2F2] min-h-[200px] relative">
 <img
 src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
 alt="Selection Roastery Storefront"
 className="w-full h-full object-cover"
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

// 11. TRACK ORDER PAGE
export const TrackOrderPage: React.FC<PageProps & { orderNumber?: string }> = ({ orderNumber, onNavigate }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [orderCode, setOrderCode] = useState(orderNumber || '');
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (code: string) => {
  setLoading(true);
  setError('');
  setOrder(null);
  const needle = code.trim().toLowerCase();
  try {
  const res = await fetch(`/api/public/orders/${encodeURIComponent(code.trim())}`);
  if (res.ok) {
  const data = await res.json();
  setOrder(data);
  } else if (user) {
  // Fallback: the backend has no public number lookup (detail needs the
  // UUID), so match the number within the customer's own orders list.
  const listRes = await fetch(`/api/orders?user_id=${user.id}`);
  const list = await listRes.json();
  const hit = (Array.isArray(list) ? list : []).find((o: any) =>
  String(o.order_number || o.number || '').trim().toLowerCase() === needle);
  if (hit) {
  setOrder(hit);
  } else {
  setError(t('لم يتم العثور على طلب بهذا الرقم', 'No order found with this number'));
  }
  } else {
  setError(t('لم يتم العثور على طلب بهذا الرقم — سجّل الدخول لتتبع طلباتك', 'No order found with this number — login to track your orders'));
  }
  } catch (err) {
  setError(t('خطأ في البحث، يرجى المحاولة مرة أخرى', 'Search error, please try again'));
  }
  setSearched(true);
  setLoading(false);
  };

 useEffect(() => {
 if (orderNumber) fetchOrder(orderNumber);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [orderNumber]);

 const handleTrack = (e: React.FormEvent) => {
 e.preventDefault();
 if (!orderCode.trim()) return;
 fetchOrder(orderCode.trim());
 };

 const handleNewSearch = () => {
 setOrder(null);
 setSearched(false);
 setError('');
 setOrderCode('');
 if (onNavigate) onNavigate('/track-order');
 };

 const statusSteps = [
 { key: 'pending', label_ar: 'استلام الطلب', label_en: 'Order Placed' },
 { key: 'roasting', label_ar: 'التحميص والتغليف', label_en: 'Roasting & Packing' },
 { key: 'shipped', label_ar: 'تم الشحن', label_en: 'Shipped' },
 { key: 'delivered', label_ar: 'تم التوصيل', label_en: 'Delivered' }
 ];

 const getStepIndex = (status: string) => {
 const order: Record<string, number> = { pending: 0, paid: 0, roasting: 1, shipped: 2, delivered: 3, cancelled: -1 };
 return order[status] ?? 0;
 };

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
 <div className="text-center space-y-3">
 <Truck className="w-12 h-12 text-[#6CC6C9] mx-auto" />
 <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('تتبع شحنتك وطلبك', 'Track Your Order')}</h1>
 <p className="text-xs text-[#6B8C8E]">{t('أدخل رقم الطلب (مثل FK-98231) لمتابعة حالة الطلب.', 'Enter your order number (e.g. FK-98231) to check status.')}</p>
 </div>

 <form onSubmit={handleTrack} className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4 shadow-xl">
 <div className="flex gap-2">
 <input
 type="text"
 required
 value={orderCode}
 onChange={e => setOrderCode(e.target.value)}
 placeholder="FK-98231"
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 <button type="submit" disabled={loading} className="bg-[#0E5257] hover:bg-[#2B7D82] disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">
 <Search className="w-4 h-4" />
 <span>{loading ? t('...', '...') : t('تتبع', 'Track')}</span>
 </button>
 </div>

 {searched && error && (
 <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold">
 {error}
 </div>
 )}

 {order && (
 <div className="mt-6 pt-6 border-t border-[#E8F2F2] space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <span className="font-bold text-[#1A2E30] text-sm">{order.order_number}</span>
 <span className="text-[#6B8C8E] mx-2">|</span>
 <span className="text-[#4A6869] text-xs">{order.customer_name}</span>
 </div>
 <span className={`px-3 py-1 rounded text-[10px] font-bold ${order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
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

 {/* Progress Bar */}
 <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
 {statusSteps.map((step, idx) => {
 const currentIdx = getStepIndex(order.status);
 const isActive = idx <= currentIdx && order.status !== 'cancelled';
 return (
 <div key={step.key} className={`p-2 rounded-xl font-bold border ${isActive
 ? idx === currentIdx
 ? 'bg-[#0E5257] text-white border-[#6CC6C9]'
 : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
 : 'bg-[#FFFFFF] text-[#6B8C8E] border-[#E8F2F2]'
 }`}>
 {language === 'ar' ? step.label_ar : step.label_en}
 </div>
 );
 })}
 </div>

 {order.status_history && order.status_history.length > 0 && (
 <div className="space-y-2">
 <h4 className="font-bold text-xs text-[#4A6869]">{t('سجل الحالات', 'Status History')}</h4>
 {order.status_history.map((h: any, idx: number) => (
 <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-[#FFFFFF]">
 <div className="w-2 h-2 rounded-full bg-[#6CC6C9] mt-1.5 shrink-0"></div>
 <div>
 <span className="text-white font-bold">{language === 'ar' ? h.note_ar : h.note_en}</span>
 <span className="text-[#6B8C8E] block">{new Date(h.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 </div>
 ))}
 </div>
 )}

 {order.tracking_number && (
 <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E8F2F2] flex items-center justify-between">
 <span className="text-[#6B8C8E] text-xs">{t('رقم التتبع', 'Tracking Number')}</span>
 <span className="text-[#6CC6C9] font-bold text-xs">{order.tracking_number}</span>
 </div>
 )}

 <button
 onClick={handleNewSearch}
 className="w-full text-center text-[#6B8C8E] hover:text-[#6CC6C9] text-xs font-bold py-2 transition cursor-pointer"
 >
 {t('تتبع طلب آخر', 'Track another order')}
 </button>
 </div>
 )}
 </form>
 </div>
 </div>
 );
};

// 12. BLOG PAGE
export const BlogPage: React.FC<PageProps> = () => {
 const { t } = useLanguage();

 const articles = [
 {
 id: '1',
 title_ar: 'الفرق بين معالجة القهوة المغسولة والمجففة والمجففة بالطريقة الهوائية',
 title_en: 'Washed vs Natural vs Anaerobic Processing Explained',
 image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
 date: '2026-07-20',
 desc_ar: 'تعرّف على كيفية تأثير طريقة معالجة كرزة القهوة بعد الحصاد على الإيحاءات النكهية وقوام الكوب النهاري.'
 },
 {
 id: '2',
 title_ar: 'كيف تضبط درجة طحنة V60 للحصول على كوب متوازن بدون مرارة؟',
 title_en: 'How to Perfect V60 Grind Size Without Bitterness',
 image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
 date: '2026-07-15',
 desc_ar: 'نصائح عمليّة من محمصينا لضبط زمن الاستخلاص ومنع انسداد الفلتر أثناء صب الماء.'
 }
 ];

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
 <div className="text-center space-y-3">
 <BookOpen className="w-12 h-12 text-[#6CC6C9] mx-auto" />
 <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('مدونة القهوة وثقافة التحميص', 'Coffee Stories & Blog')}</h1>
 <p className="text-xs text-[#6B8C8E]">{t('مقالات ودراسات حول القهوة المختصة وطرق التحضير ومصادر المحاصيل.', 'Guides & educational articles on specialty coffee culture.')}</p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {articles.map(art => (
 <div key={art.id} className="bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl overflow-hidden shadow-xl space-y-4 p-5">
 <img src={art.image} alt={art.title_ar} className="w-full h-48 object-cover rounded-2xl" />
 <div className="space-y-2">
 <span className="text-[10px] text-[#6CC6C9] font-bold">{art.date}</span>
 <h3 className="font-bold text-base text-[#1A2E30] leading-snug font-serif">{art.title_ar}</h3>
 <p className="text-xs text-[#6B8C8E] line-clamp-2">{art.desc_ar}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
};

// 13. GIFT CARDS PAGE
export const GiftCardsPage: React.FC<PageProps> = () => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(100);
  const [recipient, setRecipient] = useState('');
  const [purchased, setPurchased] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, recipient })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_ar || data.error_en || 'Failed to create gift card');
      setPurchased(true);
    } catch (err: any) {
      setError(err.message || t('فشل شراء بطاقة الهدية', 'Failed to purchase gift card'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-12">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
  <div className="text-center space-y-3">
  <Gift className="w-12 h-12 text-[#6CC6C9] mx-auto" />
  <h1 className="text-3xl font-extrabold text-[#1A2E30] font-serif">{t('بطاقات الهدايا الإلكترونية', 'e-Gift Cards')}</h1>
  <p className="text-xs text-[#6B8C8E]">{t('أهدِ من تحب تجربة اختيار محاصيلهم وأدواتهم المفضلة من محمصة سليكشن القهوة.', 'Gift coffee lovers an instant digital voucher for coffee and gear.')}</p>
  </div>

  <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-6 shadow-xl">
  {purchased ? (
  <div className="text-center space-y-3 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
  <h3 className="font-bold text-base text-[#1A2E30]">{t('تم شراء بطاقة الهدية بنجاح!', 'Gift Card Issued!')}</h3>
  <p className="text-xs text-[#6B8C8E]">{t('تم إرسال كود الهدية للبريد الإلكتروني المدخل.', 'Voucher code dispatched via email.')}</p>
  </div>
  ) : (
  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
  {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
  <div>
  <label className="block text-[#4A6869] mb-2 font-bold">{t('اختر قيمة بطاقة الهدية (﷼):', 'Select Amount (SAR):')}</label>
  <div className="flex gap-2">
  {[100, 200, 300, 500].map(val => (
  <button
  key={val}
  type="button"
  onClick={() => setAmount(val)}
  className={`flex-1 py-3 rounded-xl font-bold cursor-pointer transition border ${amount === val ? 'bg-[#0E5257] text-white border-[#6CC6C9]' : 'bg-[#FFFFFF] text-[#6B8C8E] border-[#E8F2F2]'
  }`}
  >
  {val} ﷼
  </button>
  ))}
  </div>
  </div>

  <div>
  <label className="block text-[#4A6869] mb-1 font-semibold">{t('اسم أو بريد المهدى إليه:', 'Recipient Email:')}</label>
  <input
  type="email"
  required
  value={recipient}
  onChange={e => setRecipient(e.target.value)}
  placeholder="friend@example.com"
  className="w-full focus:outline-none focus:border-[#6CC6C9]"
  />
  </div>

  <button type="submit" disabled={submitting} className="w-full bg-[#6CC6C9] hover:bg-amber-500 text-black py-3.5 rounded-xl font-bold text-sm transition cursor-pointer shadow-lg disabled:opacity-50">
  {submitting ? t('جاري المعالجة...', 'Processing...') : t('شراء بطاقة الهدية الآن', 'Purchase Gift Card')}
  </button>
  </form>
  )}
  </div>
  </div>
  </div>
  );
};
