import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Banner } from '../../types';
import { Image, Plus, Trash2, Edit, X, Eye, EyeOff, Palette, Loader2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

export const AdminBannersManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subtitleAr, setSubtitleAr] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState<Banner['position']>('mid_page');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bgColor, setBgColor] = useState('#F0FAFA');
  const [textColor, setTextColor] = useState('#6CC6C9');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitleAr('');
    setTitleEn('');
    setSubtitleAr('');
    setSubtitleEn('');
    setImageUrl('');
    setLinkUrl('');
    setPosition('mid_page');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setBgColor('#F0FAFA');
    setTextColor('#6CC6C9');
    setSortOrder(0);
    setEditingBanner(null);
    setError('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitleAr(banner.title_ar);
    setTitleEn(banner.title_en);
    setSubtitleAr(banner.subtitle_ar);
    setSubtitleEn(banner.subtitle_en);
    setImageUrl(banner.image_url);
    setLinkUrl(banner.link_url);
    setPosition(banner.position);
    setIsActive(banner.is_active);
    setStartDate(banner.start_date || '');
    setEndDate(banner.end_date || '');
    setBgColor(banner.bg_color);
    setTextColor(banner.text_color);
    setSortOrder(banner.sort_order);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const bannerData = {
      id: editingBanner?.id || `banner-${Date.now()}`,
      title_ar: titleAr,
      title_en: titleEn,
      subtitle_ar: subtitleAr,
      subtitle_en: subtitleEn,
      image_url: imageUrl,
      link_url: linkUrl,
      position,
      is_active: isActive,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      bg_color: bgColor,
      text_color: textColor,
      sort_order: sortOrder,
      created_at: editingBanner?.created_at || new Date().toISOString()
    };

    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error_ar || errJson.error || 'Failed to save banner');
      }

      setShowModal(false);
      resetForm();
      await loadBanners();
    } catch (err: any) {
      setError(err.message || t('فشل حفظ البانر', 'Failed to save banner'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmBanner) return;
    setDeletingId(deleteConfirmBanner.id);
    try {
      const res = await fetch(`/api/admin/banners/${deleteConfirmBanner.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error_ar || errJson.error || 'Failed to delete banner');
      }
      setDeleteConfirmBanner(null);
      await loadBanners();
    } catch (err: any) {
      alert(err.message || t('فشل حذف البانر', 'Failed to delete banner'));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, is_active: !banner.is_active })
      });
      if (res.ok) {
        await loadBanners();
      }
    } catch (err) {
      console.error(err);
    }
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
    if (selectedIds.size === banners.length && banners.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(banners.map(b => b.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size < 1) return;
    setBulkDeleting(true);
    setBulkError('');
    try {
      await bulkDeleteRequest('banners', [...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      await loadBanners();
    } catch (err: any) {
      setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
    } finally {
      setBulkDeleting(false);
    }
  };

 const getPositionBadge = (pos: string) => {
 const colors: Record<string, string> = {
 hero: 'bg-amber-900/50 text-amber-300',
 mid_page: 'bg-emerald-900/50 text-emerald-300',
 footer: 'bg-blue-900/50 text-blue-300',
 sidebar: 'bg-purple-900/50 text-purple-300'
 };
 const labels: Record<string, Record<string, string>> = {
 hero: { ar: 'هيرو', en: 'Hero' },
 mid_page: { ar: 'منتصف الصفحة', en: 'Mid Page' },
 footer: { ar: 'تذييل', en: 'Footer' },
 sidebar: { ar: 'شريط جانبي', en: 'Sidebar' }
 };
 return (
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[pos] || 'bg-gray-700 text-gray-300'}`}>
 {labels[pos]?.[language] || pos}
 </span>
 );
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Image className="w-6 h-6 text-[#6CC6C9]" />
 <h2 className="text-xl font-bold text-[#E8F2F2]">{t('إدارة البانرات والإعلانات', 'Banners & Ads Manager')}</h2>
 </div>
 <button
 onClick={openCreateModal}
 className="flex items-center gap-2 px-4 py-2 bg-[#0E5257] hover:bg-[#2B7D82] text-white rounded-xl text-sm font-medium transition cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 {t('إضافة بانر', 'Add Banner')}
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
  entityLabel={t('بانر', 'banners')}
  onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
  onConfirm={handleBulkDelete}
  confirming={bulkDeleting}
  />
  )}

  <div className="bg-[#F0FAFA] rounded-2xl border border-[#E8F2F2] overflow-hidden">
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead>
  <tr className="border-b border-[#E8F2F2]">
  <th className="p-4 w-10">
  <input
  type="checkbox"
  checked={banners.length > 0 && selectedIds.size === banners.length}
  onChange={toggleSelectAll}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  title={t('تحديد الكل', 'Select all')}
  />
  </th>
  <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('معاينة', 'Preview')}</th>
 <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('العنوان', 'Title')}</th>
 <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('الموضع', 'Position')}</th>
 <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('الحالة', 'Status')}</th>
 <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('التواريخ', 'Dates')}</th>
 <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('الترتيب', 'Order')}</th>
 <th className="text-left p-4 text-sm font-medium text-[#86A2A4]">{t('إجراءات', 'Actions')}</th>
 </tr>
 </thead>
 <tbody>
  {banners.map(banner => (
  <tr key={banner.id} className={`border-b border-[#E8F2F2]/50 hover:bg-[#E8F2F2]/30 transition ${selectedIds.has(banner.id) ? 'bg-[#0E5257]/5' : ''}`}>
  <td className="p-4">
  <input
  type="checkbox"
  checked={selectedIds.has(banner.id)}
  onChange={() => toggleSelect(banner.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  />
  </td>
  <td className="p-4">
 <div
 className="w-24 h-14 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold"
 style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
 >
 {banner.image_url ? (
 <img src={banner.image_url} alt="" className="w-full h-full object-cover opacity-60" />
 ) : (
 <span className="truncate px-1">{language === 'ar' ? banner.title_ar : banner.title_en}</span>
 )}
 </div>
 </td>
 <td className="p-4">
 <p className="text-[#E8F2F2] text-sm font-medium">{language === 'ar' ? banner.title_ar : banner.title_en}</p>
 <p className="text-[#86A2A4] text-xs mt-0.5">{language === 'ar' ? banner.subtitle_ar : banner.subtitle_en}</p>
 </td>
 <td className="p-4">{getPositionBadge(banner.position)}</td>
 <td className="p-4">
 <button
 onClick={() => toggleActive(banner)}
 className="flex items-center gap-1.5 cursor-pointer"
 >
 {banner.is_active ? (
 <>
 <Eye className="w-4 h-4 text-emerald-400" />
 <span className="text-xs text-emerald-400">{t('نشط', 'Active')}</span>
 </>
 ) : (
 <>
 <EyeOff className="w-4 h-4 text-red-400" />
 <span className="text-xs text-red-400">{t('معطل', 'Inactive')}</span>
 </>
 )}
 </button>
 </td>
 <td className="p-4">
 <div className="text-xs text-[#86A2A4] space-y-0.5">
 {banner.start_date && <p>{t('من:', 'From:')} {banner.start_date}</p>}
 {banner.end_date && <p>{t('إلى:', 'To:')} {banner.end_date}</p>}
 {!banner.start_date && !banner.end_date && <p>{t('دائماً', 'Always')}</p>}
 </div>
 </td>
 <td className="p-4">
 <span className="text-[#6CC6C9] text-sm font-mono">{banner.sort_order}</span>
 </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="p-1.5 rounded-lg hover:bg-[#E8F2F2] text-[#0E5257] hover:text-[#2B7D82] transition cursor-pointer"
                        title={t('تعديل', 'Edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmBanner(banner)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                        title={t('حذف', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#86A2A4] text-sm">
                    {t('لا توجد بانرات بعد', 'No banners yet')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => !deletingId && setDeleteConfirmBanner(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-[#1A2E30] space-y-4 shadow-2xl z-50">
            <h3 className="text-lg font-bold text-red-600">{t('تأكيد حذف البانر', 'Confirm Banner Deletion')}</h3>
            <p className="text-xs text-[#6B8C8E]">
              {t(`هل أنت متأكد من حذف البانر "${deleteConfirmBanner.title_ar}"؟`, `Are you sure you want to delete banner "${deleteConfirmBanner.title_en}"?`)}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteConfirmBanner(null)}
                className="px-4 py-2 rounded-xl bg-[#E8F2F2] text-xs font-bold text-[#1A2E30] hover:bg-[#D0E5E5] transition cursor-pointer"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleDelete}
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
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-[#F0FAFA] rounded-2xl border border-[#E8F2F2] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-5 border-b border-[#E8F2F2]">
 <h3 className="text-lg font-bold text-[#E8F2F2]">
 {editingBanner ? t('تعديل البانر', 'Edit Banner') : t('إضافة بانر جديد', 'New Banner')}
 </h3>
 <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-[#E8F2F2] text-[#86A2A4] cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-5 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('العنوان بالعربي', 'Title (AR)')}</label>
 <input
 type="text"
 value={titleAr}
 onChange={e => setTitleAr(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 required
 dir="rtl"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('العنوان بالإنجليزي', 'Title (EN)')}</label>
 <input
 type="text"
 value={titleEn}
 onChange={e => setTitleEn(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 required
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('العنوان الفرعي بالعربي', 'Subtitle (AR)')}</label>
 <input
 type="text"
 value={subtitleAr}
 onChange={e => setSubtitleAr(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 dir="rtl"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('العنوان الفرعي بالإنجليزي', 'Subtitle (EN)')}</label>
 <input
 type="text"
 value={subtitleEn}
 onChange={e => setSubtitleEn(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>
 </div>

 <ImageUploader value={imageUrl} onChange={setImageUrl} label={t('رابط الصورة', 'Image URL')} />

 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('رابط الهدف', 'Link URL')}</label>
 <input
 type="text"
 value={linkUrl}
 onChange={e => setLinkUrl(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 placeholder="/products"
 />
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('الموضع', 'Position')}</label>
 <select
 value={position}
 onChange={e => setPosition(e.target.value as Banner['position'])}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9] cursor-pointer"
 >
 <option value="hero">{t('هيرو', 'Hero')}</option>
 <option value="mid_page">{t('منتصف الصفحة', 'Mid Page')}</option>
 <option value="footer">{t('تذييل', 'Footer')}</option>
 <option value="sidebar">{t('شريط جانبي', 'Sidebar')}</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('الترتيب', 'Sort Order')}</label>
 <input
 type="number"
 value={sortOrder}
 onChange={e => setSortOrder(Number(e.target.value))}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 min={0}
 />
 </div>
 <div className="flex items-end">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={isActive}
 onChange={e => setIsActive(e.target.checked)}
 className="w-4 h-4 accent-[#6CC6C9] rounded"
 />
 <span className="text-sm text-[#E8F2F2]">{t('نشط', 'Active')}</span>
 </label>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('تاريخ البداية', 'Start Date')}</label>
 <input
 type="date"
 value={startDate}
 onChange={e => setStartDate(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">{t('تاريخ النهاية', 'End Date')}</label>
 <input
 type="date"
 value={endDate}
 onChange={e => setEndDate(e.target.value)}
 className="w-full bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="flex items-center gap-1.5 text-xs font-medium text-[#86A2A4] mb-1">
 <Palette className="w-3 h-3" />
 {t('لون الخلفية', 'Background Color')}
 </label>
 <div className="flex gap-2">
 <input
 type="color"
 value={bgColor}
 onChange={e => setBgColor(e.target.value)}
 className="w-10 h-10 rounded-lg border border-[#1A2E30] cursor-pointer bg-transparent"
 />
 <input
 type="text"
 value={bgColor}
 onChange={e => setBgColor(e.target.value)}
 className="flex-1 bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9] font-mono"
 />
 </div>
 </div>
 <div>
 <label className="flex items-center gap-1.5 text-xs font-medium text-[#86A2A4] mb-1">
 <Palette className="w-3 h-3" />
 {t('لون النص', 'Text Color')}
 </label>
 <div className="flex gap-2">
 <input
 type="color"
 value={textColor}
 onChange={e => setTextColor(e.target.value)}
 className="w-10 h-10 rounded-lg border border-[#1A2E30] cursor-pointer bg-transparent"
 />
 <input
 type="text"
 value={textColor}
 onChange={e => setTextColor(e.target.value)}
 className="flex-1 bg-[#E8F2F2] border border-[#1A2E30] rounded-xl px-3 py-2 text-sm text-[#E8F2F2] focus:outline-none focus:border-[#6CC6C9] font-mono"
 />
 </div>
 </div>
 </div>

 <div className="rounded-xl border border-[#1A2E30] p-4" style={{ backgroundColor: bgColor }}>
 <p className="text-center font-bold font-serif" style={{ color: textColor }}>
 {titleEn || titleAr || t('معاينة العنوان', 'Title Preview')}
 </p>
 <p className="text-center text-sm opacity-80" style={{ color: textColor }}>
 {subtitleEn || subtitleAr || t('معاينة العنوان الفرعي', 'Subtitle Preview')}
 </p>
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="submit"
 className="flex-1 py-2.5 bg-[#0E5257] hover:bg-[#2B7D82] text-white rounded-xl font-medium text-sm transition cursor-pointer"
 >
 {editingBanner ? t('حفظ التعديلات', 'Save Changes') : t('إضافة البانر', 'Add Banner')}
 </button>
 <button
 type="button"
 onClick={() => { setShowModal(false); resetForm(); }}
 className="px-6 py-2.5 bg-[#E8F2F2] hover:bg-[#1A2E30] text-[#86A2A4] rounded-xl font-medium text-sm transition cursor-pointer"
 >
 {t('إلغاء', 'Cancel')}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default AdminBannersManager;
