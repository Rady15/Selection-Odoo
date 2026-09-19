import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
 Store, Truck, Phone, Share2, Award, Save, Loader2, Check
} from 'lucide-react';

interface Settings {
 store_name_ar: string;
 store_name_en: string;
 vat_number: string;
 vat_rate: number;
 free_shipping_threshold: number;
 default_currency: string;
 support_phone: string;
 support_email: string;
 whatsapp_number: string;
 address_ar: string;
 address_en: string;
 instagram_url: string;
 twitter_url: string;
 tiktok_url: string;
 enable_loyalty: boolean;
 points_per_sar: number;
 sar_per_point: number;
}

const defaultSettings: Settings = {
 store_name_ar: '',
 store_name_en: '',
 vat_number: '',
 vat_rate: 15,
 free_shipping_threshold: 199,
 default_currency: 'SAR',
 support_phone: '',
 support_email: '',
 whatsapp_number: '',
 address_ar: '',
 address_en: '',
 instagram_url: '',
 twitter_url: '',
 tiktok_url: '',
 enable_loyalty: false,
 points_per_sar: 1,
 sar_per_point: 0.05,
};

export const AdminSettingsManager: React.FC = () => {
 const { language, t } = useLanguage();
 const [settings, setSettings] = useState<Settings>(defaultSettings);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [saved, setSaved] = useState(false);

 useEffect(() => { loadSettings(); }, []);

 const loadSettings = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await fetch('/api/admin/settings');
 if (res.ok) {
 const data = await res.json();
 setSettings({ ...defaultSettings, ...data, vat_rate: Number(data.vat_rate ?? 0.15) * 100, sar_per_point: Number(data.sar_per_point ?? 0.05) });
 }
 } catch {
 setError(t('فشل في تحميل الإعدادات', 'Failed to load settings'));
 } finally {
 setLoading(false);
 }
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 setSaving(true);
 setError(null);
 try {
 const res = await fetch('/api/admin/settings', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...settings, vat_rate: Number(settings.vat_rate) / 100, sar_per_point: Number(settings.sar_per_point) }),
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

 const updateField = <K extends keyof Settings>(field: K, value: Settings[K]) => {
 setSettings(prev => ({ ...prev, [field]: value }));
 };

 const sections = [
 {
 icon: Store,
 titleAr: 'معلومات المتجر',
 titleEn: 'Store Info',
 fields: (
 <>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('اسم المتجر بالعربي', 'Arabic Store Name')}</label>
 <input type="text" value={settings.store_name_ar} onChange={e => updateField('store_name_ar', e.target.value)}
 className="w-full " />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('اسم المتجر بالإنجليزي', 'English Store Name')}</label>
 <input type="text" value={settings.store_name_en} onChange={e => updateField('store_name_en', e.target.value)}
 className="w-full " />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('رقم ضريبة القيمة المضافة', 'VAT Number')}</label>
 <input type="text" value={settings.vat_number} onChange={e => updateField('vat_number', e.target.value)}
 className="w-full " />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('نسبة ضريبة القيمة المضافة %', 'VAT Rate %')}</label>
 <input type="number" value={settings.vat_rate} onChange={e => updateField('vat_rate', Number(e.target.value))}
 className="w-full " />
 </div>
 </div>
 </>
 ),
 },
 {
 icon: Truck,
 titleAr: 'الشحن',
 titleEn: 'Shipping',
 fields: (
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">
 {t('الحد الأدنى للشحن المجاني (﷼)', 'Free Shipping Threshold (﷼)')}
 </label>
 <input type="number" value={settings.free_shipping_threshold}
 onChange={e => updateField('free_shipping_threshold', Number(e.target.value))}
 className="w-full " />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('العملة الافتراضية', 'Default Currency')}</label>
 <select value={settings.default_currency} onChange={e => updateField('default_currency', e.target.value)}
 className="w-full ">
 <option value="SAR">SAR (﷼)</option>
 <option value="USD">USD ($)</option>
 <option value="AED">AED</option>
 </select>
 </div>
 </div>
 ),
 },
 {
 icon: Phone,
 titleAr: 'التواصل',
 titleEn: 'Contact',
 fields: (
 <>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('رقم الهاتف', 'Support Phone')}</label>
 <input type="tel" value={settings.support_phone} onChange={e => updateField('support_phone', e.target.value)}
 className="w-full " />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('البريد الإلكتروني', 'Support Email')}</label>
 <input type="email" value={settings.support_email} onChange={e => updateField('support_email', e.target.value)}
 className="w-full " />
 </div>
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('رقم واتساب', 'WhatsApp Number')}</label>
 <input type="tel" value={settings.whatsapp_number} onChange={e => updateField('whatsapp_number', e.target.value)}
 className="w-full " />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('العنوان بالعربي', 'Arabic Address')}</label>
 <textarea rows={2} value={settings.address_ar} onChange={e => updateField('address_ar', e.target.value)}
 className="w-full resize-none" />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('العنوان بالإنجليزي', 'English Address')}</label>
 <textarea rows={2} value={settings.address_en} onChange={e => updateField('address_en', e.target.value)}
 className="w-full resize-none" />
 </div>
 </div>
 </>
 ),
 },
 {
 icon: Share2,
 titleAr: 'وسائل التواصل الاجتماعي',
 titleEn: 'Social Media',
 fields: (
 <div className="space-y-3">
 {[
 { field: 'instagram_url' as const, label: 'Instagram' },
 { field: 'twitter_url' as const, label: 'Twitter / X' },
 { field: 'tiktok_url' as const, label: 'TikTok' },
 ].map(s => (
 <div key={s.field}>
 <label className="block text-[#4A6869] mb-1 font-semibold">{s.label}</label>
 <input type="url" value={settings[s.field]} onChange={e => updateField(s.field, e.target.value)}
 placeholder="https://..."
 className="w-full " />
 </div>
 ))}
 </div>
 ),
 },
 {
 icon: Award,
 titleAr: 'برنامج الولاء',
 titleEn: 'Loyalty Program',
 fields: (
 <>
 <div className="flex items-center justify-between">
 <label className="text-[#4A6869] font-semibold">{t('تفعيل برنامج الولاء', 'Enable Loyalty Program')}</label>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" checked={settings.enable_loyalty}
 onChange={e => updateField('enable_loyalty', e.target.checked)} className="sr-only peer" />
 <div className="w-11 h-6 bg-[#E8F2F2] rounded-full peer peer-checked:bg-[#0E5257] peer-focus:ring-2 peer-focus:ring-[#6CC6C9]/30 after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:-translate-x-full" />
 </label>
 </div>
 {settings.enable_loyalty && (
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('نقاط لكل ﷼', 'Points per SAR')}</label>
 <input type="number" value={settings.points_per_sar}
 onChange={e => updateField('points_per_sar', Number(e.target.value))}
 className="w-full " />
 </div>
 <div>
 <label className="block text-[#4A6869] mb-1 font-semibold">{t('﷼ لكل نقطة', 'SAR per Point')}</label>
 <input type="number" value={settings.sar_per_point}
 onChange={e => updateField('sar_per_point', Number(e.target.value))}
 className="w-full " />
 </div>
 </div>
 )}
 </>
 ),
 },
 ];

 if (loading) {
 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إعدادات المتجر', 'Store Settings')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إعدادات المتجر العامة', 'General store configuration')}</p>
 </div>
 <div className="space-y-4">
 {[1, 2, 3].map(i => (
 <div key={i} className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse space-y-4">
 <div className="h-5 bg-[#E8F2F2] rounded w-1/4" />
 <div className="h-10 bg-[#E8F2F2] rounded-xl w-full" />
 <div className="h-10 bg-[#E8F2F2] rounded-xl w-full" />
 </div>
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إعدادات المتجر', 'Store Settings')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إعدادات المتجر العامة', 'General store configuration')}</p>
 </div>
 </div>

 {error && (
 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
 {error}
 </div>
 )}

 {saved && (
 <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
 <Check className="w-4 h-4" />
 {t('تم حفظ الإعدادات بنجاح', 'Settings saved successfully')}
 </div>
 )}

 <form onSubmit={handleSave} className="space-y-4">
 {sections.map(section => (
 <div key={section.titleEn} className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4">
 <div className="flex items-center gap-2">
 <section.icon className="w-5 h-5 text-[#6CC6C9]" />
 <h3 className="font-bold text-sm text-[#1A2E30]">{t(section.titleAr, section.titleEn)}</h3>
 </div>
 {section.fields}
 </div>
 ))}

 <button type="submit" disabled={saving}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50">
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
 {saving ? t('جاري الحفظ...', 'Saving...') : saved ? t('تم الحفظ!', 'Saved!') : t('حفظ جميع الإعدادات', 'Save All Settings')}
 </button>
 </form>
 </div>
 );
};

export default AdminSettingsManager;
