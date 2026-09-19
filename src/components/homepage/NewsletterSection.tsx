import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedTitle from '../common/AnimatedTitle';
import { Mail, CheckCircle, Send } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
 const { t } = useLanguage();
 const [email, setEmail] = useState('');
 const [subscribed, setSubscribed] = useState(false);
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email.trim() || loading) return;
 setLoading(true);
 try {
 await fetch('/api/newsletter/subscribe', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: email.trim() })
 });
 setSubscribed(true);
 setEmail('');
 } catch {}
 setLoading(false);
 };

 return (
 <motion.section
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.6 }}
 className="py-14 bg-[#FFFFFF]"
 >
 <div className="max-w-4xl mx-auto px-4 sm:px-6">
 <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-[#F0FAFA] via-[#E8F2F2] to-[#F0FAFA] border border-[#0E5257]/40 text-center space-y-4 shadow-2xl">
 
 <div className="w-12 h-12 rounded-2xl bg-[#0E5257]/20 text-[#6CC6C9] flex items-center justify-center mx-auto">
 <Mail className="w-6 h-6" />
 </div>

 <AnimatedTitle
 title={t('انضم إلى نادي سليكشن القهوة المختصة', 'Join Selection Coffee Club')}
 subtitle={t('احصل على إشعارات فورية عند وصول دفعة تحميص جديدة، عروض المجموعات، وكوبون خصم 10% لطلبك الأول.', 'Receive restock alerts for rare micro-lots, exclusive tasting bundles, and 10% OFF your first order.')}
 className="text-center"
 />

 {subscribed ? (
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 max-w-md mx-auto"
 >
 <CheckCircle className="w-5 h-5" />
 <span>{t('تم تسجيل بريدك بنجاح! كود الخصم WELCOME10 مفعل بك.', 'Subscribed! Use code WELCOME10 for 10% off.')}</span>
 </motion.div>
 ) : (
 <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
 <input
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder={t('أدخل بريدك الإلكتروني هنا...', 'Enter your email...')}
 className="flex-1 placeholder-[#6B8C8E]/50 focus:outline-none focus:border-[#6CC6C9]"
 />
 <button
 type="submit"
 disabled={loading}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? (
 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <span>{t('اشتراك الآن', 'Subscribe')}</span>
 <Send className="w-3.5 h-3.5" />
 </>
 )}
 </button>
 </form>
 )}

 </div>
 </div>
 </motion.section>
 );
};

export default NewsletterSection;
