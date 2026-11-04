import React from 'react';
import { FlavorProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface FlavorChartProps {
 profile: FlavorProfile;
}

export const FlavorChart: React.FC<FlavorChartProps> = ({ profile }) => {
 const { t } = useLanguage();

 const attributes = [
 { label: t('الحمضية', 'Acidity'), value: profile.acidity },
 { label: t('الحلاوة', 'Sweetness'), value: profile.sweetness },
 { label: t('القوام (البودي)', 'Body'), value: profile.body },
 { label: t('التوازن', 'Balance'), value: profile.balance }
 ];

 return (
 <div className="space-y-2 text-xs">
 {attributes.map(attr => (
 <div key={attr.label} className="space-y-1">
 <div className="flex justify-between text-[#4A6869] font-medium text-[11px]">
 <span>{attr.label}</span>
 <span className="text-[#6CC6C9] font-bold">{attr.value}/5</span>
 </div>

 <div className="w-full bg-[#FFFFFF] h-2 rounded-full overflow-hidden border border-[#E8F2F2]">
 <div
 className="bg-gradient-to-r from-[#0E5257] to-[#6CC6C9] h-full rounded-full transition-all duration-500"
 style={{ width: `${(attr.value / 5) * 100}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 );
};

export default FlavorChart;
