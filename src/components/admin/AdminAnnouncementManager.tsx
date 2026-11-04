import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Megaphone, Eye, Loader2, Save, Truck, ArrowLeft } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface Announcement {
 is_enabled: boolean;
 text_ar: string;
 text_en: string;
 link: string;
 bg_color: string;
 text_color: string;
 free_shipping_threshold: number;
 cta_text_ar: string;
 cta_text_en: string;
 bg_image: string;
 overlay: boolean;
 show_button: boolean;
 show_frame: boolean;
}

const defaultAnnouncement: Announcement = {
 is_enabled: false,
 text_ar: '',
 text_en: '',
 link: '',
 bg_color: '#F0FAFA',
 text_color: '#6CC6C9',
 free_shipping_threshold: 0,
 cta_text_ar: '',
 cta_text_en: '',
 bg_image: '',
 overlay: false,
 show_button: true,
 show_frame: true,
};

const LINK_OPTIONS: { value: string; label_ar: string; label_en: string }[] = [
 { value: '', label_ar: 'بدون رابط', label_en: 'No link' },
 { value: '/products', label_ar: 'المتجر (جميع المنتجات)', label_en: 'Store (all products)' },
 { value: '/', label_ar: 'الرئيسية', label_en: 'Home' },
 { value: '/about', label_ar: 'قصتنا', label_en: 'Our Story' },
 { value: '/subscriptions', label_ar: 'الاشتراكات', label_en: 'Subscriptions' },
 { value: '/coffee-finder', label_ar: 'مكتشف القهوة', label_en: 'Coffee Finder' },
 { value: '/brewing-guide', label_ar: 'دليل التحضير', label_en: 'Brewing Guide' },
 { value: '/wholesale', label_ar: 'بيع بالجملة', label_en: 'Wholesale' },
 { value: '/locations', label_ar: 'فروعنا', label_en: 'Locations' },
 { value: '/contact', label_ar: 'تواصل معنا', label_en: 'Contact Us' },
 { value: '/faq', label_ar: 'الأسئلة الشائعة', label_en: 'FAQ' },
];

