import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { Product } from '../../types';
import ProductCard from '../storefront/ProductCard';
import AnimatedTitle from '../common/AnimatedTitle';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

interface ProductCarouselSectionProps {
 title_ar: string;
 title_en: string;
 subtitle_ar?: string;
 subtitle_en?: string;
 collectionType: 'new' | 'bestseller' | 'featured' | 'drip' | 'espresso' | 'tools' | string;
 categorySlug?: string;
 onNavigate: (path: string) => void;
 onQuickView?: (product: Product) => void;
 badge_ar?: string;
 badge_en?: string;
}

export const ProductCarouselSection: React.FC<ProductCarouselSectionProps> = ({
 title_ar,
 title_en,
 subtitle_ar,
 subtitle_en,
 collectionType,
 categorySlug,
 onNavigate,
 onQuickView,
 badge_ar,
 badge_en
}) => {
 const { language, t } = useLanguage();
 const [products, setProducts] = useState<Product[]>([]);
 const scrollRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 let url = '/api/products';
 const params: string[] = [];

 if (categorySlug) {
 params.push(`category=${categorySlug}`);
 } else if (collectionType === 'new') {
 params.push('is_new=true');
 } else if (collectionType === 'bestseller') {
 params.push('is_bestseller=true');
 } else if (collectionType === 'featured') {
 params.push('is_featured=true');
 }

 if (params.length > 0) {
 url += '?' + params.join('&');
 }

 fetch(url)
 .then(res => res.json())
 .then(data => {
 if (Array.isArray(data)) {
 setProducts(data);
 }
 })
 .catch(err => console.error(err));
 }, [collectionType, categorySlug]);

 const handleScroll = (direction: 'left' | 'right') => {
 if (!scrollRef.current) return;
 const scrollAmount = 340 * 2;
 const factor = direction === 'left' ? -1 : 1;
 const rtlMultiplier = language === 'ar' ? -1 : 1;

 scrollRef.current.scrollBy({
 left: scrollAmount * factor * rtlMultiplier,
 behavior: 'smooth'
 });
 };

 if (products.length === 0) return null;

 return (
 <motion.section
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.6, ease: 'easeOut' }}
 className="py-12 bg-[#FFFFFF] border-b border-[#E8F2F2]/40 relative overflow-hidden"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
 
 {/* Section Header with Animated Title and Controls */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <AnimatedTitle
 title={t(title_ar, title_en)}
 subtitle={subtitle_ar ? t(subtitle_ar, subtitle_en || '') : undefined}
 badge={badge_ar ? t(badge_ar, badge_en || '') : undefined}
 />

 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="flex items-center gap-3 shrink-0"
 >
 {/* Scroll Control Buttons */}
 <div className="flex items-center gap-1.5 bg-[#F0FAFA] p-1 rounded-2xl border border-[#E8F2F2]">
 <button
 onClick={() => handleScroll('left')}
 className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] hover:border-[#6CC6C9] text-[#1A2E30] hover:text-[#6CC6C9] transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
 title={t('التالي', 'Scroll Left')}
 >
 <ChevronRight className="w-5 h-5" />
 </button>

 <button
 onClick={() => handleScroll('right')}
 className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8F2F2] hover:border-[#6CC6C9] text-[#1A2E30] hover:text-[#6CC6C9] transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
 title={t('السابق', 'Scroll Right')}
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 </div>

 <button
 onClick={() => onNavigate(`/products?${categorySlug ? `category=${categorySlug}` : `sort_by=${collectionType}`}`)}
 className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6CC6C9] hover:text-amber-400 bg-[#F0FAFA] px-3.5 py-2.5 rounded-xl border border-[#E8F2F2] hover:border-[#6CC6C9]/50 transition cursor-pointer"
 >
 <span>{t('عرض الكل', 'View All')}</span>
 {language === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
 </button>
 </motion.div>
 </div>

 {/* Horizontal Smooth Speed Scroll Track */}
 <div className="relative group">
 <div
 ref={scrollRef}
 className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth scroll-snap-x py-3 px-1"
 style={{ WebkitOverflowScrolling: 'touch' }}
 >
 {products.map((prod, idx) => (
 <motion.div
 key={prod.id}
 initial={{ opacity: 0, y: 25, scale: 0.95 }}
 whileInView={{ opacity: 1, y: 0, scale: 1 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.5, delay: idx * 0.08 }}
 className="w-[270px] sm:w-[300px] md:w-[320px] flex-shrink-0 scroll-snap-start transition duration-300 transform hover:-translate-y-1"
 >
 <ProductCard
 product={prod}
 onNavigate={onNavigate}
 onQuickView={onQuickView}
 />
 </motion.div>
 ))}
 </div>
 </div>

 </div>
 </motion.section>
 );
};

export default ProductCarouselSection;
