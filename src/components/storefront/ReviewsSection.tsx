import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Review } from '../../types';
import { Star, CheckCircle, MessageSquare, Plus, ThumbsUp, Send } from 'lucide-react';

interface ReviewsSectionProps {
 productId: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId }) => {
 const { language, t } = useLanguage();
 const { user } = useAuth();

 const [reviews, setReviews] = useState<Review[]>([]);
 const [showAddModal, setShowAddModal] = useState(false);
 const [rating, setRating] = useState(5);
 const [title, setTitle] = useState('');
 const [comment, setComment] = useState('');
 const [customerName, setCustomerName] = useState(user?.name || '');
 const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  fetch(`/api/reviews?product_id=${productId}`)
  .then(res => res.json())
  .then(data => setReviews(Array.isArray(data) ? data : []))
  .catch(err => console.error(err));
  }, [productId]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);

 try {
 const res = await fetch('/api/reviews', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 product_id: productId,
 user_id: user?.id,
 customer_name: customerName || 'عميل سليكشن',
 rating,
 title,
 comment,
 verified_purchase: true
 })
 });
  const newRev = await res.json();
  if (newRev && newRev.id) setReviews([newRev, ...reviews]);
 setShowAddModal(false);
 setTitle('');
 setComment('');
 setSubmitting(false);
 } catch (err) {
 setSubmitting(false);
 alert('حدث خطأ أثناء حفظ التقييم');
 }
 };

 const avgRating = reviews.length > 0
 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
 : '5.0';

 return (
 <div className="space-y-6 pt-4">
 {/* Overview Box */}
 <div className="p-6 bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-4">
 <div className="text-center">
 <span className="font-extrabold text-4xl text-yellow-500">{avgRating}</span>
 <div className="flex text-yellow-500 justify-center gap-0.5 mt-1">
 {[1, 2, 3, 4, 5].map(star => (
 <Star key={star} className={`w-4 h-4 ${star <= Math.round(Number(avgRating)) ? 'fill-current' : 'opacity-30'}`} />
 ))}
 </div>
 <p className="text-[11px] text-[#6B8C8E] mt-1">{reviews.length} {t('تقييم موثق', 'Verified Reviews')}</p>
 </div>

 <div className="h-12 w-px bg-[#E8F2F2] hidden sm:block" />

 <div className="text-xs text-[#4A6869] space-y-1">
 <p className="font-bold text-[#1A2E30]">{t('تقييمات مزارع ومحاصيل القهوة', 'Coffee Crops & Roasts Feedback')}</p>
 <p className="text-[#6B8C8E]">
 {t('جميع التقييمات صادرة من عملاء قاموا بشراء وتحضير القهوة بالفعل.', 'All ratings are submitted by verified coffee buyers.')}
 </p>
 </div>
 </div>

 <button
 onClick={() => setShowAddModal(true)}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 <span>{t('أضف تقييمك وتجربتك', 'Write a Review')}</span>
 </button>
 </div>

 {/* Review List */}
 <div className="space-y-4">
 {reviews.length === 0 ? (
 <p className="text-xs text-[#6B8C8E] text-center py-8">
 {t('لا توجد تقييمات مكتوبة بعد. كن أول من يشارك تجربته مع هذا المحصول!', 'No reviews yet. Be the first to share your experience!')}
 </p>
 ) : (
 reviews.map(rev => (
 <div key={rev.id} className="p-4 bg-[#F0FAFA] border border-[#E8F2F2] rounded-2xl space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="font-bold text-sm text-[#1A2E30]">{rev.customer_name}</span>
 {rev.verified_purchase && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
 <CheckCircle className="w-3 h-3" />
 {t('شراء مؤكد', 'Verified Purchase')}
 </span>
 )}
 </div>

 <div className="flex text-yellow-500">
 {[1, 2, 3, 4, 5].map(s => (
 <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'opacity-20'}`} />
 ))}
 </div>
 </div>

 <h5 className="font-bold text-xs text-[#6CC6C9]">{rev.title}</h5>
 <p className="text-xs text-[#4A6869] leading-relaxed">{rev.comment}</p>

 {/* Staff Reply */}
 {rev.staff_reply_ar && (
 <div className="mt-3 p-3 rounded-xl bg-[#FFFFFF] border-s-2 border-[#6CC6C9] text-xs space-y-1">
 <span className="font-bold text-[#6CC6C9]">{t('رد إدارة محمصة سليكشن:', 'Roasters Staff Reply:')}</span>
 <p className="text-[#6B8C8E]">{language === 'ar' ? rev.staff_reply_ar : rev.staff_reply_en}</p>
 </div>
 )}
 </div>
 ))
 )}
 </div>

 {/* Add Review Modal */}
 {showAddModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />

 <div className="relative w-full max-w-md bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-3xl p-6 shadow-2xl z-50">
 <form onSubmit={handleSubmit} className="space-y-4">
 <h4 className="font-bold text-base text-[#1A2E30]">{t('أضف تقييمك للمحصول', 'Write a Review')}</h4>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-[#4A6869] block">{t('التقييم العام', 'Rating')}</label>
 <div className="flex gap-2 text-yellow-500">
 {[1, 2, 3, 4, 5].map(star => (
 <button
 key={star}
 type="button"
 onClick={() => setRating(star)}
 className="p-1 cursor-pointer"
 >
 <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'opacity-30'}`} />
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="text-xs font-semibold text-[#4A6869] block mb-1">{t('اسمك', 'Your Name')}</label>
 <input
 type="text"
 required
 value={customerName}
 onChange={e => setCustomerName(e.target.value)}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="text-xs font-semibold text-[#4A6869] block mb-1">{t('عنوان التقييم', 'Review Title')}</label>
 <input
 type="text"
 required
 value={title}
 onChange={e => setTitle(e.target.value)}
 placeholder={t('مثال: نكهة توت واضحة وكوب متوازن', 'e.g. Distinct blueberry notes')}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div>
 <label className="text-xs font-semibold text-[#4A6869] block mb-1">{t('تفاصيل التجربة والتحضير', 'Your Review Details')}</label>
 <textarea
 rows={3}
 required
 value={comment}
 onChange={e => setComment(e.target.value)}
 placeholder={t('اكتب ملاحظاتك عن درجة التحضير، درجة الحرارة، وطريقة الاستخلاص V60 أم إسبرسو...', 'Write your notes on brewing method, temperature, and taste...')}
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div className="flex gap-2 pt-2">
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="flex-1 bg-[#F0FAFA] text-[#6B8C8E] py-2.5 rounded-xl text-xs font-bold cursor-pointer"
 >
 {t('إلغاء', 'Cancel')}
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="flex-1 bg-[#0E5257] hover:bg-[#2B7D82] text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
 >
 <Send className="w-3.5 h-3.5" />
 <span>{submitting ? t('جاري الحفظ...', 'Saving...') : t('نشر التقييم', 'Publish Review')}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default ReviewsSection;
