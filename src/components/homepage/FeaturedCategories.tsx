import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { Category } from '../../types';
import AnimatedTitle from '../common/AnimatedTitle';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedCategoriesProps {
 onNavigate: (path: string) => void;
 title_ar?: string;
 title_en?: string;
}

export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ onNavigate, title_ar, title_en }) => {
 const { language, t } = useLanguage();
 const [categories, setCategories] = useState<Category[]>([]);
 const scrollRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 fetch('/api/categories')
 .then(res => res.json())
 .then(data => setCategories(data))
 .catch(err => console.error(err));
 }, []);

 const handleScroll = (direction: 'left' | 'right') => {
 if (!scrollRef.current) return;
 const scrollAmount = 300 * 2;
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
 className="py-12 bg-[#FFFFFF] border-b border-[#E8F2F2]/40 relative overflow-hidden"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
 
 {/* Header with Navigation */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <AnimatedTitle
 badge={t('تصفح المحاصيل والأدوات', 'Explore Collections')}
 title={title_ar ? t(title_ar, title_en || '') : t('تصفح حسب الفئات والأقسام', 'Shop by Category')}
 subtitle={t('اختر الفئة الفاخرة لتصفح المحاصيل المختصة وبكجات التذوق وأدوات التحضير.', 'Explore specialty beans, tasting boxes, drip bags, and espresso equipment.')}
 />

 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="flex items-center gap-3 shrink-0"
 >
 <div className="flex items-center gap-1.5 bg-[#F0FAFA] p-1 rounded-2xl border border-[#E8F2F2]">
 <button
 onClick={() => handleScroll('left')}
 className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] hover:border-[#6CC6C9] text-[#1A2E30] hover:text-[#6CC6C9] transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 <button
 onClick={() => handleScroll('right')}
 className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] hover:border-[#6CC6C9] text-[#1A2E30] hover:text-[#6CC6C9] transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 </div>

 <button
 onClick={() => onNavigate('/products')}
 className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6CC6C9] hover:text-amber-400 bg-[#F0FAFA] px-3.5 py-2.5 rounded-xl border border-[#E8F2F2] hover:border-[#6CC6C9]/50 transition cursor-pointer"
 >
 <span>{t('جميع الأقسام', 'All Categories')}</span>
 {language === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
 </button>
 </motion.div>
 </div>

 {/* Horizontal Speed Carousel Track */}
 <div
 ref={scrollRef}
 className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth scroll-snap-x py-3"
 style={{ WebkitOverflowScrolling: 'touch' }}
 >
 {categories.map((cat, idx) => (
 <motion.div
 key={cat.id}
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 whileInView={{ opacity: 1, scale: 1, y: 0 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.5, delay: idx * 0.08 }}
 onClick={() => onNavigate(`/products?category=${cat.slug}`)}
 className="w-[240px] sm:w-[280px] h-72 flex-shrink-0 scroll-snap-start group relative rounded-3xl overflow-hidden border border-[#E8F2F2] hover:border-[#6CC6C9] transition duration-300 shadow-2xl cursor-pointer flex flex-col justify-end p-5 transform hover:-translate-y-1.5"
 >
 <img
 src={cat.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80'}
 alt={cat.name_ar}
 className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/50 to-transparent" />

 <div className="relative z-10 space-y-1.5">
 <span className="text-[10px] bg-[#0E5257]/80 text-white font-bold px-2.5 py-0.5 rounded-full inline-block backdrop-blur-sm">
 {t('قسم مختص', 'Specialty')}
 </span>
 <h3 className="font-extrabold text-lg text-[#1A2E30] group-hover:text-[#6CC6C9] transition font-serif">
 {language === 'ar' ? cat.name_ar : cat.name_en}
 </h3>
 <p className="text-xs text-[#4A6869] line-clamp-2 leading-relaxed">
 {language === 'ar' ? cat.description_ar : cat.description_en}
 </p>
 </div>
 </motion.div>
 ))}
 </div>

 </div>
 </motion.section>
 );
};

export default FeaturedCategories;