export const AdminAnnouncementManager: React.FC = () => {
 const { language, t } = useLanguage();
 const [announcement, setAnnouncement] = useState<Announcement>(defaultAnnouncement);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [saved, setSaved] = useState(false);

 useEffect(() => { loadAnnouncement(); }, []);

 const loadAnnouncement = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await fetch('/api/admin/announcement');
 if (res.ok) {
 const data = await res.json();
 setAnnouncement({ ...defaultAnnouncement, ...data });
 }
 } catch {
 setError(t('فشل في تحميل الإعلان', 'Failed to load announcement'));
 } finally {
 setLoading(false);
 }
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 setSaving(true);
 setError(null);
 try {
 const res = await fetch('/api/admin/announcement', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(announcement),
 });
 if (!res.ok) throw new Error('Failed to save');
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 } catch {
 setError(t('فشل في الحفظ', 'Failed to save'));
 } finally {
 setSaving(false);
 }
 };

 const updateField = <K extends keyof Announcement>(field: K, value: Announcement[K]) => {
 setAnnouncement(prev => ({ ...prev, [field]: value }));
 };

 const previewText = language === 'ar' ? announcement.text_ar : announcement.text_en;

 const renderPreviewContent = () => (
 <>
 <div className="flex items-center justify-between gap-3">
 <p className="font-amiri text-sm font-bold leading-snug">
 {previewText || t('معاينة النص هنا', 'Preview text here')}
 </p>
 {announcement.link && announcement.show_button && (
 <span className="hidden sm:flex items-center gap-1 rounded-full bg-gradient-to-l from-[#6CC6C9] to-[#0E5257] text-[#FFFFFF] px-3 py-1 text-[10px] font-extrabold shrink-0">
 {announcement.cta_text_ar || announcement.cta_text_en || t('تسوق الآن', 'Shop Now')}
 <ArrowLeft className="w-3 h-3" />
 </span>
 )}
 </div>
 <div className="mt-2 flex flex-wrap items-center gap-1.5">
 {announcement.free_shipping_threshold > 0 && (
 <span className="flex items-center gap-1 rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-bold">
 <Truck className="w-2.5 h-2.5" />
 {t('متبقي ' + announcement.free_shipping_threshold + ' ﷼ للشحن المجاني', 'Free shipping unlocked')}
 </span>
 )}
 </div>
 </>
 );

 if (loading) {
 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة شريط الإعلانات', 'Announcement Bar')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة شريط الإعلانات العلوي', 'Manage the top announcement bar')}</p>
 </div>
 <div className="p-8 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse space-y-4">
 <div className="h-10 bg-[#E8F2F2] rounded-xl w-1/3" />
 <div className="h-10 bg-[#E8F2F2] rounded-xl w-full" />
 <div className="h-10 bg-[#E8F2F2] rounded-xl w-full" />
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة شريط الإعلانات', 'Announcement Bar')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة شريط الإعلانات العلوي', 'Manage the top announcement bar')}</p>
 </div>
 </div>

 {error && (
 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
 {error}
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Form */}
 <form onSubmit={handleSave} className="space-y-4 p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-sm text-[#1A2E30]">{t('إعدادات الإعلان', 'Announcement Settings')}</h3>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" checked={announcement.is_enabled}
 onChange={e => updateField('is_enabled', e.target.checked)} className="sr-only peer" />
 <div className="w-11 h-6 bg-[#E8F2F2] rounded-full peer peer-checked:bg-[#0E5257] peer-focus:ring-2 peer-focus:ring-[#6CC6C9]/30 after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:-translate-x-full" />
 <span className="mr-2 text-xs font-bold text-[#4A6869]">
 {announcement.is_enabled ? t('مفعّل', 'Enabled') : t('معطّل', 'Disabled')}
 </span>
 </label>
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('النص بالعربي', 'Arabic Text')}</label>
 <input type="text" value={announcement.text_ar} onChange={e => updateField('text_ar', e.target.value)}
 placeholder={t('شحن مجاني للطلبات فوق 200 ﷼', 'Free shipping on orders over 200 SAR')}
 className="w-full " />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('النص بالإنجليزي', 'English Text')}</label>
 <input type="text" value={announcement.text_en} onChange={e => updateField('text_en', e.target.value)}
 placeholder="Free shipping on orders over 200 ﷼"
 className="w-full " />
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('الرابط', 'Link')}</label>
 <select
 value={LINK_OPTIONS.some(o => o.value === announcement.link) ? announcement.link : ''}
 onChange={e => updateField('link', e.target.value)}
 className="w-full cursor-pointer"
 >
 {LINK_OPTIONS.map(opt => (
 <option key={opt.value} value={opt.value}>
 {language === 'ar' ? opt.label_ar : opt.label_en}
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('لون الخلفية', 'Background Color')}</label>
 <div className="flex items-center gap-2">
 <input type="color" value={announcement.bg_color} onChange={e => updateField('bg_color', e.target.value)}
 className="w-10 h-10 rounded-lg border border-[#E8F2F2] cursor-pointer bg-transparent" />
 <input type="text" value={announcement.bg_color} onChange={e => updateField('bg_color', e.target.value)}
 className="flex-1 font-mono text-xs" />
 </div>
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('لون النص', 'Text Color')}</label>
 <div className="flex items-center gap-2">
 <input type="color" value={announcement.text_color} onChange={e => updateField('text_color', e.target.value)}
 className="w-10 h-10 rounded-lg border border-[#E8F2F2] cursor-pointer bg-transparent" />
 <input type="text" value={announcement.text_color} onChange={e => updateField('text_color', e.target.value)}
 className="flex-1 font-mono text-xs" />
 </div>
 </div>
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">
 {t('الحد الأدنى للشحن المجاني (﷼)', 'Free Shipping Threshold (﷼)')}
 </label>
 <input type="number" value={announcement.free_shipping_threshold}
 onChange={e => updateField('free_shipping_threshold', Number(e.target.value))}
 className="w-full " />
 </div>

 <div className="pt-1 border-t border-[#E8F2F2]/60">
 <p className="text-[11px] font-bold text-[#6CC6C9] mb-3">{t('خيارات العرض المميز (اختياري)', 'Featured Offer Options (optional)')}</p>
 </div>

 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">
 {t('صورة الخلفية (اختياري)', 'Background Image (optional)')}
 </label>
 <ImageUploader value={announcement.bg_image} onChange={url => updateField('bg_image', url)} />
 <p className="text-[10px] text-[#6CC6C9] mt-1">
 {t('الأبعاد الموصى بها: 1600 × 400 بكسل (شريط عريض) — سيتم تعبئة الإطار تلقائياً.', 'Recommended size: 1600 × 400 px (wide banner) — it fills the bar automatically.')}
 </p>
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('أوفرلاي داكن', 'Dark Overlay')}</label>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" checked={announcement.overlay}
 onChange={e => updateField('overlay', e.target.checked)} className="sr-only peer" />
 <div className="w-10 h-5.5 bg-[#E8F2F2] rounded-full peer peer-checked:bg-[#0E5257] peer-focus:ring-2 peer-focus:ring-[#6CC6C9]/30 after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:-translate-x-full" />
 <span className="mr-2 text-xs font-bold text-[#4A6869]">
 {announcement.overlay ? t('عليه', 'On') : t('بدون', 'Off')}
 </span>
 </label>
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('إظهار الزر', 'Show Button')}</label>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" checked={announcement.show_button}
 onChange={e => updateField('show_button', e.target.checked)} className="sr-only peer" />
 <div className="w-10 h-5.5 bg-[#E8F2F2] rounded-full peer peer-checked:bg-[#0E5257] peer-focus:ring-2 peer-focus:ring-[#6CC6C9]/30 after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:-translate-x-full" />
 <span className="mr-2 text-xs font-bold text-[#4A6869]">
 {announcement.show_button ? t('ظاهر', 'On') : t('مخفي', 'Off')}
 </span>
 </label>
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('الإطار الذهبي', 'Gold Frame')}</label>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" checked={announcement.show_frame}
 onChange={e => updateField('show_frame', e.target.checked)} className="sr-only peer" />
 <div className="w-10 h-5.5 bg-[#E8F2F2] rounded-full peer peer-checked:bg-[#0E5257] peer-focus:ring-2 peer-focus:ring-[#6CC6C9]/30 after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:-translate-x-full" />
 <span className="mr-2 text-xs font-bold text-[#4A6869]">
 {announcement.show_frame ? t('عليه', 'On') : t('بدون', 'Off')}
 </span>
 </label>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('نص الزر عربي', 'CTA Text (AR)')}</label>
 <input type="text" value={announcement.cta_text_ar} onChange={e => updateField('cta_text_ar', e.target.value)}
 placeholder="تسوق الآن"
 className="w-full " />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('نص الزر إنجليزي', 'CTA Text (EN)')}</label>
 <input type="text" value={announcement.cta_text_en} onChange={e => updateField('cta_text_en', e.target.value)}
 placeholder="Shop Now"
 className="w-full " />
 </div>
 </div>

 <button type="submit" disabled={saving}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50">
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? null : <Save className="w-4 h-4" />}
 {saving ? t('جاري الحفظ...', 'Saving...') : saved ? t('تم الحفظ!', 'Saved!') : t('حفظ', 'Save')}
 </button>
 </form>

 {/* Preview */}
 <div className="space-y-4">
 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <h3 className="font-bold text-sm text-[#1A2E30] mb-4 flex items-center gap-2">
 <Eye className="w-4 h-4 text-[#6CC6C9]" />
 {t('معاينة', 'Preview')}
 </h3>

 {announcement.show_frame === false ? (
 <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}>
 {announcement.bg_image && (
 <img src={announcement.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
 )}
 {announcement.overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />}
 <div className="relative px-4 py-3">{renderPreviewContent()}</div>
 </div>
 ) : (
 <div className="rounded-2xl bg-gradient-to-l from-[#6CC6C9]/60 via-[#0E5257]/25 to-[#6CC6C9]/60 p-px">
 <div className="relative rounded-[calc(1rem-1px)] overflow-hidden" style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}>
 {announcement.bg_image && (
 <img src={announcement.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
 )}
 {announcement.overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />}
 <div className="relative px-4 py-3">{renderPreviewContent()}</div>
 </div>
 </div>
 )}

 <div className="mt-4 space-y-2 text-xs text-[#6B8C8E]">
 <div className="flex justify-between">
 <span>{t('الحالة', 'Status')}</span>
 <span className={announcement.is_enabled ? 'text-emerald-400' : 'text-red-400'}>
 {announcement.is_enabled ? t('مفعّل', 'Enabled') : t('معطّل', 'Disabled')}
 </span>
 </div>
 <div className="flex justify-between">
 <span>{t('الرابط', 'Link')}</span>
 <span className="text-white font-mono">{announcement.link || '—'}</span>
 </div>
 <div className="flex justify-between">
 <span>{t('الحد الأدنى للشحن المجاني', 'Free Shipping Threshold')}</span>
 <span className="text-white">{announcement.free_shipping_threshold} {t('﷼', 'SAR')}</span>
 </div>
 <div className="flex justify-between">
 <span>{t('صورة الخلفية', 'Background Image')}</span>
 <span className="text-white font-mono truncate max-w-[60%]">{announcement.bg_image || '—'}</span>
 </div>
 <div className="flex justify-between">
 <span>{t('أوفرلاي داكن', 'Dark Overlay')}</span>
 <span className={announcement.overlay ? 'text-emerald-400' : 'text-white/60'}>
 {announcement.overlay ? t('عليه', 'On') : t('بدون', 'Off')}
 </span>
 </div>
 <div className="flex justify-between">
 <span>{t('إظهار الزر', 'Show Button')}</span>
 <span className={announcement.show_button ? 'text-emerald-400' : 'text-white/60'}>
 {announcement.show_button ? t('ظاهر', 'On') : t('مخفي', 'Off')}
 </span>
 </div>
 <div className="flex justify-between">
 <span>{t('الإطار الذهبي', 'Gold Frame')}</span>
 <span className={announcement.show_frame ? 'text-emerald-400' : 'text-white/60'}>
 {announcement.show_frame ? t('عليه', 'On') : t('بدون', 'Off')}
 </span>
 </div>
 </div>
 </div>

 <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <h3 className="font-bold text-sm text-[#1A2E30] mb-3 flex items-center gap-2">
 <Megaphone className="w-4 h-4 text-[#6CC6C9]" />
 {t('معاينة الموقع الكامل', 'Full Site Preview')}
 </h3>
 <div className="rounded-xl overflow-hidden border border-[#E8F2F2]">
 {announcement.show_frame === false ? (
 <div className="relative px-3 py-2 overflow-hidden" style={{ backgroundColor: announcement.bg_color }}>
 {announcement.bg_image && (
 <img src={announcement.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
 )}
 {announcement.overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />}
 <div className="relative flex items-center justify-between gap-2" style={{ color: announcement.text_color }}>
 <p className="font-amiri text-[11px] font-bold leading-snug truncate">
 {previewText || t('معاينة النص هنا', 'Preview text here')}
 </p>
 {announcement.coupon_code && (
 <span className="shrink-0 rounded-full border border-dashed border-white/30 bg-black/15 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest">
 {announcement.coupon_code}
 </span>
 )}
 </div>
 </div>
 ) : (
 <div className="rounded-lg bg-gradient-to-l from-[#6CC6C9]/50 via-[#0E5257]/20 to-[#6CC6C9]/50 p-px m-1">
 <div className="relative rounded-[calc(0.5rem-1px)] px-3 py-2 overflow-hidden" style={{ backgroundColor: announcement.bg_color }}>
 {announcement.bg_image && (
 <img src={announcement.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
 )}
 {announcement.overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />}
 <div className="relative flex items-center justify-between gap-2" style={{ color: announcement.text_color }}>
 <p className="font-amiri text-[11px] font-bold leading-snug truncate">
 {previewText || t('معاينة النص هنا', 'Preview text here')}
 </p>
 </div>
 </div>
 </div>
 )}
 <div className="h-6 bg-[#E8F2F2] flex items-center justify-center">
 <div className="w-8 h-1 bg-[#6B8C8E]/30 rounded" />
 </div>
 <div className="bg-[#FFFFFF] p-3 space-y-2">
 <div className="h-2 bg-[#E8F2F2] rounded w-3/4" />
 <div className="h-2 bg-[#E8F2F2] rounded w-1/2" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default AdminAnnouncementManager;
