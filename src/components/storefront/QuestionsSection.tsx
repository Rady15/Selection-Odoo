import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ProductQuestion } from '../../types';
import { HelpCircle, Send, MessageCircle } from 'lucide-react';

interface QuestionsSectionProps {
 productId: string;
}

export const QuestionsSection: React.FC<QuestionsSectionProps> = ({ productId }) => {
 const { language, t } = useLanguage();
 const [questions, setQuestions] = useState<ProductQuestion[]>([]);
 const [questionText, setQuestionText] = useState('');
 const [customerName, setCustomerName] = useState('');
 const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  fetch(`/api/questions?product_id=${productId}`)
  .then(res => res.json())
  .then(data => setQuestions(Array.isArray(data) ? data : []))
  .catch(err => console.error(err));
  }, [productId]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!questionText.trim()) return;
 setSubmitting(true);

 try {
 const res = await fetch('/api/questions', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 product_id: productId,
 customer_name: customerName.trim() || 'عميل سليكشن',
 question: questionText.trim()
 })
 });
  const newQ = await res.json();
  if (newQ && newQ.id) setQuestions([newQ, ...questions]);
 setQuestionText('');
 setSubmitting(false);
 } catch (err) {
 setSubmitting(false);
 alert('خطأ في إرسال السؤال');
 }
 };

 return (
 <div className="space-y-6 pt-4">
 {/* Submit Question Box */}
 <div className="p-5 bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl space-y-3">
 <div className="flex items-center gap-2 text-[#6CC6C9]">
 <HelpCircle className="w-5 h-5" />
 <h4 className="font-bold text-sm text-[#1A2E30]">
 {t('لديك سؤال أو استفسار عن تحضير هذا المحصول؟', 'Have a question about brewing this crop?')}
 </h4>
 </div>

 <form onSubmit={handleSubmit} className="space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
 <input
 type="text"
 value={customerName}
 onChange={e => setCustomerName(e.target.value)}
 placeholder={t('اسمك (اختياري)', 'Your Name (Optional)')}
 className=" focus:outline-none focus:border-[#6CC6C9]"
 />
 <input
 type="text"
 required
 value={questionText}
 onChange={e => setQuestionText(e.target.value)}
 placeholder={t('اكتب سؤالك هنا (مثل درجة حرارة الترشيح الموصى بها)...', 'Type your question here...')}
 className="sm:col-span-2 focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>

 <div className="flex justify-end">
 <button
 type="submit"
 disabled={submitting}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
 >
 <Send className="w-3.5 h-3.5" />
 <span>{submitting ? t('جاري الإرسال...', 'Sending...') : t('إرسال السؤال', 'Submit Question')}</span>
 </button>
 </div>
 </form>
 </div>

 {/* Questions List */}
 <div className="space-y-3">
 {questions.length === 0 ? (
 <p className="text-xs text-[#6B8C8E] text-center py-6">
 {t('لا توجد أسئلة سابقة. كن أول من يسأل الخبراء المحمصين في سليكشن!', 'No questions yet. Feel free to ask our head roaster!')}
 </p>
 ) : (
 questions.map(q => (
 <div key={q.id} className="p-4 bg-[#F0FAFA] border border-[#E8F2F2] rounded-2xl space-y-2">
 <div className="flex items-center gap-2 text-xs text-[#6CC6C9] font-bold">
 <MessageCircle className="w-4 h-4" />
 <span>{q.customer_name}: {q.question}</span>
 </div>

 {q.answer_ar ? (
 <div className="p-3 bg-[#FFFFFF] border-s-2 border-emerald-500 rounded-xl text-xs space-y-1">
 <span className="font-bold text-emerald-400">{t('إجابة محامص سليكشن الرسمية:', 'Official Selection Answer:')}</span>
 <p className="text-[#4A6869]">{language === 'ar' ? q.answer_ar : q.answer_en}</p>
 </div>
 ) : (
 <span className="text-[10px] text-[#6B8C8E] italic">
 {t('جاري مراجعة السؤال وإجابته من الحميّص الرئيسي...', 'Pending answer from head roaster...')}
 </span>
 )}
 </div>
 ))
 )}
 </div>
 </div>
 );
};

export default QuestionsSection;
