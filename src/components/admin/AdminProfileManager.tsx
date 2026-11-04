import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
 User,
 Mail,
 Phone,
 ShieldCheck,
 Calendar,
 Award,
 Save,
 Edit3,
 CheckCircle,
 AlertCircle
} from 'lucide-react';

export const AdminProfileManager: React.FC = () => {
 const { language, t } = useLanguage();
 const { user, updateUserInState } = useAuth();

 const [editing, setEditing] = useState(false);
 const [name, setName] = useState(user?.name || '');
 const [email, setEmail] = useState(user?.email || '');
 const [phone, setPhone] = useState(user?.phone || '');
 const [password, setPassword] = useState('');
 const [saving, setSaving] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState('');

 const startEdit = () => {
 setName(user?.name || '');
 setEmail(user?.email || '');
 setPhone(user?.phone || '');
 setPassword('');
 setSuccess(false);
 setError('');
 setEditing(true);
 };

 const handleSave = async () => {
 if (!user) return;
 if (!name.trim() || !email.trim()) {
 setError(t('الاسم والبريد الإلكتروني مطلوبان', 'Name and email are required'));
 return;
 }
 setSaving(true);
 setSuccess(false);
 setError('');
 try {
 const payload: any = { name: name.trim(), email: email.trim(), phone: phone.trim() };
 if (password) payload.password = password;
 const res = await fetch(`/api/users/${user.id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 const data = await res.json();
 if (!res.ok) {
 setError(data.error_ar || data.error || 'Failed to save');
 return;
 }
 updateUserInState({ ...user, ...data.user, ...payload });
 setPassword('');
 setEditing(false);
 setSuccess(true);
 setTimeout(() => setSuccess(false), 3000);
 } catch (err) {
 setError('حدث خطأ أثناء الحفظ');
 } finally {
 setSaving(false);
 }
 };

 if (!user) {
 return (
 <div className="text-center text-[#6B8C8E] py-16 text-sm">
 {t('لم يتم العثور على حساب', 'No account found')}
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fade-in max-w-2xl">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1A2E30] font-serif">{t('الملف الشخصي', 'My Profile')}</h1>
 <p className="text-xs text-[#6B8C8E] mt-0.5">{t('تعديل بياناتك الشخصية وكلمة المرور', 'Manage your personal information and password')}</p>
 </div>

 <div className="bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl overflow-hidden shadow-2xl">
 <div className="p-6 border-b border-[#E8F2F2] flex items-center gap-4">
 <div className="w-14 h-14 rounded-full bg-[#0E5257] flex items-center justify-center text-xl font-bold text-[#1A2E30] flex-shrink-0">
 {(user.name || user.email || '?').charAt(0)}
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-lg text-[#1A2E30] font-serif truncate">{user.name || user.email}</h2>
 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0E5257]/20 text-[#6CC6C9]">Admin</span>
 <span className="text-[10px] text-[#6B8C8E]">{user.id}</span>
 </div>
 </div>
 </div>

 <div className="p-6 space-y-5">
 {error && (
 <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-xs font-bold">
 <AlertCircle className="w-4 h-4 flex-shrink-0" />
 {error}
 </div>
 )}
 {success && (
 <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 text-xs font-bold">
 <CheckCircle className="w-4 h-4 flex-shrink-0" />
 {t('تم حفظ التعديلات بنجاح', 'Changes saved successfully')}
 </div>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
 <div>
 <span className="text-[#6B8C8E] flex items-center gap-1"><User className="w-3 h-3" /> {t('الاسم', 'Name')}</span>
 {editing ? (
 <input value={name} onChange={e => setName(e.target.value)}
 className="w-full mt-1 focus:outline-none focus:border-[#6CC6C9]" />
 ) : (
 <p className="font-bold text-[#1A2E30] mt-1">{user.name || '-'}</p>
 )}
 </div>
 <div>
 <span className="text-[#6B8C8E] flex items-center gap-1"><Mail className="w-3 h-3" /> {t('البريد', 'Email')}</span>
 {editing ? (
 <input value={email} onChange={e => setEmail(e.target.value)} type="email"
 className="w-full mt-1 focus:outline-none focus:border-[#6CC6C9]" />
 ) : (
 <p className="font-bold text-[#1A2E30] mt-1">{user.email || '-'}</p>
 )}
 </div>
 <div>
 <span className="text-[#6B8C8E] flex items-center gap-1"><Phone className="w-3 h-3" /> {t('الجوال', 'Phone')}</span>
 {editing ? (
 <input value={phone} onChange={e => setPhone(e.target.value)}
 className="w-full mt-1 focus:outline-none focus:border-[#6CC6C9]" />
 ) : (
 <p className="font-bold text-[#1A2E30] mt-1">{user.phone || '-'}</p>
 )}
 </div>
 <div>
 <span className="text-[#6B8C8E] flex items-center gap-1"><Award className="w-3 h-3" /> {t('نقاط الولاء', 'Loyalty Points')}</span>
 <p className="font-bold text-[#1A2E30] mt-1">{user.loyalty_points} {t('نقطة', 'pts')}</p>
 </div>
 <div>
 <span className="text-[#6B8C8E] flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('تاريخ التسجيل', 'Registered')}</span>
 <p className="font-bold text-[#1A2E30] mt-1">
 {new Date(user.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
 </p>
 </div>
 <div>
 <span className="text-[#6B8C8E] flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('الدور', 'Role')}</span>
 <p className="font-bold text-[#1A2E30] mt-1">Administrator</p>
 </div>
 </div>

 {editing && (
 <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E8F2F2]">
 <span className="text-[#6B8C8E]">{t('كلمة مرور جديدة (اختياري)', 'New password (optional)')}</span>
 <input value={password} onChange={e => setPassword(e.target.value)} type="password"
 placeholder={t('اتركه فارغاً للإبقاء على كلمة المرور الحالية', 'Leave empty to keep current password')}
 className="w-full mt-1 focus:outline-none focus:border-[#6CC6C9]" />
 </div>
 )}

 <div className="flex gap-2 pt-2">
 {editing ? (
 <>
 <button
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-1.5 bg-[#0E5257] hover:bg-[#2B7D82] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
 >
 <Save className="w-3.5 h-3.5" />
 {saving ? '...' : t('حفظ التعديلات', 'Save Changes')}
 </button>
 <button
 onClick={() => { setEditing(false); setError(''); }}
 className="text-[#6B8C8E] hover:text-[#6CC6C9] px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
 >
 {t('إلغاء', 'Cancel')}
 </button>
 </>
 ) : (
 <button
 onClick={startEdit}
 className="flex items-center gap-1.5 bg-[#0E5257] hover:bg-[#2B7D82] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
 >
 <Edit3 className="w-3.5 h-3.5" />
 {t('تعديل البيانات', 'Edit Profile')}
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default AdminProfileManager;
