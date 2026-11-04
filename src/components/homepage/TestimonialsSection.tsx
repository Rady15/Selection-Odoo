import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedTitle from '../common/AnimatedTitle';
import { Star, Quote } from 'lucide-react';

interface TestimonialItem {
 name_ar: string;
 name_en: string;
 role_ar: string;
 role_en: string;
 comment_ar: string;
 comment_en: string;
 rating: number;
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
 {
 name_ar: 'المهندس ياسر الغامدي',
 name_en: 'Yasser Al-Ghamdi',
 role_ar: 'مقتني قهوة مختصة - الرياض',
 role_en: 'Coffee Enthusiast - Riyadh',
 comment_ar: 'محصول شلشلي الإثيوبي من سليكشن لا يُعلى عليه. النكهة فاكهية واضحة جداً وتغليف الأظرف المقطرة ممتاز ومثالي للعمل.',
 comment_en: 'Ethiopia Chelchele crop from Selection is unmatched. Exceptionally clean berry profile, and the drip bag packaging is ideal for work.',
 rating: 5
 },
 {
 name_ar: 'سارة الدوسري',
 name_en: 'Sara Al-Dossary',
 role_ar: 'باريستا منزلي - جدة',
 role_en: 'Home Barista - Jeddah',
 comment_ar: 'سرعة الشحن احترافية جداً، والقهوة وصلتني محمصة قبل 3 أيام فقط! طاحونة السيراميك والميزان جودتها عالية وبسعر ممتاز.',
 comment_en: 'Super fast shipping! Beans arrived freshly roasted 3 days prior. Manual grinder build quality is top notch.',
 rating: 5
 },
 {
 name_ar: 'عبدالمحسن الخالد',
 name_en: 'Abdulmohsen Al-Khaled',
 role_ar: 'صاحب مقهى - الخبر',
 role_en: 'Cafe Owner - Khobar',
 comment_ar: 'مزيج سليكشن للإسبرسو ثابت الجودة ويعطي كريمة كثيفة ومذاقاً متوازناً مع اللاتيه يفضله جميع عملاء مقهانا.',
 comment_en: 'Selection Signature Espresso blend is consistently remarkable. Yields thick crema and velvety milk texture.',
 rating: 5
 }
];

interface TestimonialsSectionProps {
 items?: TestimonialItem[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ items }) => {
 const { t } = useLanguage();

 const testimonials = items && items.length > 0 ? items : DEFAULT_TESTIMONIALS;

 return (
 <motion.section
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.6 }}
 className="py-14 bg-[#FFFFFF] border-b border-[#E8F2F2]/40"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
 
 <div className="text-center max-w-2xl mx-auto space-y-2 flex flex-col items-center">
 <AnimatedTitle
 badge={t('آراء وتوصيات العملاء', 'Customer Reviews')}
 title={t('ماذا يقول مجتمع عشاق القهوة عن سليكشن؟', 'What Our Coffee Community Says')}
 subtitle={t('آراء وتقييمات عملائنا الذين وثقوا في جودة تحميصنا ومحاصيلنا الفاخرة.', 'Real reviews from verified home baristas and coffee lovers across Saudi Arabia.')}
 className="text-center"
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {testimonials.map((item, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 25, scale: 0.95 }}
 whileInView={{ opacity: 1, y: 0, scale: 1 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.5, delay: idx * 0.1 }}
 className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-4 relative flex flex-col justify-between group hover:border-[#6CC6C9]/50 transition duration-300 shadow-xl"
 >
 <Quote className="w-8 h-8 text-[#0E5257]/40 absolute top-4 right-4" />

 <div className="space-y-3">
 <div className="flex text-[#6CC6C9]">
 {[1, 2, 3, 4, 5].map(s => (
 <Star key={s} className="w-4 h-4 fill-current" />
 ))}
 </div>
 <p className="text-xs text-[#4A6869] leading-relaxed italic">
 "{t(item.comment_ar, item.comment_en)}"
 </p>
 </div>

 <div className="pt-3 border-t border-[#E8F2F2]/60">
 <h5 className="font-bold text-sm text-[#1A2E30]">{t(item.name_ar, item.name_en)}</h5>
 <p className="text-[11px] text-[#6B8C8E]">{t(item.role_ar, item.role_en)}</p>
 </div>
 </motion.div>
 ))}
 </div>

 </div>
 </motion.section>
 );
};

export default TestimonialsSection;
