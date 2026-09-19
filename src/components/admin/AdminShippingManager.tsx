import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { ShippingProviderConfig } from '../../types';
import {
  Truck, Lock, Unlock, Shield, AlertCircle, CheckCircle2,
  Loader2, Edit, Save, Eye, EyeOff, X, RefreshCw, Key, Package
} from 'lucide-react';

export const AdminShippingManager: React.FC = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [providers, setProviders] = useState<ShippingProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ShippingProviderConfig>>({});
  const [error, setError] = useState('');
  const [showingSecrets, setShowingSecrets] = useState<Record<string, boolean>>({});

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shipping-providers');
      if (!res.ok) throw new Error('Failed to load shipping providers');
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('فشل تحميل شركات الشحن', 'Failed to load shipping providers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const openEdit = (provider: ShippingProviderConfig) => {
    setEditingId(provider.id);
    setEditForm({ ...provider, api_key: '', password: '' });
    setShowingSecrets(prev => ({ ...prev, [provider.id]: false }));
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setError('');
  };

  const handleEditChange = (field: keyof ShippingProviderConfig, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (providerId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/shipping-providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save shipping provider');
      }
      await fetchProviders();
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      setError(err.message || t('فشل حفظ الإعدادات', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (provider: ShippingProviderConfig) => {
    try {
      await fetch(`/api/admin/shipping-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !provider.enabled })
      });
      await fetchProviders();
    } catch (err: any) {
      setError(err.message || t('فشل تحديث الحالة', 'Failed to toggle status'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة شركات الشحن', 'Shipping Providers Management')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('تفعيل شركات الشحن وإعداد الرسوم والمفاتيح', 'Enable carriers and configure fees and API keys')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse">
              <div className="w-full h-24 bg-[#E8F2F2] rounded-xl mb-3" />
              <div className="h-4 bg-[#E8F2F2] rounded w-2/3 mb-2" />
              <div className="h-3 bg-[#E8F2F2] rounded w-1/3" />
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
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة شركات الشحن', 'Shipping Providers Management')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('تفعيل شركات الشحن وإعداد الرسوم والمفاتيح — الشركات المفعّلة فقط تظهر للعميل عند الدفع', 'Only enabled carriers appear at checkout')}</p>
        </div>
        <button
          onClick={fetchProviders}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#E8F2F2] border border-[#E8F2F2] font-bold flex items-center gap-2 text-xs text-[#4A6869] hover:bg-[#D0E5E5] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('تحديث', 'Refresh')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="cursor-pointer text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`p-5 rounded-3xl border space-y-4 transition ${
              editingId === provider.id
                ? 'bg-white border-[#6CC6C9] ring-2 ring-[#6CC6C9]/20'
                : provider.enabled
                ? 'bg-[#F0FAFA] border-[#E8F2F2]'
                : 'bg-[#F0FAFA]/50 border-[#E8F2F2]/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#0E5257]/10 text-[#0E5257] flex items-center justify-center">
                  {provider.id === 'store_pickup' ? <Package className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A2E30]">{language === 'ar' ? provider.name_ar : provider.name_en}</h3>
                  <div className="flex items-center gap-2 text-[10px] mt-1">
                    <span className="font-extrabold text-[#0E5257] text-sm">{provider.base_fee > 0 ? formatPrice(provider.base_fee) : t('مجاني', 'Free')}</span>
                    {provider.cod_supported && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">{t('يدعم COD', 'COD OK')}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleEnabled(provider)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  provider.enabled
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                }`}
                title={provider.enabled ? t('تعطيل', 'Disable') : t('تفعيل', 'Enable')}
              >
                {provider.enabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>

            {provider.description_ar || provider.description_en ? (
              <p className="text-xs text-[#6B8C8E] line-clamp-2">
                {language === 'ar' ? provider.description_ar : provider.description_en}
              </p>
            ) : null}

            {editingId === provider.id ? (
              <div className="space-y-3 pt-2 border-t border-[#E8F2F2]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#4A6869] mb-1">{t('رسوم الشحن (ر.س)', 'Base fee (SAR)')}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.base_fee ?? 0}
                      onChange={e => handleEditChange('base_fee', Number(e.target.value))}
                      className="w-full p-2 border border-[#E8F2F2] rounded-xl text-xs bg-[#F9FCFC]"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.cod_supported !== false}
                        onChange={e => handleEditChange('cod_supported', e.target.checked)}
                        className="w-4 h-4 accent-[#0E5257]"
                      />
                      <span className="text-xs text-[#4A6869]">{t('يدعم الدفع عند الاستلام', 'Supports COD')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#4A6869] mb-1">{t('رابط التتبع (استخدم {tracking_number})', 'Tracking URL (use {tracking_number})')}</label>
                  <input
                    type="text"
                    value={editForm.tracking_url_template || ''}
                    onChange={e => handleEditChange('tracking_url_template', e.target.value)}
                    className="w-full p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                    placeholder="https://.../tracking/{tracking_number}"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#4A6869] mb-1">{t('API Base URL (اختياري لإنشاء الشحنات تلقائياً)', 'API Base URL (optional, for auto shipment creation)')}</label>
                  <input
                    type="text"
                    value={editForm.api_base_url || ''}
                    onChange={e => handleEditChange('api_base_url', e.target.value)}
                    className="w-full p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#4A6869] mb-1">{t('API Key', 'API Key')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showingSecrets[provider.id] ? 'text' : 'password'}
                        value={editForm.api_key || ''}
                        onChange={e => handleEditChange('api_key', e.target.value)}
                        className="flex-1 p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                        placeholder={t('اتركه فارغاً للإبقاء على الحالي', 'Leave empty to keep current')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowingSecrets(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                        className="p-2 border border-[#E8F2F2] rounded-xl text-[#6B8C8E] hover:bg-[#E8F2F2] transition cursor-pointer"
                      >
                        {showingSecrets[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {provider.api_key_configured && !editForm.api_key && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                        <Key className="w-3 h-3" />
                        {t('مُخزن', 'Stored')} {provider.api_key_masked}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-[#4A6869] mb-1">{t('الحساب / اسم المستخدم', 'Account / Username')}</label>
                    <input
                      type="text"
                      value={editForm.account || ''}
                      onChange={e => handleEditChange('account', e.target.value)}
                      className="w-full p-2 border border-[#E8F2F2] rounded-xl text-xs bg-[#F9FCFC]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#4A6869] mb-1">{t('كلمة المرور (تُحفظ على السيرفر فقط)', 'Password (server-side only)')}</label>
                  <input
                    type={showingSecrets[provider.id] ? 'text' : 'password'}
                    value={editForm.password || ''}
                    onChange={e => handleEditChange('password', e.target.value)}
                    className="w-full p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                    placeholder={t('اتركه فارغاً للإبقاء على الحالي', 'Leave empty to keep current')}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.enabled !== false}
                      onChange={e => handleEditChange('enabled', e.target.checked)}
                      className="w-4 h-4 accent-[#0E5257]"
                    />
                    <span className="text-xs text-[#4A6869]">{t('مفعّلة وتظهر للعملاء', 'Enabled & visible to customers')}</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-2 rounded-xl bg-[#E8F2F2] text-xs font-bold text-[#1A2E30] hover:bg-[#D0E5E5] transition cursor-pointer"
                  >
                    {t('إلغاء', 'Cancel')}
                  </button>
                  <button
                    onClick={() => handleSave(provider.id)}
                    disabled={saving}
                    className="flex-1 px-4 py-2 rounded-xl bg-[#0E5257] text-white text-xs font-bold hover:bg-[#2B7D82] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('حفظ', 'Save')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2 border-t border-[#E8F2F2]">
                <button
                  onClick={() => openEdit(provider)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#E8F2F2] hover:bg-[#D0E5E5] text-xs font-bold text-[#1A2E30] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t('تعديل الرسوم والمفاتيح', 'Edit Fees & Keys')}
                </button>
                {provider.api_key_configured ? (
                  <span className="px-2.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('مفتاح مهيأ', 'Key set')}
                  </span>
                ) : (
                  <span className="px-2.5 py-2 rounded-xl bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                    {t('يدوي', 'Manual')}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {providers.length === 0 && (
          <div className="col-span-full p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {t('لا توجد شركات شحن مهيأة', 'No shipping providers configured')}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 space-y-1">
            <p className="font-bold">{t('كيف يعمل الظهور المشروط؟', 'How does conditional visibility work?')}</p>
            <p>{t('شركات الشحن المفعّلة فقط تظهر للعميل في صفحة الدفع بالرسوم المحددة هنا. المفاتيح تُستخدم لإنشاء الشحنات والتتبع التلقائي، وبدونها يعمل الشحن يدويًا (تنشئ البوليصة من موقع الشركة وتدخل رقم التتبع).', 'Only enabled carriers appear at checkout with the fees set here. API keys enable automatic label creation; without them shipping works manually.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShippingManager;
