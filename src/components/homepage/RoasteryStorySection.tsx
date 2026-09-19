import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedTitle from '../common/AnimatedTitle';
import { Play } from 'lucide-react';

interface RoasteryStorySectionProps {
 title_ar?: string;
 title_en?: string;
 subtitle_ar?: string;
 subtitle_en?: string;
 video_url?: string;
 onNavigate: (path: string) => void;
}

export const RoasteryStorySection: React.FC<RoasteryStorySectionProps> = ({
 title_ar,
 title_en,
 subtitle_ar,
 subtitle_en,
 video_url,
 onNavigate
}) => {
 const { t } = useLanguage();
 const [isPlaying, setIsPlaying] = useState(false);

 return (
 <motion.section
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.6 }}
 className="py-16 bg-[#FFFFFF] border-b border-[#E8F2F2]/60 overflow-hidden"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
 
 {/* Text Story Column */}
 <div className="space-y-6">
 <AnimatedTitle
 badge={t('قصة سليكشن وحرفية التحميص', 'Our Roasting Craftsmanship')}
 title={title_ar ? t(title_ar, title_en || '') : t('نحن لا نحمص القهوة فحسب، بل نروي قصة الأرض والمزارع', 'We Don\'t Just Roast Coffee, We Tell The Story of Origin')}
 />

 <p className="text-sm sm:text-base text-[#4A6869] leading-relaxed">
 {subtitle_ar ? t(subtitle_ar, subtitle_en || '') : t(
 'في محمصة سليكشن القهوة، ننقب عن أفضل 1% من محاصيل القهوة المختصة عالمياً من مزارع إثيوبيا وكولومبيا والسلفادور وجبال الخولان بجازان. نطبق أعلى درجات العناية في ملف التحميص لإبراز سحر النكهات الطبيعية بدون إضافات.',
 'At Selection Coffee, we meticulously source the top 1% specialty micro-lots directly from ethical family farms in Ethiopia, Colombia, El Salvador, and Jazan mountains. Every profile is roasted to unveil pure origin terroir.'
 )}
 </p>

 <div className="grid grid-cols-2 gap-4 pt-2">
 <motion.div
 whileHover={{ scale: 1.02 }}
 className="p-4 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]"
 >
 <span className="font-extrabold text-2xl text-[#6CC6C9]">85+</span>
 <p className="text-xs text-[#6B8C8E] mt-1 font-semibold">{t('تقييم جمعية القهوة المختصة SCA', 'SCA Certified Specialty Score')}</p>
 </motion.div>

 <motion.div
 whileHover={{ scale: 1.02 }}
 className="p-4 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]"
 >
 <span className="font-extrabold text-2xl text-[#6CC6C9]">100%</span>
 <p className="text-xs text-[#6B8C8E] mt-1 font-semibold">{t('محاصيل طازجة محمصة أسبوعياً', 'Fresh Weekly Micro-Roasts')}</p>
 </motion.div>
 </div>

 <div className="pt-2">
 <button
 onClick={() => onNavigate('/about')}
 className=" px-6 py-3 rounded-xl text-xs font-bold border border-[#E8F2F2] transition cursor-pointer"
 >
 {t('اقرأ قصتنا ورؤيتنا كاملة', 'Learn More About Our Philosophy')}
 </button>
 </div>
 </div>

 {/* Video / Visual Poster Column */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6 }}
 className="relative rounded-3xl overflow-hidden border border-[#E8F2F2] shadow-2xl aspect-video bg-[#F0FAFA] group"
 >
 {isPlaying ? (
 <iframe
 src={video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'}
 title="Selection Coffee Roasting"
 className="w-full h-full"
 allow="autoplay; encrypted-media"
 allowFullScreen
 />
 ) : (
 <>
 <img
 src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80"
 alt="Roastery Video Poster"
 className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
 />
 <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
 <button
 onClick={() => setIsPlaying(true)}
 className="w-20 h-20 rounded-full bg-[#0E5257] hover:bg-[#6CC6C9] text-white flex items-center justify-center transition transform hover:scale-110 shadow-2xl shadow-[#0E5257]/50 cursor-pointer"
 aria-label="Play Roastery Video"
 >
 <Play className="w-8 h-8 fill-current ml-1" />
 </button>
 </div>
 </>
 )}
 </motion.div>

 </div>
 </motion.section>
 );
};

export default RoasteryStorySection;
