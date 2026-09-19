import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { Coffee, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = { Coffee, Truck, ShieldCheck, RotateCcw };

interface BenefitItem {
 icon: string;
 title_ar: string;
 title_en: string;
 desc_ar: string;
 desc_en: string;
}

const DEFAULT_BENEFITS: BenefitItem[] = [
 { icon: 'Coffee', title_ar: 'قهوة مختصة 100%', title_en: '100% Specialty Coffee', desc_ar: 'محاصيل سينجل أوريجين فاخرة من أفضل المزارع العالمية', desc_en: 'Premium single-origin crops from world-class farms' },
 { icon: 'Truck', title_ar: 'شحن سريع لباب بيتك', title_en: 'Fast Home Delivery', desc_ar: 'توصيل سريع واحترافي داخل المملكة العربية السعودية', desc_en: 'Fast professional delivery across Saudi Arabia' },
 { icon: 'ShieldCheck', title_ar: 'جودة مضمونة 100%', title_en: '100% Quality Guaranteed', desc_ar: 'نضمن جودة وطزاجة كل كيس قهوة نرسله لعملائنا', desc_en: 'We guarantee freshness and quality in every bag' },
 { icon: 'RotateCcw', title_ar: 'استرجاع سهل وسريع', title_en: 'Easy Returns', desc_ar: 'سياسة استرجاع مرنة خلال 7 أيام من تاريخ الشراء', desc_en: 'Flexible 7-day return policy from purchase date' }
];

interface BenefitsBarProps {
 items?: BenefitItem[];
}

export const BenefitsBar: React.FC<BenefitsBarProps> = ({ items }) => {
 const { t } = useLanguage();

 const benefits = items && items.length > 0 ? items : DEFAULT_BENEFITS;

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 className="bg-[#F0FAFA] border-b border-[#E8F2F2] py-8"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {benefits.map((b, idx) => {
 const Icon = ICON_MAP[b.icon] || Coffee;
 return (
 <motion.div
 key={idx}
 initial={{ opacity: 0, scale: 0.95 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.4, delay: idx * 0.1 }}
 className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFFFF]/80 border border-[#E8F2F2] hover:border-[#6CC6C9]/40 transition group shadow-lg"
 >
 <div className="p-3 rounded-xl bg-[#0E5257]/20 text-[#6CC6C9] group-hover:scale-110 transition flex-shrink-0">
 <Icon className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-sm text-[#1A2E30] group-hover:text-[#6CC6C9] transition">
 {t(b.title_ar, b.title_en)}
 </h4>
 <p className="text-xs text-[#6B8C8E] mt-0.5">
 {t(b.desc_ar, b.desc_en)}
 </p>
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 </motion.div>
 );
};

export default BenefitsBar;
