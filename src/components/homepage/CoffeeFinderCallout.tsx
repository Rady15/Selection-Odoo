import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedTitle from '../common/AnimatedTitle';
import { ArrowLeft, ArrowRight, Coffee, Compass } from 'lucide-react';

interface CoffeeFinderCalloutProps {
 onNavigate: (path: string) => void;
 title_ar?: string;
 title_en?: string;
 subtitle_ar?: string;
 subtitle_en?: string;
}

export const CoffeeFinderCallout: React.FC<CoffeeFinderCalloutProps> = ({
 onNavigate,
 title_ar,
 title_en,
 subtitle_ar,
 subtitle_en
}) => {
 const { language, t } = useLanguage();

 return (
 <motion.section
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.6 }}
 className="py-12 bg-[#FFFFFF]"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F0FAFA] via-[#E8F2F2] to-[#F0FAFA] border border-[#0E5257]/40 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
 
 <div className="space-y-4 max-w-2xl text-center md:text-start z-10">
 <AnimatedTitle
 badge={t('مستشار القهوة التفاعلي', 'Interactive Coffee Selector')}
 title={title_ar ? t(title_ar, title_en || '') : t('محتار في اختيار محصولك المناسب؟', 'Not sure which crop fits your taste?')}
 subtitle={subtitle_ar ? t(subtitle_ar, subtitle_en || '') : t('استخدم أداة مستشار القهوة الذكي لمساعدتك في اختيار المحصول المثالي بناءً على طريقة تحضيرك المفضلة وإيحاءات ذوقك في 30 ثانية.', 'Take our 30-second Coffee Quiz to get personalized crop recommendations matching your brew method and flavor preferences.')}
 />

 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.4, delay: 0.3 }}
 className="pt-2"
 >
 <button
 onClick={() => onNavigate('/coffee-finder')}
 className="bg-[#6CC6C9] hover:bg-[#7BD4D7] text-black px-7 py-3.5 rounded-2xl text-sm font-extrabold transition shadow-xl shadow-[#6CC6C9]/20 cursor-pointer inline-flex items-center gap-2 transform active:scale-95"
 >
 <Compass className="w-5 h-5" />
 <span>{t('جرب اختبار القهوة الآن', 'Start 30-Sec Coffee Quiz')}</span>
 {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
 </button>
 </motion.div>
 </div>

 {/* Decorative Visual Card */}
 <motion.div
 initial={{ opacity: 0, x: 30, scale: 0.95 }}
 whileInView={{ opacity: 1, x: 0, scale: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="relative z-10 flex-shrink-0 w-full md:w-80 h-48 sm:h-64 rounded-2xl overflow-hidden border border-[#6CC6C9]/30 shadow-2xl group"
 >
 <img
 src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
 alt="Coffee Quiz"
 className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/30 to-transparent flex items-end p-4">
 <div className="flex items-center gap-2 text-xs font-bold text-[#6CC6C9]">
 <Coffee className="w-4 h-4" />
 <span>{t('توصية مخصصة 100%', '100% Tailored Match')}</span>
 </div>
 </div>
 </motion.div>

 </div>
 </div>
 </motion.section>
 );
};

export default CoffeeFinderCallout;
