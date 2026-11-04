import React from 'react';
import { Coffee } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CoffeeFinderFloatProps {
 onNavigate: (path: string) => void;
}

export const CoffeeFinderFloat: React.FC<CoffeeFinderFloatProps> = ({ onNavigate }) => {
 const { language, t } = useLanguage();
 const [hovered, setHovered] = React.useState(false);

 return (
 <div
 className={`fixed bottom-6 z-40 animate-fab-float ${language === 'ar' ? 'left-6' : 'right-6'}`}
 onMouseEnter={() => setHovered(true)}
 onMouseLeave={() => setHovered(false)}
 >
 {/* soft glow halo */}
 <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0E5257] to-[#6CC6C9] blur-2xl animate-fab-glow" />

 {/* animated ping ring */}
 <span className="absolute -inset-2 rounded-full border-2 border-[#6CC6C9]/50 animate-ping opacity-30" />
 <span className="absolute -inset-1 rounded-full border border-[#6CC6C9]/70" />

 {/* main button */}
 <button
 onClick={() => onNavigate('/coffee-finder')}
 aria-label={t('مستشار القهوة الذكي', 'Smart Coffee Advisor')}
 className={`relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center text-white cursor-pointer transition-transform duration-300 group shadow-2xl shadow-[#6CC6C9]/40 bg-gradient-to-br from-[#0E5257] via-[#2B7D82] to-[#6CC6C9] border border-[#6CC6C9]/70 ${hovered ? 'scale-110' : 'scale-100'}`}
 >
 <Coffee
 className={`w-7 h-7 sm:w-8 sm:h-8 drop-shadow-lg animate-fab-wiggle ${hovered ? 'opacity-0' : 'opacity-100'}`}
 />

 </button>

 {/* side label pill */}
 <div
 className={`absolute ${language === 'ar' ? 'left-full ml-3' : 'right-full mr-3'} top-1/2 -translate-y-1/2 hidden sm:block`}
 >
 <div className={`rounded-2xl bg-[#F0FAFA]/95 backdrop-blur-md border border-[#6CC6C9]/50 px-4 py-2.5 shadow-2xl whitespace-nowrap animate-fab-label ${hovered ? 'border-[#6CC6C9]' : ''}`}>
 <p className="text-xs font-extrabold text-[#6CC6C9] leading-tight">
 {t('مستشار القهوة الذكي', 'Smart Coffee Advisor')}
 </p>
 <p className="text-[10px] text-[#6B8C8E] leading-tight mt-0.5">
 {t('اكتشف قهوتك المثالية في 30 ثانية', 'Find your perfect cup in 30 seconds')}
 </p>
 </div>
 <span className={`absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'right-0 translate-x-1/2 border-r border-t' : 'left-0 -translate-x-1/2 border-r border-t'} w-2 h-2 rotate-45 bg-[#F0FAFA] border-[#6CC6C9]/50`} />
 </div>
 </div>
 );
};

export default CoffeeFinderFloat;
