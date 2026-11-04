import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { HeroSlide } from '../../types';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

interface HeroSliderProps {
 slides: HeroSlide[];
 onNavigate: (path: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides, onNavigate }) => {
  const { language } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  // Fallback stage per slide: 0 = CMS image, 1 = local banner override,
  // 2 = product photo, 3 = default. Advances when the current source proves
  // to be a tiny Odoo placeholder (<600px) or fails to load.
  const [stage, setStage] = useState<Record<string, number>>({});
  const UNSPLASH_DEFAULT = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80';

  useEffect(() => {
  if (!slides || slides.length === 0) return;
  const timer = setInterval(() => {
  setCurrentIdx(prev => (prev + 1) % slides.length);
  }, 6000);
  return () => clearInterval(timer);
  }, [slides]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIdx] || slides[0];
  const PLACEHOLDER_LIMIT = 600; // real banners are 1000px+; Odoo's default placeholder is 256px
  const candidates = [
    currentSlide.image_desktop,
    currentSlide.local_image,
    currentSlide.fallback_image,
    UNSPLASH_DEFAULT,
  ].filter(Boolean) as string[];
  const step = Math.min(stage[currentSlide.id] || 0, candidates.length - 1);
  const visualSrc = candidates[step] || currentSlide.image_desktop;
  const advance = () => {
    if ((stage[currentSlide.id] || 0) < candidates.length - 1) {
      setStage(prev => ({ ...prev, [currentSlide.id]: (prev[currentSlide.id] || 0) + 1 }));
    }
  };
  const handleNavigate = (url: string) => /^https?:\/\//i.test(url) ? window.open(url, '_blank', 'noopener,noreferrer') : onNavigate(url);

 return (
 <div className="relative w-full min-h-[500px] sm:min-h-[600px] bg-[#FFFFFF] overflow-hidden flex items-center justify-center border-b border-[#E8F2F2]">

 {/* Background Desktop & Mobile Images with Gradient Overlay */}
 <AnimatePresence mode="wait">
 <motion.div
 key={currentIdx}
 initial={{ opacity: 0, scale: 1.08 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 1 }}
 className="absolute inset-0 z-0"
 >
  <picture>
  <source media="(max-width: 640px)" srcSet={visualSrc} />
  <img
  src={visualSrc}
  alt={currentSlide.title_ar}
  className="w-full h-full object-cover"
  onLoad={e => {
  const el = e.currentTarget;
  if (el.naturalWidth > 0 && el.naturalWidth < PLACEHOLDER_LIMIT) advance();
  }}
  onError={e => {
  if ((stage[currentSlide.id] || 0) < candidates.length - 1) {
  advance();
  } else if (e.currentTarget.src !== UNSPLASH_DEFAULT) {
  e.currentTarget.src = UNSPLASH_DEFAULT;
  }
  }}
  />
  </picture>
 <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/50 via-[#000000]/20 to-transparent" />
 </motion.div>
 </AnimatePresence>

 {/* Content Area */}
 <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-5 py-12 sm:py-16">

 <AnimatePresence mode="wait">
 <motion.div
 key={currentIdx}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 0.6 }}
 className="space-y-3 sm:space-y-4"
 >
 {/* Badge */}
 {currentSlide.badge_ar && (
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E5257]/30 border border-[#6CC6C9]/50 text-[#6CC6C9] text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md">
 <span>{language === 'ar' ? currentSlide.badge_ar : currentSlide.badge_en}</span>
 </div>
 )}

 {/* Title with Wave Gradient Color Fill Effect */}
 <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold font-serif leading-tight max-w-4xl mx-auto animate-cup-fill px-2">
 {language === 'ar' ? currentSlide.title_ar : currentSlide.title_en}
 </h1>

 {/* Subtitle */}
 <p className="text-xs sm:text-lg text-[#4A6869] max-w-2xl mx-auto leading-relaxed px-2">
 {language === 'ar' ? currentSlide.subtitle_ar : currentSlide.subtitle_en}
 </p>

 {/* CTA Button */}
 <div className="pt-2 sm:pt-4">
 <button
 onClick={() => handleNavigate(currentSlide.cta_link)}
 className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-xs sm:text-base font-bold transition duration-300 shadow-2xl shadow-[#0E5257]/50 cursor-pointer inline-flex items-center gap-2 group transform active:scale-95"
 >
 <span>{language === 'ar' ? currentSlide.cta_text_ar : currentSlide.cta_text_en}</span>
 {language === 'ar' ? (
 <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition" />
 ) : (
 <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition" />
 )}
 </button>
 </div>
 </motion.div>
 </AnimatePresence>

 </div>

 {/* Slide Navigation Arrows */}
 {slides.length > 1 && (
 <>
 <button
 onClick={() => setCurrentIdx(prev => (prev === 0 ? slides.length - 1 : prev - 1))}
 className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 p-2 sm:p-2.5 rounded-full border border-[#E8F2F2] transition cursor-pointer z-20 backdrop-blur"
 aria-label="Previous Slide"
 >
 <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
 </button>

 <button
 onClick={() => setCurrentIdx(prev => (prev + 1) % slides.length)}
 className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 p-2 sm:p-2.5 rounded-full border border-[#E8F2F2] transition cursor-pointer z-20 backdrop-blur"
 aria-label="Next Slide"
 >
 <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
 </button>

 {/* Indicators Dots */}
 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
 {slides.map((_, idx) => (
 <button
 key={idx}
 onClick={() => setCurrentIdx(idx)}
 className={`h-2 rounded-full transition-all cursor-pointer ${currentIdx === idx ? 'w-8 bg-[#6CC6C9]' : 'w-2 bg-[#E8F2F2]'
 }`}
 />
 ))}
 </div>
 </>
 )}

 </div>
 );
};

export default HeroSlider;
