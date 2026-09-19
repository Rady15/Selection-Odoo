import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ContactSubmission } from '../../types';
import { Mail, Phone, MessageSquare, User, Trash2, Send } from 'lucide-react';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

export const AdminContactManager: React.FC = () => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = () => {
  fetch('/api/admin/contact-submissions')
  .then(async res => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
  })
  .then(data => {
  setMessages(Array.isArray(data) ? data : []);
  setSelectedIds(new Set());
  })
  .catch(err => console.error(err));
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
  if (selectedIds.size === messages.length && messages.length > 0) setSelectedIds(new Set());
  else setSelectedIds(new Set(messages.map(m => m.id)));
  };

  const handleBulkDelete = async () => {
  if (selectedIds.size < 1) return;
  setBulkDeleting(true);
  setBulkError('');
  try {
  await bulkDeleteRequest('contact', [...selectedIds]);
  setSelectedIds(new Set());
  setShowBulkConfirm(false);
  loadMessages();
  } catch (err: any) {
  setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
  } finally {
  setBulkDeleting(false);
  }
  };

 const handleDelete = async (id: string) => {
 if (!confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
 await fetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
 setMessages(prev => prev.filter(m => m.id !== id));
 };

 const handleReply = async (id: string) => {
 const reply = (replyTexts[id] || '').trim();
 if (!reply) return;
 setReplyingId(id);
 try {
 const res = await fetch(`/api/admin/contact/${id}/reply`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ reply_ar: reply, reply_en: reply })
 });
 if (res.ok) {
 setReplyTexts(prev => ({ ...prev, [id]: '' }));
 loadMessages();
 }
 } catch (err) {
 console.error(err);
 } finally {
 setReplyingId(null);
 }
 };

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('رسائل التواصل', 'Contact Messages')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('رسائل العملاء من نموذج التواصل', 'Customer messages from the contact form')}</p>
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
  entityLabel={t('رسالة', 'messages')}
  onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
  onConfirm={handleBulkDelete}
  confirming={bulkDeleting}
  />
  )}

  {messages.length > 0 && (
  <div className="flex items-center gap-2 text-xs text-[#6B8C8E]">
  <input
  type="checkbox"
  checked={selectedIds.size === messages.length}
  onChange={toggleSelectAll}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
  />
  <span>{t('تحديد الكل', 'Select all')}</span>
  </div>
  )}

  <div className="space-y-3">
  {messages.length === 0 ? (
  <div className="p-8 text-center text-[#6B8C8E] bg-[#F0FAFA] rounded-3xl border border-[#E8F2F2]">
  {t('لا توجد رسائل بعد', 'No messages yet')}
  </div>
  ) : messages.map(msg => (
  <div key={msg.id} className={`p-5 rounded-2xl border transition ${selectedIds.has(msg.id) ? 'bg-[#0E5257]/5 border-[#0E5257]' : 'bg-[#F0FAFA] border-[#E8F2F2]'}`}>
  <div className="flex justify-between items-start">
  <div className="flex items-start gap-2 flex-1">
  <input
  type="checkbox"
  checked={selectedIds.has(msg.id)}
  onChange={() => toggleSelect(msg.id)}
  className="w-4 h-4 accent-[#0E5257] cursor-pointer mt-1"
  title={t('تحديد', 'Select')}
  />
  <div className="flex-1">
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-[#6CC6C9]" />
 <span className="font-bold text-[#1A2E30] text-sm">{msg.name}</span>
 <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
 msg.status === 'new' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
 }`}>
 {msg.status === 'new' ? t('جديد', 'New') : t('تم الرد', 'Replied')}
 </span>
 </div>
 <div className="flex items-center gap-3 mt-1 text-xs text-[#6B8C8E]">
 <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{msg.email}</span>
 {msg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{msg.phone}</span>}
 </div>
 {msg.subject && <p className="text-[#6CC6C9] font-bold text-xs mt-2">{msg.subject}</p>}
 <p className="text-[#4A6869] text-xs mt-1">{msg.message}</p>
 {msg.reply_ar && (
 <div className="mt-2 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E8F2F2] text-xs space-y-1">
 <span className="text-[#6CC6C9] font-bold block">{t('ردك:', 'Your reply:')}</span>
 <p className="text-[#4A6869]">{language === 'ar' ? msg.reply_ar : msg.reply_en}</p>
 <span className="text-[10px] text-[#6B8C8E] block">
 {t('تم الرد في', 'Replied on')} {new Date(msg.replied_at || msg.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
 </span>
 </div>
 )}
 <div className="mt-2 flex gap-2">
 <input
 type="text"
 value={replyTexts[msg.id] ?? ''}
 onChange={e => setReplyTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
 placeholder={t('اكتب ردك للعميل...', 'Write your reply to the customer...')}
 className="flex-1 focus:outline-none focus:border-[#6CC6C9]"
 onKeyDown={e => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleReply(msg.id);
 }
 }}
 />
 <button
 onClick={() => handleReply(msg.id)}
 disabled={replyingId === msg.id || !(replyTexts[msg.id] || '').trim()}
 className="px-3 py-2 rounded-lg bg-[#0E5257] hover:bg-[#6CC6C9] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
 >
 <Send className="w-3.5 h-3.5" />
 {t('إرسال', 'Send')}
 </button>
 </div>
 <span className="text-[10px] text-[#6B8C8E] mt-2 block">
 {new Date(msg.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
 </span>
 </div>
  <button onClick={() => handleDelete(msg.id)}
  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-[#6CC6C9] transition cursor-pointer ml-2">
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  </div>
  </div>
  ))}
  </div>
 </div>
 );
};

export default AdminContactManager;
