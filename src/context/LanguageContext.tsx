import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
 language: Language;
 setLanguage: (lang: Language) => void;
 toggleLanguage: () => void;
 dir: 'rtl' | 'ltr';
 t: (ar: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('selection_lang');
      return saved === 'en' || saved === 'ar' ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      localStorage.setItem('selection_lang', language);
    } catch {
      /* storage unavailable — language still works in-memory */
    }
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

 const setLanguage = (lang: Language) => {
 setLanguageState(lang);
 };

 const toggleLanguage = () => {
 setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
 };

 const t = (ar: string, en: string) => {
 return language === 'ar' ? ar : en;
 };

 return (
 <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, dir, t }}>
 {children}
 </LanguageContext.Provider>
 );
};

export const useLanguage = () => {
 const context = useContext(LanguageContext);
 if (!context) throw new Error('useLanguage must be used within LanguageProvider');
 return context;
};
