import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, CurrencyConfig } from '../types';
import { useLanguage } from './LanguageContext';
import { CurrencySymbol } from '../components/common/CurrencySymbol';

export const currencies: Record<Currency, CurrencyConfig> = {
 SAR: { code: 'SAR', symbol_ar: '﷼', symbol_en: 'SAR', rateFromSAR: 1.0 },
 AED: { code: 'AED', symbol_ar: 'د.إ', symbol_en: 'AED', rateFromSAR: 0.98 },
 KWD: { code: 'KWD', symbol_ar: 'د.ك', symbol_en: 'KWD', rateFromSAR: 0.082 },
 QAR: { code: 'QAR', symbol_ar: 'ر.ق', symbol_en: 'QAR', rateFromSAR: 0.97 },
 BHD: { code: 'BHD', symbol_ar: 'د.ب', symbol_en: 'BHD', rateFromSAR: 0.10 },
 OMR: { code: 'OMR', symbol_ar: 'ر.ع', symbol_en: 'OMR', rateFromSAR: 0.10 },
 USD: { code: 'USD', symbol_ar: '$', symbol_en: '$', rateFromSAR: 0.27 }
};

interface CurrencyContextType {
 currency: Currency;
 setCurrency: (c: Currency) => void;
 formatPrice: (amountInSAR: number) => React.ReactNode;
 formatPriceString: (amountInSAR: number) => string;
 currentCurrencyConfig: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('fursan_currency');
      return (saved && saved in currencies ? saved : 'SAR') as Currency;
    } catch {
      return 'SAR';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fursan_currency', currency);
    } catch {
      /* storage unavailable (private mode / quota) — currency still works in-memory */
    }
  }, [currency]);

 const setCurrency = (c: Currency) => {
 setCurrencyState(c);
 };

 const config = currencies[currency] || currencies.SAR;

 const safeAmount = (amountInSAR: number): number => {
 const n = Number(amountInSAR);
 return Number.isFinite(n) && n >= 0 ? n : 0;
 };

 const formatPrice = (amountInSAR: number): React.ReactNode => {
 const converted = safeAmount(amountInSAR) * config.rateFromSAR;
 const formatted = converted.toFixed(currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2);

 if (language === 'ar' && currency === 'SAR') {
 return <>{formatted} <CurrencySymbol size={13} /></>;
 }

 const symbol = language === 'ar' ? config.symbol_ar : config.symbol_en;
 return `${formatted} ${symbol}`;
 };

 const formatPriceString = (amountInSAR: number): string => {
 const converted = safeAmount(amountInSAR) * config.rateFromSAR;
 const formatted = converted.toFixed(currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2);
 const symbol = language === 'ar' ? config.symbol_ar : config.symbol_en;
 return `${formatted} ${symbol}`;
 };

 return (
 <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, formatPriceString, currentCurrencyConfig: config }}>
 {children}
 </CurrencyContext.Provider>
 );
};

export const useCurrency = () => {
 const context = useContext(CurrencyContext);
 if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
 return context;
};
