import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { Banner } from '../../types';
import { X } from 'lucide-react';

interface BannerDisplayProps {
 position: 'hero' | 'mid_page' | 'footer' | 'sidebar';
 onNavigate?: (path: string) => void;
}

export const BannerDisplay: React.FC<BannerDisplayProps> = ({ position, onNavigate }) => {
 const { language } = useLanguage();
 const [banners, setBanners] = useState<Banner[]>([]);
 const [dismissed, setDismissed] = useState<Set<string>>(new Set());

 useEffect(() => {
 fetch(`/api/banners?position=${position}`)
 .then(r => r.json())
 .then(data => setBanners(data))
 .catch(() => {});
 }, [position]);

 const visible = banners.filter(b => !dismissed.has(b.id));
 const handleBannerClick = (url?: string) => { if (!url) return; if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer'); else onNavigate?.(url); };
 if (visible.length === 0) return null;

 return (
 <div className="space-y-4">
 {visible.map(banner => (
 <motion.div
 key={banner.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative rounded-2xl overflow-hidden cursor-pointer group min-h-40 sm:min-h-56"
 style={{ backgroundColor: banner.bg_color }}
 onClick={() => handleBannerClick(banner.link_url)}
 >
 {banner.image_url && (
 <img src={banner.image_url} alt={language === 'ar' ? banner.title_ar : banner.title_en} className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-65 transition duration-500" />
 )}
 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6" style={{ color: banner.text_color }}>
 <h3 className="text-xl sm:text-2xl font-extrabold font-serif mb-2">
 {language === 'ar' ? banner.title_ar : banner.title_en}
 </h3>
 <p className="text-sm opacity-80">
 {language === 'ar' ? banner.subtitle_ar : banner.subtitle_en}
 </p>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(banner.id)); }}
 className="absolute top-3 left-3 p-1 rounded-full bg-black/30 text-white/70 hover:text-[#6CC6C9] cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </motion.div>
 ))}
 </div>
 );
};

export default BannerDisplay;
