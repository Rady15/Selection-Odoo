import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';
import { Search, X, Coffee, ArrowLeft, ArrowRight, Loader2, Tag, ShoppingBag } from 'lucide-react';

interface SearchOverlayProps {
 isOpen: boolean;
 onClose: () => void;
 onNavigate: (path: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onNavigate }) => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();
 const { addToCart } = useCart();

 const [query, setQuery] = useState('');
 const [results, setResults] = useState<Product[]>([]);
 const [loading, setLoading] = useState(false);
const [recentSearches, setRecentSearches] = useState<string[]>(() => {
  try {
    const saved = localStorage.getItem('fursan_recent_searches');
    if (!saved) return ['شلشلي', 'سانتواريو', 'V60', 'أظرف مقطرة'];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : ['شلشلي', 'سانتواريو', 'V60', 'أظرف مقطرة'];
  } catch {
    return ['شلشلي', 'سانتواريو', 'V60', 'أظرف مقطرة'];
  }
});

 const inputRef = useRef<HTMLInputElement>(null);

 const trendingKeywords = ['شلشلي', 'سانتواريو', 'الخولاني', 'V60', 'طاحونة', 'أظرف مقطرة', 'بوكس التذوق'];

useEffect(() => {
  if (isOpen) {
    setTimeout(() => inputRef.current?.focus(), 100);
  } else {
    setQuery('');
    setResults([]);
  }
}, [isOpen]);

// ESC key handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);

 useEffect(() => {
 if (!query.trim()) {
 setResults([]);
 setLoading(false);
 return;
 }

 setLoading(true);
 const timer = setTimeout(() => {
 fetch(`/api/products?search=${encodeURIComponent(query.trim())}`)
 .then(res => res.json())
 .then(data => {
 setResults(Array.isArray(data) ? data : []);
 setLoading(false);
 })
 .catch(err => {
 console.error(err);
 setLoading(false);
 });
 }, 250);

 return () => clearTimeout(timer);
 }, [query]);

 const handleSelectKeyword = (kw: string) => {
 setQuery(kw);
 saveRecentSearch(kw);
 };

 const saveRecentSearch = (kw: string) => {
 const updated = [kw, ...recentSearches.filter(s => s !== kw)].slice(0, 5);
 setRecentSearches(updated);
 localStorage.setItem('fursan_recent_searches', JSON.stringify(updated));
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex flex-col bg-[#FFFFFF]/95 backdrop-blur-xl text-[#1A2E30] overflow-y-auto animate-fade-in">

 {/* Top Search Input Bar */}
 <div className="p-4 sm:p-6 border-b border-[#E8F2F2] bg-[#FFFFFF] sticky top-0 z-10 shadow-2xl">
 <div className="max-w-4xl mx-auto flex items-center gap-3">
 <Search className="w-6 h-6 text-[#6CC6C9] flex-shrink-0" />

 <input
 ref={inputRef}
 type="text"
 value={query}
 onChange={e => setQuery(e.target.value)}
 placeholder={t('ابحث عن اسم محصول، معالجة، بلد المنشأ، أو أداة...', 'Search crops, origins, processing methods or gear...')}
 className="w-full bg-transparent text-lg sm:text-2xl font-bold focus:outline-none"
 />

 {loading ? (
 <Loader2 className="w-6 h-6 text-[#6CC6C9] animate-spin flex-shrink-0" />
 ) : query ? (
 <button
 onClick={() => setQuery('')}
 className="p-1 rounded-full text-[#6B8C8E] hover:text-[#6CC6C9] hover:bg-[#F0FAFA] cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 ) : null}

 <button
 onClick={onClose}
 className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border border-[#E8F2F2]"
 >
 {t('إلغاء (ESC)', 'Close (ESC)')}
 </button>
 </div>
 </div>

 {/* Content Container */}
 <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1">

 {/* If no query entered yet, show popular & recent tags */}
 {!query.trim() && (
 <div className="space-y-8 py-4">

 {/* Trending Keywords */}
 <div>
 <div className="flex items-center gap-2 text-xs font-bold text-[#6CC6C9] uppercase tracking-wider mb-3">
 <span>{t('الأكثر بحثاً اليوم', 'Popular Coffee Searches')}</span>
 </div>
 <div className="flex flex-wrap gap-2">
 {trendingKeywords.map(kw => (
 <button
 key={kw}
 onClick={() => handleSelectKeyword(kw)}
 className="px-3.5 py-1.5 rounded-xl bg-[#F0FAFA] hover:bg-[#0E5257]/30 border border-[#E8F2F2] hover:border-[#6CC6C9]/50 text-xs font-medium text-[#1A2E30] hover:text-[#6CC6C9] transition cursor-pointer"
 >
 {kw}
 </button>
 ))}
 </div>
 </div>

 {/* Recent Searches */}
 {recentSearches.length > 0 && (
 <div>
 <div className="flex items-center justify-between text-xs font-bold text-[#6B8C8E] uppercase tracking-wider mb-3">
 <div className="flex items-center gap-2">
 <Tag className="w-4 h-4 text-[#6B8C8E]" />
 <span>{t('عمليات البحث الأخيرة', 'Recent Searches')}</span>
 </div>
 <button
 onClick={() => {
 setRecentSearches([]);
 localStorage.removeItem('fursan_recent_searches');
 }}
 className="text-[10px] text-[#0E5257] hover:underline cursor-pointer"
 >
 {t('مسح السجل', 'Clear History')}
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {recentSearches.map(kw => (
<button
  key={kw}
  onClick={() => handleSelectKeyword(kw)}
  className="px-3 py-1 rounded-lg text-[#1A2E30] transition cursor-pointer hover:bg-[#F0FAFA] bg-[#E8F2F2]/50"
  >
  {kw}
</button>
 ))}
 </div>
 </div>
 )}

 </div>
 )}

 {/* Live Search Results */}
 {query.trim() && (
 <div className="space-y-4">
 <div className="flex items-center justify-between border-b border-[#E8F2F2] pb-3 text-xs text-[#6B8C8E]">
 <span>
 {t('نتائج البحث عن', 'Search results for')} <strong className="text-[#6CC6C9]">"{query}"</strong>
 </span>
 <span>{results.length} {t('منتج', 'products found')}</span>
 </div>

 {results.length === 0 && !loading ? (
 <div className="text-center py-16 space-y-3">
 <Coffee className="w-12 h-12 text-[#E8F2F2] mx-auto" />
 <h3 className="font-bold text-lg text-[#1A2E30]">
 {t('لم نجد نتائج مطابقة لبحثك', 'No products matching your search')}
 </h3>
 <p className="text-xs text-[#6B8C8E] max-w-sm mx-auto">
 {t('تأكد من كتابة الكلمة بشكل صحيح، أو ابحث باسم البلد مثل إثيوبيا أو أدوات تحضير القهوة.', 'Check spelling or try searching by origin like Ethiopia or V60.')}
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
 {results.map(prod => (
 <div
 key={prod.id}
 onClick={() => {
 saveRecentSearch(query);
 onNavigate(`/products/${prod.slug}`);
 onClose();
 }}
 className="group p-3 rounded-2xl bg-[#F0FAFA]/80 hover:bg-[#F0FAFA] border border-[#E8F2F2] hover:border-[#6CC6C9]/50 transition cursor-pointer flex gap-3.5 items-center"
 >
 <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FFFFFF] relative flex-shrink-0">
 <img
 src={prod.images[0]}
 alt={prod.name_ar}
 className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
 />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1 mb-1">
 <span className="text-[10px] bg-[#0E5257]/30 text-[#6CC6C9] font-bold px-2 py-0.5 rounded">
 {prod.origin_country_ar}
 </span>
 <span className="text-[10px] text-[#6B8C8E]">
 {prod.process_ar}
 </span>
 </div>

 <h4 className="font-bold text-sm text-[#1A2E30] group-hover:text-[#6CC6C9] transition truncate">
 {language === 'ar' ? prod.name_ar : prod.name_en}
 </h4>

 <div className="flex items-center justify-between mt-2">
 <span className="font-extrabold text-sm text-[#6CC6C9]">
 {formatPrice(prod.sale_price ?? prod.price)}
 </span>

<button
  onClick={(e) => {
    e.stopPropagation();
    const weight = prod.weight_options[0]?.value || '250g';
    const grind = prod.grind_options[0] || 'beans';
    addToCart(prod, weight, grind, 1);
  }}
  className="p-1.5 rounded-lg bg-[#0E5257] hover:bg-[#2B7D82] text-white transition cursor-pointer"
  title={t('أضف للسلة', 'Add to Cart')}
  >
  <ShoppingBag className="w-3.5 h-3.5" />
</button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 </div>
 )}

 </div>
 </div>
 );
};

export default SearchOverlay;
