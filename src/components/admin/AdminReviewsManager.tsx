import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Review, ProductQuestion } from '../../types';
import { Star, MessageSquare, CheckCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

export const AdminReviewsManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
  fetch('/api/admin/reviews').then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => {});
  fetch('/api/admin/questions').then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(d => setQuestions(Array.isArray(d) ? d : [])).catch(() => {});
  setSelectedIds(new Set());
  };

  const switchTab = (tab: 'reviews' | 'questions') => {
  setActiveTab(tab);
  setSelectedIds(new Set());
  };

  const currentList = activeTab === 'reviews' ? reviews : questions;

  const toggleSelect = (id: string) => {
  setSelectedIds(prev => {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
  });
  };

  const toggleSelectAll = () => {
  if (selectedIds.size === currentList.length && currentList.length > 0) setSelectedIds(new Set());
  else setSelectedIds(new Set(currentList.map(x => x.id)));
  };

  const handleBulkDelete = async () => {
  if (selectedIds.size < 1) return;
  setBulkDeleting(true);
  setBulkError('');
  try {
  await bulkDeleteRequest(activeTab, [...selectedIds]);
  setSelectedIds(new Set());
  setShowBulkConfirm(false);
  loadData();
  } catch (err: any) {
  setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
  } finally {
  setBulkDeleting(false);
  }
  };

 const handleReviewStatus = async (id: string, status: 'approved' | 'pending') => {
 await fetch(`/api/admin/reviews/${id}/status`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status })
 });
 loadData();
 };

 const handleDeleteReview = async (id: string) => {
 if (confirm(t('حذف المراجعة؟', 'Delete review?'))) {
 await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
 loadData();
 }
 };

 const handleDeleteQuestion = async (id: string) => {
 if (confirm(t('حذف السؤال؟', 'Delete question?'))) {
 await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
 loadData();
 }
 };

 const handleAnswerQuestion = async (id: string, answer: string) => {
 await fetch(`/api/questions/${id}/answer`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ answer_ar: answer, answer_en: answer })
 });
 loadData();
 };

 const handleReplyReview = async (id: string, reply: string) => {
 await fetch(`/api/admin/reviews/${id}/reply`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ reply_ar: reply, reply_en: reply })
 });
 setReplyDrafts(prev => ({ ...prev, [id]: '' }));
 loadData();
 };

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('المراجعات والأسئلة', 'Reviews & Questions')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('إدارة مراجعات العملاء وأسئلتهم على المنتجات', 'Manage customer reviews and product Q&A')}</p>
 </div>

  <div className="flex gap-2">
  <button onClick={() => switchTab('reviews')}
  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'reviews' ? 'bg-[#0E5257] text-white' : 'bg-[#F0FAFA] text-[#6B8C8E] border border-[#E8F2F2]'}`}>
  {t('المراجعات', 'Reviews')} ({reviews.length})
  </button>
  <button onClick={() => switchTab('questions')}
  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'questions' ? 'bg-[#0E5257] text-white' : 'bg-[#F0FAFA] text-[#6B8C8E] border border-[#E8F2F2]'}`}>
  {t('الأسئلة', 'Questions')} ({questions.length})
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
  entityLabel={activeTab === 'reviews' ? t('مراجعة', 'reviews') : t('سؤال', 'questions')}
  onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
  onConfirm={handleBulkDelete}
  confirming={bulkDeleting}
  />
  )}

  {currentList.length > 0 && (
  <div className="flex items-center gap-2 text-xs text-[#6B8C8E]">
  <input
  type="checkbox"
  checked={selectedIds.size === currentList.length}
  onChange={toggleSelectAll}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  />
  <span>{t('تحديد الكل', 'Select all')}</span>
  </div>
  )}

 {activeTab === 'reviews' && (
 <div className="space-y-3">
 {reviews.length === 0 ? (
 <div className="p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
 {t('لا توجد مراجعات بعد', 'No reviews yet')}
 </div>
  ) : reviews.map(r => (
  <div key={r.id} className={`p-4 rounded-2xl border transition ${selectedIds.has(r.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
  <div className="flex justify-between items-start">
  <div className="flex items-start gap-2">
  <input
  type="checkbox"
  checked={selectedIds.has(r.id)}
  onChange={() => toggleSelect(r.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer mt-1"
  title={t('تحديد', 'Select')}
  />
  <div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#1A2E30] text-sm">{r.customer_name}</span>
 <div className="flex">
 {[...Array(5)].map((_, i) => (
 <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-[#E8F2F2]'}`} />
 ))}
 </div>
 {r.verified_purchase && (
 <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">{t('مشتري موثق', 'Verified')}</span>
 )}
 </div>
 <p className="text-white font-bold text-xs mt-1">{r.title}</p>
 <p className="text-[#4A6869] text-xs mt-0.5">{r.comment}</p>
 {r.staff_reply_ar && (
 <div className="mt-2 p-2 rounded-lg bg-[#FFFFFF] border border-[#E8F2F2] text-xs">
 <span className="text-[#6CC6C9] font-bold">{t('رد المحمصة:', 'Staff reply:')}</span>
 <span className="text-[#4A6869] ml-1">{language === 'ar' ? r.staff_reply_ar : r.staff_reply_en}</span>
 </div>
 )}
 <input
 type="text"
 value={replyDrafts[r.id] ?? r.staff_reply_ar ?? ''}
 onChange={e => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
 placeholder={t('اكتب رد المحمصة ثم اضغط Enter...', 'Write staff reply & press Enter...')}
 className="mt-2 w-full focus:outline-none focus:border-[#6CC6C9]"
 onKeyDown={e => {
 if (e.key === 'Enter') {
 e.preventDefault();
 if (e.currentTarget.value.trim()) {
 handleReplyReview(r.id, e.currentTarget.value.trim());
 }
 }
 }}
 />
 </div>
 <div className="flex items-center gap-1">
 <button onClick={() => handleReviewStatus(r.id, r.status === 'approved' ? 'pending' : 'approved')}
 className={`p-1.5 rounded-lg transition cursor-pointer ${r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
 title={r.status === 'approved' ? t('إخفاء', 'Hide') : t('عرض', 'Show')}>
 {r.status === 'approved' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
 </button>
  <button onClick={() => handleDeleteReview(r.id)}
  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-[#6CC6C9] transition cursor-pointer">
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  </div>
  </div>
  </div>
  ))}
  </div>
 )}

 {activeTab === 'questions' && (
 <div className="space-y-3">
 {questions.length === 0 ? (
 <div className="p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
 {t('لا توجد أسئلة بعد', 'No questions yet')}
 </div>
  ) : questions.map(q => (
  <div key={q.id} className={`p-4 rounded-2xl border transition ${selectedIds.has(q.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
  <div className="flex justify-between items-start">
  <div className="flex items-start gap-2 flex-1">
  <input
  type="checkbox"
  checked={selectedIds.has(q.id)}
  onChange={() => toggleSelect(q.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer mt-1"
  title={t('تحديد', 'Select')}
  />
  <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#1A2E30] text-sm">{q.customer_name || t('مجهول', 'Anonymous')}</span>
 <MessageSquare className="w-3 h-3 text-[#6CC6C9]" />
 </div>
 <p className="text-[#4A6869] text-xs mt-1">{q.question}</p>
 {q.answer_ar ? (
 <div className="mt-2 p-2 rounded-lg bg-[#FFFFFF] border border-[#E8F2F2] text-xs">
 <span className="text-[#6CC6C9] font-bold">{t('الإجابة:', 'Answer:')}</span>
 <span className="text-[#4A6869] ml-1">{language === 'ar' ? q.answer_ar : q.answer_en}</span>
 </div>
 ) : (
 <div className="mt-2">
 <input
 type="text"
 placeholder={t('اكتب إجابة...', 'Write answer...')}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 onKeyDown={e => {
 if (e.key === 'Enter') {
 e.preventDefault();
 if (e.currentTarget.value.trim()) {
 handleAnswerQuestion(q.id, e.currentTarget.value.trim());
 e.currentTarget.value = '';
 }
 }
 }}
 />
  </div>
  )}
  </div>
  <button onClick={() => handleDeleteQuestion(q.id)}
  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-[#6CC6C9] transition cursor-pointer ml-2">
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  </div>
  </div>
  ))}
  </div>
 )}
 </div>
 );
};

export default AdminReviewsManager;
