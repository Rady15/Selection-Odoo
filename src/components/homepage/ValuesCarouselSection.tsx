import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedTitle from '../common/AnimatedTitle';
import {
 Award,
 Flame,
 Leaf,
 Heart,
 Recycle,
 ChevronLeft,
 ChevronRight,
 CheckCircle2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = { Award, Flame, Leaf, Heart, Recycle };

interface ValueItem {
 icon: string;
 title_ar: string;
 title_en: string;
 desc_ar: string;
 desc_en: string;
}

const DEFAULT_VALUES: ValueItem[] = [
 { icon: 'Leaf', title_ar: 'مصداقية و تجارة عادل', title_en: 'Direct Trade', desc_ar: 'نعمل مباشرة مع المزارع بدون وسطاء لضمان عوائد عادلة', desc_en: 'Working directly with farms ensuring fair farmer income' },
 { icon: 'Flame', title_ar: 'تحميص طازج أسبوعياً', title_en: 'Fresh Weekly Roast', desc_ar: 'نحمص المحاصيل كل أسبوع لضمان أقصى طزاجة', desc_en: 'We roast fresh every week for maximum freshness' },
 { icon: 'Award', title_ar: 'جودة SCA معتمدة', title_en: 'SCA Certified Quality', desc_ar: 'نختار كل محصول بأعلى معايير جودة السبيشياليتي', desc_en: 'Every crop scored above 84 points by SCA standards' },
 { icon: 'Fire', title_ar: 'تحميص يدوي بعناية', title_en: 'Artisan Hand Roasted', desc_ar: 'كل دفعة محمصة يدوياً بخبرة وعناية فائقة', desc_en: 'Every batch artisan roasted with extreme care' },
 { icon: 'Heart', title_ar: 'مجتمع القهوة', title_en: 'Coffee Community', desc_ar: 'نبني مجتمع عشاق القهوة المختصة في المملكة', desc_en: "Building Saudi Arabia's specialty coffee community" },
 { icon: 'Recycle', title_ar: 'استدامة بيئية', title_en: 'Eco-Sustainable', desc_ar: 'تغليف صديق للبيئة وممارسات مستدامة في كل مرحلة', desc_en: 'Eco-friendly packaging and sustainable practices' }
];

interface ValuesCarouselSectionProps {
 onNavigate?: (path: string) => void;
 items?: ValueItem[];
}

export const ValuesCarouselSection: React.FC<ValuesCarouselSectionProps> = ({ items }) => {
 const { language, t } = useLanguage();
 const scrollRef = useRef<HTMLDivElement>(null);

 const values = items && items.length > 0 ? items : DEFAULT_VALUES;

 const handleScroll = (direction: 'left' | 'right') => {
 if (!scrollRef.current) return;
 const scrollAmount = 320 * 2;
 const factor = direction === 'left' ? -1 : 1;
 const rtlMultiplier = language === 'ar' ? -1 : 1;

 scrollRef.current.scrollBy({
 left: scrollAmount * factor * rtlMultiplier,
 behavior: 'smooth'
 });
 };

 return (
 <motion.section
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.6 }}
 className="py-14 bg-[#F5FBFB] border-b border-[#E8F2F2] relative overflow-hidden"
 >
 {/* Ambient glowing orb */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0E5257]/10 blur-[120px] rounded-full pointer-events-none" />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">

 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <AnimatedTitle
 badge={t('قيم والتزامات سليكشن القهوة', 'Our Core Brand Values')}
 title={t('لماذا يختار المحترفون قهوة سليكشن؟', 'Why Coffee Lovers Choose Selection?')}
 subtitle={t('نلتزم بأعلى معايير الاستدامة والدقة لتقديم تجربة تحميك واستخلاص متكاملة.', 'Uncompromising standards from ethical direct farm sourcing to precision roasting.')}
 />

 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="flex items-center gap-2 shrink-0"
 >
 <div className="flex items-center gap-1.5 bg-[#FFFFFF] p-1 rounded-2xl border border-[#E8F2F2]">
 <button
 onClick={() => handleScroll('left')}
 className="w-9 h-9 rounded-xl bg-[#F0FAFA] border border-[#E8F2F2] hover:border-[#6CC6C9] text-[#1A2E30] hover:text-[#6CC6C9] transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 <button
 onClick={() => handleScroll('right')}
 className="w-9 h-9 rounded-xl bg-[#F0FAFA] border border-[#E8F2F2] hover:border-[#6CC6C9] text-[#1A2E30] hover:text-[#6CC6C9] transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 </div>
 </motion.div>
 </div>

 {/* Values Smooth Speed Carousel */}
 <div
 ref={scrollRef}
 className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth scroll-snap-x py-3"
 style={{ WebkitOverflowScrolling: 'touch' }}
 >
 {values.map((v, idx) => {
 const Icon = ICON_MAP[v.icon] || Award;
 return (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 20, scale: 0.92 }}
 whileInView={{ opacity: 1, y: 0, scale: 1 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.5, delay: idx * 0.08 }}
 className="w-[280px] sm:w-[320px] flex-shrink-0 scroll-snap-start p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8F2F2] hover:border-[#6CC6C9] transition duration-300 shadow-xl space-y-4 flex flex-col justify-between group transform hover:-translate-y-1"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div className="w-12 h-12 rounded-2xl bg-[#0E5257]/20 text-[#6CC6C9] border border-[#6CC6C9]/30 flex items-center justify-center group-hover:scale-110 transition">
 <Icon className="w-6 h-6" />
 </div>
 <span className="text-[10px] font-bold bg-[#F0FAFA] text-[#6CC6C9] px-2.5 py-1 rounded-full border border-[#E8F2F2]">
 {t(v.badge_ar, v.badge_en)}
 </span>
 </div>

 <h3 className="font-extrabold text-base text-[#1A2E30] group-hover:text-[#6CC6C9] transition font-serif">
 {t(v.title_ar, v.title_en)}
 </h3>

 <p className="text-xs text-[#6B8C8E] leading-relaxed">
 {t(v.desc_ar, v.desc_en)}
 </p>
 </div>

 <div className="pt-3 border-t border-[#E8F2F2]/60 flex items-center justify-between text-[11px] text-[#4A6869]">
 <span className="flex items-center gap-1 text-emerald-400 font-semibold">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>{t(v.tag_ar, v.tag_en)}</span>
 </span>
 </div>
 </motion.div>
 );
 })}
 </div>

 </div>
 </motion.section>
 );
};

export default ValuesCarouselSection;
