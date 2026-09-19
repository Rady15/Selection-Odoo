import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Coupon } from '../../types';
import { Tag, Plus, Trash2, Edit, X, Percent, DollarSign, Truck, Loader2 } from 'lucide-react';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

export const AdminCouponsManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<Coupon | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(100);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [validUntil, setValidUntil] = useState('2027-12-31');
  const [usageLimit, setUsageLimit] = useState(500);

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingCoupon(null);
    resetForm();
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinOrderAmount(c.min_order_amount);
    setMaxDiscount(c.max_discount_amount || 0);
    setValidUntil(c.valid_until.slice(0, 10));
    setUsageLimit(c.usage_limit);
    setError('');
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: any = {
        id: editingCoupon ? editingCoupon.id : `coup-${Date.now()}`,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === 'free_shipping' ? 0 : Number(discountValue),
        min_order_amount: Number(minOrderAmount),
        max_discount_amount: discountType === 'percentage' && Number(maxDiscount) > 0 ? Number(maxDiscount) : undefined,
        valid_until: validUntil,
        usage_count: editingCoupon ? editingCoupon.usage_count : 0,
        usage_limit: Number(usageLimit),
        is_active: true
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error_ar || errJson.error || 'Failed to save coupon');
      }
      setShowModal(false);
      resetForm();
      await loadCoupons();
    } catch (err: any) {
      setError(err.message || t('فشل حفظ الكوبون', 'Failed to save coupon'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteConfirmCoupon) return;
    setDeletingId(deleteConfirmCoupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteConfirmCoupon.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error_ar || errJson.error || 'Failed to delete coupon');
      }
      setDeleteConfirmCoupon(null);
      await loadCoupons();
    } catch (err: any) {
      alert(err.message || t('فشل حذف الكوبون', 'Failed to delete coupon'));
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderAmount(100);
    setMaxDiscount(0);
    setValidUntil('2027-12-31');
    setUsageLimit(500);
    setEditingCoupon(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === coupons.length && coupons.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(coupons.map(c => c.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size < 1) return;
    setBulkDeleting(true);
    setBulkError('');
    try {
      await bulkDeleteRequest('coupons', [...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      await loadCoupons();
    } catch (err: any) {
      setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const getDiscountBadge = (c: Coupon) => {
    if (c.discount_type === 'percentage') return `-${c.discount_value}%`;
    if (c.discount_type === 'fixed') return `-${c.discount_value} ﷼`;
    return t('شحن مجاني', 'Free Ship');
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed': return <DollarSign className="w-4 h-4" />;
      case 'free_shipping': return <Truck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('كوبونات الخصم والعروض', 'Coupons & Promo Codes')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة وتوليد كوبونات الخصم الترويجية', 'Manage promo discount codes')}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('إضافة كوبون', 'Add Coupon')}</span>
        </button>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => setShowBulkConfirm(true)}
        deleting={bulkDeleting}
      />
      {bulkError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{bulkError}</div>}
      {showBulkConfirm && (
        <BulkDeleteConfirm
          count={selectedIds.size}
          entityLabel={t('كوبون', 'coupons')}
          onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
          onConfirm={handleBulkDelete}
          confirming={bulkDeleting}
        />
      )}

      {coupons.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#6B8C8E]">
          <input
            type="checkbox"
            checked={selectedIds.size === coupons.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-[#0E5257] cursor-pointer"
          />
          <span>{t('تحديد كل الكوبونات', 'Select all coupons')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-[#6B8C8E]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E5257]" />
            {t('جاري التحميل...', 'Loading...')}
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
            {t('لا توجد كوبونات مضافة', 'No coupons created yet')}
          </div>
        ) : (
          coupons.map(c => (
            <div key={c.id} className={`p-5 rounded-3xl border space-y-3 transition ${selectedIds.has(c.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="w-4 h-4 accent-[#0E5257] cursor-pointer"
                    title={t('تحديد', 'Select')}
                  />
                  <span className="font-extrabold text-lg text-[#0E5257] font-mono tracking-wider">{c.code}</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                  c.discount_type === 'free_shipping' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                  {getDiscountIcon(c.discount_type)}
                  {getDiscountBadge(c)}
                </span>
              </div>

              <p className="text-xs text-[#6B8C8E]">
                {t('الحد الأدنى:', 'Min:')} <strong className="text-[#1A2E30]">{c.min_order_amount} ﷼</strong>
                {c.max_discount_amount ? <>, {t('حد أقصى للخصم:', 'Max:')} <strong className="text-[#1A2E30]">{c.max_discount_amount} ﷼</strong></> : null}
              </p>
              <p className="text-xs text-[#6B8C8E]">
                {t('صالح حتى:', 'Valid until:')} <strong className="text-[#1A2E30]">{c.valid_until}</strong>
              </p>

              <div className="flex justify-between items-center pt-2 border-t border-[#E8F2F2] text-xs">
                <span className="text-[#6B8C8E]">{t('الاستخدام:', 'Used:')} {c.usage_count}/{c.usage_limit}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-1 text-[#0E5257] hover:text-[#2B7D82] cursor-pointer" title={t('تعديل', 'Edit')}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirmCoupon(c)} className="p-1 text-red-500 hover:text-red-700 cursor-pointer" title={t('حذف', 'Delete')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => !deletingId && setDeleteConfirmCoupon(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-[#1A2E30] space-y-4 shadow-2xl z-50">
            <h3 className="text-lg font-bold text-red-600">{t('تأكيد حذف الكوبون', 'Confirm Coupon Deletion')}</h3>
            <p className="text-xs text-[#6B8C8E]">
              {t(`هل أنت متأكد من حذف الكود "${deleteConfirmCoupon.code}"؟`, `Are you sure you want to delete coupon "${deleteConfirmCoupon.code}"?`)}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteConfirmCoupon(null)}
                className="px-4 py-2 rounded-xl bg-[#E8F2F2] text-xs font-bold text-[#1A2E30] hover:bg-[#D0E5E5] transition cursor-pointer"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleDeleteCoupon}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-2 cursor-pointer"
              >
                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('نعم، احذف', 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative w-full max-w-md bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-3xl p-6 shadow-2xl z-50 space-y-4 text-xs">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#6B8C8E] hover:text-[#0E5257] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-[#1A2E30]">
              {editingCoupon ? t('تعديل الكوبون', 'Edit Coupon') : t('إضافة كوبون خصم جديد', 'Create New Coupon')}
            </h3>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block text-[#4A6869] mb-1 font-semibold">{t('كود الخصم', 'Coupon Code')}</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="WELCOME10"
                  className="w-full uppercase font-mono p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[#4A6869] mb-1 font-semibold">{t('نوع الخصم', 'Discount Type')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['percentage', 'fixed', 'free_shipping'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDiscountType(type)}
                      className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                        discountType === type ? 'bg-[#0E5257] border-[#0E5257] text-white' : 'bg-[#F0FAFA] border-[#E8F2F2] text-[#4A6869]'
                      }`}
                    >
                      {type === 'percentage' ? t('نسبة %', '%') : type === 'fixed' ? t('مبلغ ثابت', 'Fixed') : t('شحن مجاني', 'Free Ship')}
                    </button>
                  ))}
                </div>
              </div>

              {discountType !== 'free_shipping' && (
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">
                    {discountType === 'percentage' ? t('نسبة الخصم %', 'Discount %') : t('مبلغ الخصم (﷼)', 'Discount Amount (SAR)')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              )}

              {discountType === 'percentage' && (
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('حد أقصى للخصم (﷼ - 0 بدون حد)', 'Max Discount (SAR - 0 for unlimited)')}</label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount}
                    onChange={e => setMaxDiscount(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('الحد الأدنى للطلب (﷼)', 'Min Order (SAR)')}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minOrderAmount}
                    onChange={e => setMinOrderAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('حد الاستخدام', 'Usage Limit')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={usageLimit}
                    onChange={e => setUsageLimit(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4A6869] mb-1 font-semibold">{t('صالح حتى', 'Valid Until')}</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCoupon ? t('حفظ التعديلات', 'Save Changes') : t('حفظ الكوبون', 'Save Coupon')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsManager;