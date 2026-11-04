import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Search, Download, Users, Loader2, X, Trash2 } from 'lucide-react';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

interface Subscriber {
 id: string;
 email: string;
 created_at: string;
}

export const AdminNewsletterManager: React.FC = () => {
 const { language, t } = useLanguage();
 const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

 useEffect(() => { loadSubscribers(); }, []);

  const loadSubscribers = async () => {
  setLoading(true);
  setError(null);
  try {
  const res = await fetch('/api/newsletter/subscribers');
  if (!res.ok) throw new Error('Failed to load');
  const data = await res.json();
  setSubscribers((Array.isArray(data) ? data : []).sort((a: Subscriber, b: Subscriber) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ));
  setSelectedIds(new Set());
  } catch {
  setError(t('فشل في تحميل المشتركين', 'Failed to load subscribers'));
  } finally {
  setLoading(false);
  }
  };

 const handleDelete = async (id: string) => {
 if (!confirm(t('هل تريد إلغاء اشتراك هذا البريد؟', 'Unsubscribe this email?'))) return;
 setDeleting(id);
 try {
 await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' });
 setSubscribers(prev => prev.filter(s => s.id !== id));
 } catch {
 setError(t('فشل في الحذف', 'Failed to delete'));
 } finally {
 setDeleting(null);
 }
 };

  const filtered = useMemo(() => {
  if (!search.trim()) return subscribers;
  const q = search.toLowerCase();
  return subscribers.filter(s => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  const toggleSelect = (id: string) => {
  setSelectedIds(prev => {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
  });
  };

  const toggleSelectAll = () => {
  if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set());
  else setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const handleBulkDelete = async () => {
  if (selectedIds.size < 1) return;
  setBulkDeleting(true);
  setBulkError('');
  try {
  await bulkDeleteRequest('newsletter', [...selectedIds]);
  setSelectedIds(new Set());
  setShowBulkConfirm(false);
  loadSubscribers();
  } catch (err: any) {
  setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
  } finally {
  setBulkDeleting(false);
  }
  };

 const exportCSV = () => {
 const header = 'email,subscribed_date\n';
 const rows = filtered.map(s =>
 `${s.email},${new Date(s.created_at).toISOString()}`
 ).join('\n');
 const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
 link.click();
 URL.revokeObjectURL(url);
 };

 if (loading) {
 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('النشرة البريدية', 'Newsletter')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة مشتركي النشرة البريدية', 'Manage newsletter subscribers')}</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {[1, 2, 3].map(i => (
 <div key={i} className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse">
 <div className="h-5 bg-[#E8F2F2] rounded w-1/2 mb-2" />
 <div className="h-8 bg-[#E8F2F2] rounded w-1/3" />
 </div>
 ))}
 </div>
 <div className="space-y-2">
 {[1, 2, 3].map(i => (
 <div key={i} className="p-4 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2] animate-pulse">
 <div className="h-4 bg-[#E8F2F2] rounded w-1/3" />
 </div>
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('النشرة البريدية', 'Newsletter')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة مشتركي النشرة البريدية', 'Manage newsletter subscribers')}</p>
 </div>

 {error && (
 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
 {error}
 <button onClick={() => setError(null)} className="mr-auto cursor-pointer"><X className="w-3.5 h-3.5" /></button>
 </div>
 )}

 {/* Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <div className="flex items-center gap-2 mb-1">
 <Users className="w-4 h-4 text-[#6CC6C9]" />
 <span className="text-xs text-[#6B8C8E]">{t('إجمالي المشتركين', 'Total Subscribers')}</span>
 </div>
 <p className="text-2xl font-extrabold text-[#1A2E30]">{subscribers.length}</p>
 </div>
 <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <div className="flex items-center gap-2 mb-1">
 <Mail className="w-4 h-4 text-[#0E5257]" />
 <span className="text-xs text-[#6B8C8E]">{t('هذا الشهر', 'This Month')}</span>
 </div>
 <p className="text-2xl font-extrabold text-[#1A2E30]">
 {subscribers.filter(s => {
 const d = new Date(s.created_at);
 const now = new Date();
 return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
 }).length}
 </p>
 </div>
 <div className="p-5 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <div className="flex items-center gap-2 mb-1">
 <Download className="w-4 h-4 text-emerald-400" />
 <span className="text-xs text-[#6B8C8E]">{t('محسوبين (منتصف الشهر)', 'Mid-Month')}</span>
 </div>
 <p className="text-2xl font-extrabold text-[#1A2E30]">
 {subscribers.filter(s => {
 const d = new Date(s.created_at);
 return d.getDate() <= 15;
 }).length}
 </p>
 </div>
 </div>

 {/* Actions Bar */}
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8C8E]" />
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder={t('بحث بالبريد الإلكتروني...', 'Search by email...')}
 className="w-full text-xs"
 />
 </div>
 <button
 onClick={exportCSV}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0"
 >
 <Download className="w-4 h-4" />
 <span>{t('تصدير CSV', 'Export CSV')}</span>
 </button>
 </div>

  {/* Subscribers List */}
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
  entityLabel={t('مشترك', 'subscribers')}
  onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
  onConfirm={handleBulkDelete}
  confirming={bulkDeleting}
  />
  )}

  {filtered.length > 0 && (
  <div className="flex items-center gap-2 text-xs text-[#6B8C8E]">
  <input
  type="checkbox"
  checked={selectedIds.size === filtered.length}
  onChange={toggleSelectAll}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  />
  <span>{t('تحديد الكل', 'Select all')}</span>
  </div>
  )}

  <div className="space-y-2">
 {filtered.length === 0 ? (
 <div className="p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
 <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
 {search ? t('لا توجد نتائج', 'No results found') : t('لا يوجد مشتركين', 'No subscribers yet')}
 </div>
 ) : (
  filtered.map(sub => (
  <div key={sub.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${selectedIds.has(sub.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
  <div className="flex items-center gap-3 min-w-0">
  <input
  type="checkbox"
  checked={selectedIds.has(sub.id)}
  onChange={() => toggleSelect(sub.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer shrink-0"
  title={t('تحديد', 'Select')}
  />
  <div className="w-9 h-9 rounded-full bg-[#0E5257]/20 flex items-center justify-center shrink-0">
 <Mail className="w-4 h-4 text-[#0E5257]" />
 </div>
 <div className="min-w-0">
 <p className="text-white text-sm font-bold truncate">{sub.email}</p>
 <p className="text-[10px] text-[#6B8C8E]">
 {new Date(sub.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
 year: 'numeric', month: 'short', day: 'numeric'
 })}
 </p>
 </div>
 </div>
 <button
 onClick={() => handleDelete(sub.id)}
 disabled={deleting === sub.id}
 className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-[#6CC6C9] transition cursor-pointer shrink-0 disabled:opacity-50"
 >
 {deleting === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
 </button>
 </div>
 ))
 )}
 </div>

 {filtered.length > 0 && (
 <p className="text-center text-[10px] text-[#6B8C8E]">
 {t(`عرض ${filtered.length} من ${subscribers.length} مشترك`, `Showing ${filtered.length} of ${subscribers.length} subscribers`)}
 </p>
 )}
 </div>
 );
};

export default AdminNewsletterManager;
