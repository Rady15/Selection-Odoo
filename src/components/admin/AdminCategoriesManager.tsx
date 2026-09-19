import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
 Plus, Trash2, Edit, X, Grid3X3, Image, Star, StarOff, Loader2
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

interface Category {
 id: string;
 name_ar: string;
 name_en: string;
 description_ar: string;
 description_en: string;
 slug: string;
 image: string;
 icon: string;
 sort_order: number;
 featured: boolean;
}

const emptyCategory: Category = {
 id: '',
 name_ar: '',
 name_en: '',
 description_ar: '',
 description_en: '',
 slug: '',
 image: '',
 icon: '',
 sort_order: 0,
 featured: false,
};

export const AdminCategoriesManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Category>(emptyCategory);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState('');

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data.sort((a: Category, b: Category) => a.sort_order - b.sort_order) : []);
      setSelectedIds(new Set());
    } catch {
      setError(t('فشل في تحميل الأقسام', 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyCategory, sort_order: categories.length + 1 });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ ...cat });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error_ar || data.error_en || 'Save failed');
      }
      setShowModal(false);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || t('فشل في الحفظ', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (cat: Category) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cat, featured: !cat.featured }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error_ar || data.error_en || 'Failed to toggle featured');
      }
      await loadCategories();
    } catch (err: any) {
      setError(err.message || t('فشل تحديث حالة التمييز', 'Failed to toggle featured status'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCat) return;
    setDeletingId(deleteConfirmCat.id);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${deleteConfirmCat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error_ar || data.error_en || t('فشل في الحذف', 'Failed to delete'));
      }
      setDeleteConfirmCat(null);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || t('فشل في الحذف', 'Failed to delete'));
    } finally {
      setDeletingId(null);
    }
  };

  const updateField = (field: keyof Category, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
    if (selectedIds.size === categories.length && categories.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(categories.map(c => c.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size < 1) return;
    setBulkDeleting(true);
    setBulkResult('');
    try {
      const result = await bulkDeleteRequest('categories', [...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      await loadCategories();
      if (result.skipped > 0) {
        setError(t(
          `تم حذف ${result.deleted} قسم، وتم تخطي ${result.skipped} قسم لاحتوائها على منتجات مرتبطة.`,
          `Deleted ${result.deleted} categories, skipped ${result.skipped} with linked products.`
        ));
      }
    } catch (err: any) {
      setBulkResult(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة الأقسام', 'Categories Manager')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة أقسام المنتجات', 'Manage product categories')}</p>
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
          <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('إدارة الأقسام', 'Categories Manager')}</h1>
          <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة أقسام المنتجات', 'Manage product categories')}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('إضافة قسم', 'Add Category')}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      <BulkDeleteBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => setShowBulkConfirm(true)}
        deleting={bulkDeleting}
      />
      {bulkResult && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{bulkResult}</div>}

      <div className="flex items-center gap-2 text-xs text-[#6B8C8E]">
        <input
          type="checkbox"
          checked={categories.length > 0 && selectedIds.size === categories.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 accent-[#0E5257] cursor-pointer"
        />
        <span>{t('تحديد كل الأقسام', 'Select all categories')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className={`p-5 rounded-3xl border space-y-3 transition ${selectedIds.has(cat.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
            <div className="flex items-center justify-between">
              <input
                type="checkbox"
                checked={selectedIds.has(cat.id)}
                onChange={() => toggleSelect(cat.id)}
                className="w-4 h-4 accent-[#0E5257] cursor-pointer"
                title={t('تحديد', 'Select')}
              />
              <span className="text-[9px] text-[#6B8C8E] bg-[#E8F2F2] px-2 py-0.5 rounded font-bold">
                #{cat.sort_order}
              </span>
            </div>
            <div className="w-full h-32 rounded-xl overflow-hidden bg-[#E8F2F2] flex items-center justify-center">
              {cat.image ? (
                <img src={cat.image} alt={language === 'ar' ? cat.name_ar : cat.name_en} className="w-full h-full object-cover" />
              ) : (
                <Image className="w-8 h-8 text-[#6B8C8E]" />
              )}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[#1A2E30] text-sm">{language === 'ar' ? cat.name_ar : cat.name_en}</h3>
                <p className="text-[10px] text-[#6B8C8E] font-mono">/{cat.slug}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#E8F2F2]">
              <button
                type="button"
                onClick={() => toggleFeatured(cat)}
                className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
                  cat.featured ? 'text-[#0E5257]' : 'text-[#6B8C8E] hover:text-[#0E5257]'
                }`}
                title={t('تبديل التمييز', 'Toggle featured')}
              >
                {cat.featured ? <Star className="w-3.5 h-3.5 fill-[#0E5257] text-[#0E5257]" /> : <StarOff className="w-3.5 h-3.5" />}
                {cat.featured ? t('مميز', 'Featured') : t('عادي', 'Normal')}
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 rounded-lg bg-[#0E5257]/10 text-[#0E5257] hover:bg-[#0E5257] hover:text-white transition cursor-pointer"
                  title={t('تعديل', 'Edit')}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirmCat(cat)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition cursor-pointer"
                  title={t('حذف', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
            <Grid3X3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {t('لا توجد أقسام', 'No categories yet')}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => !deletingId && setDeleteConfirmCat(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-[#1A2E30] space-y-4 shadow-2xl z-50">
            <h3 className="text-lg font-bold text-red-600">{t('تأكيد حذف القسم', 'Confirm Category Deletion')}</h3>
            <p className="text-xs text-[#6B8C8E]">
              {t(
                `هل أنت متأكد من حذف القسم "${deleteConfirmCat.name_ar}"؟ لا يمكن حذف قسم يحتوي على منتجات مرتبطة به.`,
                `Are you sure you want to delete "${deleteConfirmCat.name_en}"? Categories containing products cannot be deleted.`
              )}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteConfirmCat(null)}
                className="px-4 py-2 rounded-xl bg-[#E8F2F2] text-xs font-bold text-[#1A2E30] hover:bg-[#D0E5E5] transition"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-2"
              >
                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('نعم، احذف', 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <BulkDeleteConfirm
          count={selectedIds.size}
          entityLabel={t('قسم', 'categories')}
          skippedMessage={t('الأقسام المرتبطة بمنتجات سيتم تخطيها تلقائياً.', 'Categories with linked products will be skipped automatically.')}
          onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
          onConfirm={handleBulkDelete}
          confirming={bulkDeleting}
        />
      )}

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-3xl p-6 shadow-2xl z-50 space-y-4 text-xs">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#6B8C8E] hover:text-[#0E5257] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-[#1A2E30]">
              {editingId ? t('تعديل القسم', 'Edit Category') : t('إضافة قسم جديد', 'Add New Category')}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('الاسم بالعربي', 'Arabic Name')}*</label>
                  <input type="text" required value={form.name_ar} onChange={e => updateField('name_ar', e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('الاسم بالإنجليزي', 'English Name')}*</label>
                  <input type="text" required value={form.name_en} onChange={e => updateField('name_en', e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('الوصف بالعربي', 'Arabic Description')}</label>
                  <textarea rows={2} value={form.description_ar} onChange={e => updateField('description_ar', e.target.value)} className="w-full p-2 border rounded-xl resize-none" />
                </div>
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('الوصف بالإنجليزي', 'English Description')}</label>
                  <textarea rows={2} value={form.description_en} onChange={e => updateField('description_en', e.target.value)} className="w-full p-2 border rounded-xl resize-none" />
                </div>
              </div>

              <div>
                <label className="block text-[#4A6869] mb-1 font-semibold">{t('الرابط المختصر', 'Slug')}*</label>
                <input type="text" required value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="category-slug" className="w-full p-2 border rounded-xl font-mono" />
              </div>

              <ImageUploader value={form.image} onChange={val => updateField('image', val)} label={t('صورة الفئة (تظهر في المتجر)', 'Category image (shown in storefront)')} required />

              <div>
                <label className="block text-[#4A6869] mb-1 font-semibold">{t('الأيقونة', 'Icon')}</label>
                <input type="text" value={form.icon} onChange={e => updateField('icon', e.target.value)} placeholder="coffee" className="w-full p-2 border rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A6869] mb-1 font-semibold">{t('ترتيب العرض', 'Sort Order')}</label>
                  <input type="number" required value={form.sort_order} onChange={e => updateField('sort_order', Number(e.target.value))} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => updateField('featured', e.target.checked)} className="w-4 h-4 accent-[#0E5257]" />
                    <span className="text-[#4A6869] font-semibold">{t('قسم مميز', 'Featured Category')}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-3 rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? t('حفظ التعديلات', 'Save Changes') : t('إضافة القسم', 'Add Category')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesManager;
