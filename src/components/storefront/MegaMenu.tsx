import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Category } from '../../types';
import { Coffee, Package, Zap, Sliders, CupSoda, ArrowLeft, ArrowRight } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  /** Viewport-relative top (px) just under the header trigger. */
  top?: number;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, onNavigate, top = 90 }) => {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
  if (isOpen) {
  fetch('/api/categories')
  .then(res => res.json())
  .then(data => setCategories(Array.isArray(data) ? data : []))
  .catch(err => console.error(err));
  }
  }, [isOpen]);

  // Fixed to the viewport: close on anything that would misplace it.
  useEffect(() => {
  if (!isOpen) return;
  const close = () => onClose();
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);
  window.addEventListener('keydown', onKey);
  return () => {
  window.removeEventListener('scroll', close, true);
  window.removeEventListener('resize', close);
  window.removeEventListener('keydown', onKey);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

 const iconsMap: Record<string, any> = {
 Coffee,
 Package,
 Zap,
 Sliders,
 CupSoda
 };

  // Viewport-centered (never overflows screen edges) + portaled out of the
  // header so its overflow-x-clip can't cut the panel off.
  return createPortal(
  <div
  className="fixed left-1/2 -translate-x-1/2 w-[min(calc(100vw-2rem),72rem)] max-h-[calc(100vh-6rem)] overflow-y-auto bg-[#F0FAFA] border border-[#E8F2F2] rounded-2xl shadow-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 z-50 text-[#1A2E30] backdrop-blur-md"
  style={{ top }}
  onMouseLeave={onClose}
  >
  {/* Hover bridge to prevent closing when moving mouse from trigger to menu */}
  <div className="absolute -top-3 left-0 right-0 h-3" />

  {/* Category List Columns */}
  <div className="col-span-1 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
 {categories.map(cat => {
 const IconComponent = iconsMap[cat.icon || 'Coffee'] || Coffee;
 return (
 <div
 key={cat.id}
 onClick={() => {
 onNavigate(`/products?category=${cat.slug}`);
 onClose();
 }}
 className="group p-4 rounded-xl bg-[#FFFFFF]/60 hover:bg-[#0E5257]/20 border border-[#E8F2F2] hover:border-[#6CC6C9]/50 transition cursor-pointer flex items-start gap-3.5"
 >
 <div className="p-2.5 rounded-lg bg-[#0E5257]/20 text-[#6CC6C9] group-hover:scale-110 transition">
 <IconComponent className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-sm text-[#1A2E30] group-hover:text-[#6CC6C9] transition flex items-center gap-1.5">
 <span>{language === 'ar' ? cat.name_ar : cat.name_en}</span>
 {language === 'ar' ? (
 <ArrowLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
 ) : (
 <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
 )}
 </h4>
 <p className="text-xs text-[#6B8C8E] mt-1 line-clamp-2">
 {language === 'ar' ? cat.description_ar : cat.description_en}
 </p>
 </div>
 </div>
 );
 })}
 </div>

  {/* Featured Promo Card Banner */}
  <div className="col-span-1 lg:col-span-4 rounded-xl overflow-hidden relative group border border-[#E8F2F2] min-h-[220px] flex flex-col justify-end p-5">
 <img
 src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
 alt="Featured Roastery Box"
 className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/60 to-transparent"></div>

 <div className="relative z-10">
 <span className="inline-flex items-center gap-1 bg-[#6CC6C9] text-black text-[10px] font-bold px-2 py-0.5 rounded-md mb-2">
 {t('عرض خاص', 'SPECIAL OFFER')}
 </span>
 <h5 className="font-bold text-base text-[#1A2E30]">
 {t('بوكس اكتشاف المحاصيل المختصة', 'Discovery Crops Tasting Box')}
 </h5>
 <p className="text-xs text-[#4A6869] mt-1 mb-3">
 {t('4 محاصيل عالمية محمصة طازجة بخصم 15%', '4 World-class crops with 15% discount')}
 </p>
 <button
 onClick={() => {
 onNavigate('/products/specialty-crop-discovery-box');
 onClose();
 }}
 className="w-full bg-[#0E5257] hover:bg-[#2B7D82] text-white py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer"
 >
 {t('اكتشف البوكس الآن', 'Shop Box Now')}
 </button>
 </div>
  </div>

  </div>,
  document.body
  );
};

export default MegaMenu;
