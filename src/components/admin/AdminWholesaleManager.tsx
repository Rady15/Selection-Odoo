import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { WholesaleSubmission } from '../../types';
import { Building2, Phone, Mail, MapPin, Package, CheckCircle, X, Trash2, Loader2 } from 'lucide-react';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

export const AdminWholesaleManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [requests, setRequests] = useState<WholesaleSubmission[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = () => {
  fetch('/api/admin/wholesale-requests')
  .then(async res => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
  })
  .then(data => {
  setRequests(Array.isArray(data) ? data : []);
  setSelectedIds(new Set());
  })
  .catch(err => console.error(err));
  };

  const handleMarkContacted = async (id: string) => {
  await fetch(`/api/admin/wholesale/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'contacted' })
  });
  setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'contacted' as const } : r));
  };

  const handleDelete = async (id: string) => {
  if (!confirm(t('هل أنت متأكد من حذف هذا الطلب؟', 'Delete this request?'))) return;
  setDeletingId(id);
  try {
  const res = await fetch(`/api/admin/wholesale/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  setRequests(prev => prev.filter(r => r.id !== id));
  } catch {
  alert(t('فشل حذف الطلب', 'Failed to delete request'));
  } finally {
  setDeletingId(null);
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
  if (selectedIds.size === requests.length && requests.length > 0) setSelectedIds(new Set());
  else setSelectedIds(new Set(requests.map(r => r.id)));
  };

  const handleBulkDelete = async () => {
  if (selectedIds.size < 1) return;
  setBulkDeleting(true);
  setBulkError('');
  try {
  await bulkDeleteRequest('wholesale', [...selectedIds]);
  setSelectedIds(new Set());
  setShowBulkConfirm(false);
  loadRequests();
  } catch (err: any) {
  setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
  } finally {
  setBulkDeleting(false);
  }
  };

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('طلبات مبيعات الجملة والمقاهي B2B', 'Wholesale & B2B Cafe Inquiries')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('طلبات الشراكة والتموين للمقاهي والشركات', 'B2B roasting inquiries and partnership requests')}</p>
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
  entityLabel={t('طلب جملة', 'wholesale requests')}
  onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
  onConfirm={handleBulkDelete}
  confirming={bulkDeleting}
  />
  )}

  {requests.length > 0 && (
  <div className="flex items-center gap-2 text-xs text-[#6B8C8E]">
  <input
  type="checkbox"
  checked={selectedIds.size === requests.length}
  onChange={toggleSelectAll}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  />
  <span>{t('تحديد الكل', 'Select all')}</span>
  </div>
  )}

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {requests.length === 0 ? (
  <div className="col-span-2 p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
  {t('لا توجد طلبات جملة بعد', 'No wholesale inquiries yet')}
  </div>
  ) : requests.map(req => (
  <div key={req.id} className={`p-6 rounded-3xl border space-y-3 transition ${selectedIds.has(req.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
  <div className="flex justify-between items-start border-b border-[#E8F2F2] pb-3">
  <div className="flex items-start gap-2">
  <input
  type="checkbox"
  checked={selectedIds.has(req.id)}
  onChange={() => toggleSelect(req.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer mt-1"
  title={t('تحديد', 'Select')}
  />
  <div>
  <h4 className="font-extrabold text-base text-[#1A2E30]">{req.business_name}</h4>
  <span className="text-xs text-[#6CC6C9] font-bold">{req.contact_name}</span>
  </div>
  </div>
  <div className="flex items-center gap-2">
  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
  req.status === 'new' ? 'bg-amber-500/20 text-amber-400' :
  req.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
  req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
  'bg-red-500/20 text-red-400'
  }`}>
  {req.status === 'new' ? t('جديد', 'New') :
  req.status === 'contacted' ? t('تم التواصل', 'Contacted') :
  req.status === 'approved' ? t('موافق', 'Approved') : t('مرفوض', 'Rejected')}
  </span>
  <button
  onClick={() => handleDelete(req.id)}
  disabled={deletingId === req.id}
  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition cursor-pointer disabled:opacity-50"
  title={t('حذف', 'Delete')}
  >
  {deletingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
  </button>
  </div>
  </div>

 <div className="space-y-1.5 text-xs text-[#4A6869]">
 <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#6B8C8E]" /><span>{req.phone}</span></p>
 <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#6B8C8E]" /><span>{req.email}</span></p>
 <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#6B8C8E]" /><span>{req.city}</span></p>
 <p className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-[#6B8C8E]" /><span>{req.monthly_coffee_kg}</span></p>
 </div>

 {req.message && (
 <p className="text-xs text-[#6B8C8E] border-t border-[#E8F2F2] pt-2">{req.message}</p>
 )}

 {req.status === 'new' && (
 <button
 onClick={() => handleMarkContacted(req.id)}
 className="w-full mt-2 bg-[#0E5257]/20 text-[#6CC6C9] py-2 rounded-xl text-xs font-bold hover:bg-[#0E5257] hover:text-[#6CC6C9] transition cursor-pointer flex items-center justify-center gap-1"
 >
 <CheckCircle className="w-4 h-4" />
 {t('تم التواصل', 'Mark as Contacted')}
 </button>
 )}
 </div>
 ))}
 </div>
 </div>
 );
};

export default AdminWholesaleManager;
