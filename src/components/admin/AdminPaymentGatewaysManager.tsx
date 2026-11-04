import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentGatewayConfig } from '../../types';
import {
  CreditCard, ExternalLink, Lock, Unlock, Shield, AlertCircle,
  CheckCircle2, XCircle, Loader2, Edit, Save, Eye, EyeOff,
  X, Zap, RefreshCw, Key, Wifi, WifiOff
} from 'lucide-react';

export const AdminPaymentGatewaysManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentGatewayConfig>>({});
  const [error, setError] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showingSecrets, setShowingSecrets] = useState<Record<string, boolean>>({});

  const fetchGateways = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-gateways');
      if (!res.ok) throw new Error('Failed to load payment gateways');
      const data = await res.json();
      setGateways(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('فشل تحميل بوابات الدفع', 'Failed to load payment gateways'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const openEdit = (gateway: PaymentGatewayConfig) => {
    setEditingId(gateway.id);
    setEditForm({
      ...gateway,
      secret_key: '',
      webhook_secret: ''
    });
    setShowingSecrets(prev => ({ ...prev, [gateway.id]: false }));
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setError('');
  };

  const handleEditChange = (field: keyof PaymentGatewayConfig, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (gatewayId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/payment-gateways/${gatewayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save payment gateway');
      }
      await fetchGateways();
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      setError(err.message || t('فشل حفظ الإعدادات', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (gatewayId: string) => {
    setTestingId(gatewayId);
    setError('');
    try {
      const res = await fetch(`/api/admin/payment-gateways/${gatewayId}/test`, { method: 'POST' });
      const result = await res.json();
      await fetchGateways();
      if (result.status === 'error') {
        setError(t('اختبار الاتصال فشل: ', 'Connection test failed: ') + (result.message || ''));
      }
    } catch (err: any) {
      setError(err.message || t('فشل اختبار الاتصال', 'Connection test failed'));
    } finally {
      setTestingId(null);
    }
  };

  const toggleEnabled = async (gateway: PaymentGatewayConfig) => {
    try {
      await fetch(`/api/admin/payment-gateways/${gateway.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !gateway.enabled })
      });
      await fetchGateways();
    } catch (err: any) {
      setError(err.message || t('فشل تحديث الحالة', 'Failed to toggle status'));
    }
  };

  const getModeBadge = (mode: 'test' | 'live') => {
    if (mode === 'live') {
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">{t('إنتاج', 'Live')}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">{t('اختبار', 'Test')}</span>;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة بوابات الدفع', 'Payment Gateways Management')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إعداد واختبار بوابات الدفع المختلفة', 'Configure and test payment gateway integrations')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse">
              <div className="w-full h-32 bg-[#E8F2F2] rounded-xl mb-3" />
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
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة بوابات الدفع', 'Payment Gateways Management')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إعداد واختبار بوابات الدفع المختلفة', 'Configure and test payment gateway integrations')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchGateways}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#E8F2F2] border border-[#E8F2F2] font-bold flex items-center gap-2 text-xs text-[#4A6869] hover:bg-[#D0E5E5] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('تحديث', 'Refresh')}
          </button>
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map(gateway => (
          <div
            key={gateway.id}
            className={`p-5 rounded-3xl border space-y-4 transition ${
              editingId === gateway.id
                ? 'bg-white border-[#6CC6C9] ring-2 ring-[#6CC6C9]/20'
                : gateway.enabled
                ? 'bg-[#F0FAFA] border-[#E8F2F2]'
                : 'bg-[#F0FAFA]/50 border-[#E8F2F2]/50 opacity-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl flex items-center justify-center ${
                  gateway.id === 'stripe' ? 'bg-blue-500/10 text-blue-600' :
                  gateway.id === 'cod' ? 'bg-emerald-500/10 text-emerald-600' :
                  gateway.id === 'tabby' ? 'bg-purple-500/10 text-purple-600' :
                  gateway.id === 'tamara' ? 'bg-pink-500/10 text-pink-600' :
                  'bg-amber-500/10 text-amber-600'
                }`}>
                  {gateway.id === 'stripe' && <CreditCard className="w-5 h-5" />}
                  {gateway.id === 'cod' && <Zap className="w-5 h-5" />}
                  {['tabby', 'tamara'].includes(gateway.id) && <Shield className="w-5 h-5" />}
                  {gateway.id === 'paymob' && <ExternalLink className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A2E30]">{language === 'ar' ? gateway.name_ar : gateway.name_en}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-[#6B8C8E]">
                    {getModeBadge(gateway.mode)}
                    {gateway.currency && <span className="px-1.5 py-0.5 rounded bg-[#E8F2F2] text-[#4A6869] font-mono">{gateway.currency}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleEnabled(gateway)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    gateway.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                  }`}
                  title={gateway.enabled ? t('تعطيل', 'Disable') : t('تفعيل', 'Enable')}
                >
                  {gateway.enabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Description */}
            {gateway.description_ar || gateway.description_en ? (
              <p className="text-xs text-[#6B8C8E] line-clamp-2">
                {language === 'ar' ? gateway.description_ar : gateway.description_en}
              </p>
            ) : null}

            {/* Supported Methods */}
            {gateway.supported_methods?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {gateway.supported_methods.map(method => (
                  <span
                    key={method}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#E8F2F2] text-[#4A6869]"
                  >
                    {method.toUpperCase()}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Edit Form or Actions */}
            {editingId === gateway.id ? (
              <div className="space-y-3 pt-2 border-t border-[#E8F2F2]">
                <div>
                  <label className="block text-xs text-[#4A6869] mb-1">{t('Publishable Key / Public Key', 'Publishable Key')}</label>
                  <input
                    type="text"
                    value={editForm.publishable_key || ''}
                    onChange={e => handleEditChange('publishable_key', e.target.value)}
                    className="w-full p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                    placeholder={t('مفتاح عام', 'Public key...')}
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs text-[#4A6869] mb-1">{t('Secret Key / API Secret', 'Secret Key')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showingSecrets[gateway.id] ? 'text' : 'password'}
                      value={editForm.secret_key || ''}
                      onChange={e => handleEditChange('secret_key', e.target.value)}
                      className="flex-1 p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                      placeholder={t('اتركه فارغاً للإبقاء على الحالي', 'Leave empty to keep current')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowingSecrets(prev => ({ ...prev, [gateway.id]: !prev[gateway.id] }))}
                      className="p-2 border border-[#E8F2F2] rounded-xl text-[#6B8C8E] hover:bg-[#E8F2F2] transition cursor-pointer"
                      title={t('إظهار/إخفاء', 'Show/Hide')}
                    >
                      {showingSecrets[gateway.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {gateway.secret_key_configured && !editForm.secret_key && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        {t('مُخزن', 'Stored')} {gateway.secret_key_masked}
                      </span>
                    )}
                  </div>
                </div>

                {gateway.id === 'stripe' && gateway.webhook_secret_configured && (
                  <div className="relative">
                    <label className="block text-xs text-[#4A6869] mb-1">{t('Webhook Secret', 'Webhook Secret')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showingSecrets[gateway.id] ? 'text' : 'password'}
                        value={editForm.webhook_secret || ''}
                        onChange={e => handleEditChange('webhook_secret', e.target.value)}
                        className="flex-1 p-2 border border-[#E8F2F2] rounded-xl text-xs font-mono bg-[#F9FCFC]"
                        placeholder={t('اتركه فارغاً للإبقاء على الحالي', 'Leave empty to keep current')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowingSecrets(prev => ({ ...prev, [gateway.id]: !prev[gateway.id] }))}
                        className="p-2 border border-[#E8F2F2] rounded-xl text-[#6B8C8E] hover:bg-[#E8F2F2] transition cursor-pointer"
                      >
                        {showingSecrets[gateway.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        {t('مُخزن', 'Stored')} {gateway.webhook_secret_masked}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.enabled !== false}
                      onChange={e => handleEditChange('enabled', e.target.checked)}
                      className="w-4 h-4 accent-[#0E5257]"
                    />
                    <span className="text-xs text-[#4A6869]">{t('مفعّل', 'Enabled')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer ml-4">
                    <select
                      value={editForm.mode || 'test'}
                      onChange={e => handleEditChange('mode', e.target.value)}
                      className="w-24 p-1.5 border border-[#E8F2F2] rounded-xl text-xs"
                    >
                      <option value="test">{t('اختبار', 'Test')}</option>
                      <option value="live">{t('إنتاج', 'Live')}</option>
                    </select>
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
                    onClick={() => handleSave(gateway.id)}
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
                  onClick={() => openEdit(gateway)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#E8F2F2] hover:bg-[#D0E5E5] text-xs font-bold text-[#1A2E30] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t('تعديل', 'Edit')}
                </button>
                <button
                  onClick={() => handleTest(gateway.id)}
                  disabled={testingId === gateway.id}
                  className="px-3 py-2 rounded-xl bg-[#0E5257] hover:bg-[#2B7D82] text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {testingId === gateway.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : gateway.test_status === 'connected' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : gateway.test_status === 'error' ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  <span>{testingId === gateway.id ? t('جاري الاختبار...', 'Testing...') : t('اختبار', 'Test')}</span>
                </button>
              </div>
            )}

            {/* Test Status */}
            {gateway.test_status && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                gateway.test_status === 'connected' ? 'bg-emerald-50 text-emerald-700' :
                gateway.test_status === 'error' ? 'bg-red-50 text-red-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {getStatusIcon(gateway.test_status)}
                <span className="flex-1">{gateway.test_message || (
                  gateway.test_status === 'connected' ? t('الاتصال ناجح', 'Connection successful') :
                  gateway.test_status === 'error' ? t('فشل الاتصال', 'Connection failed') :
                  t('لم يتم الاختبار بعد', 'Not tested yet')
                )}</span>
              </div>
            )}
          </div>
        ))}

        {gateways.length === 0 && (
          <div className="col-span-full p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {t('لا توجد بوابات دفع مهيأة', 'No payment gateways configured')}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 space-y-1">
            <p className="font-bold">{t('تنبيه أمني', 'Security Notice')}</p>
            <p>{t('لا يتم كشف مفاتيح API السرية (Secret Keys / Webhook Secrets) في الواجهة الأمامية أبداً. عند الحفظ، تُرسل القيم الجديدة فقط، وتُخزّن بأمان في قاعدة البيانات/متغيرات البيئة على الخادم.', 'API secret keys (Secret Keys / Webhook Secrets) are never exposed in the frontend. When saving, only new values are sent and stored securely in the database/server environment variables.')}</p>
            <p>{t('القيم المعروضة هنا مخفية (••••••••••••1234) وتدل فقط على أن المفتاح مُخزن.', 'Displayed values are masked (••••••••••••1234) and only indicate that a key is stored.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentGatewaysManager;