import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Product, Category } from '../types';
import ProductGrid from '../components/storefront/ProductGrid';
import ProductQuickViewModal from '../components/storefront/ProductQuickViewModal';
import {
 Filter,
 X,
 SlidersHorizontal,
 Search,
 Check,
 RefreshCw,
 ChevronDown
} from 'lucide-react';

interface ProductListingPageProps {
 onNavigate: (path: string) => void;
 initialCategory?: string;
 initialSearch?: string;
}

export const ProductListingPage: React.FC<ProductListingPageProps> = ({
 onNavigate,
 initialCategory = '',
 initialSearch = ''
}) => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();

 const [products, setProducts] = useState<Product[]>([]);
 const [categories, setCategories] = useState<Category[]>([]);
 const [loading, setLoading] = useState(true);

 // Filter States
 const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
 const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
 const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
 const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
 const [maxPrice, setMaxPrice] = useState<number>(0);
 const [sortBy, setSortBy] = useState<string>('featured');
 const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
 const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

 useEffect(() => {
 setSelectedCategory(initialCategory);
 }, [initialCategory]);

 useEffect(() => {
 setSearchQuery(initialSearch);
 }, [initialSearch]);

 useEffect(() => {
 setLoading(true);
 Promise.all([
 fetch('/api/products').then(res => res.json()),
 fetch('/api/categories').then(res => res.json())
 ])
 .then(([prodsData, catsData]) => {
 setProducts(prodsData);
 setCategories(catsData);
 setLoading(false);
 })
 .catch(err => {
 console.error(err);
 setLoading(false);
 });
 }, []);

 // Filter & Sort Logic
 const filteredProducts = useMemo(() => {
 let result = [...products];

 // Category Filter
 if (selectedCategory) {
 result = result.filter(p => p.category_slug === selectedCategory);
 }

 // Search Query
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase().trim();
 result = result.filter(
 p =>
 p.name_ar.toLowerCase().includes(q) ||
 p.name_en.toLowerCase().includes(q) ||
 p.origin_country_ar.toLowerCase().includes(q) ||
 p.origin_country_en.toLowerCase().includes(q) ||
 p.process_ar.toLowerCase().includes(q) ||
 p.tasting_notes_ar.some(n => n.toLowerCase().includes(q))
 );
 }

 // Origins Filter
 if (selectedOrigins.length > 0) {
 result = result.filter(p => selectedOrigins.includes(language === 'ar' ? p.origin_country_ar : p.origin_country_en));
 }

 // Processes Filter
 if (selectedProcesses.length > 0) {
 result = result.filter(p => selectedProcesses.includes(language === 'ar' ? p.process_ar : p.process_en));
 }

// Price Max Filter
  if (maxPrice > 0) {
    result = result.filter(p => (p.sale_price ?? p.price) <= maxPrice);
  }

 // Sorting
 switch (sortBy) {
 case 'price_low':
 result.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
 break;
 case 'price_high':
 result.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
 break;
 case 'newest':
 result.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
 break;
 case 'rating':
 result.sort((a, b) => b.rating - a.rating);
 break;
 default: // featured
 result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
 }

 return result;
 }, [products, selectedCategory, searchQuery, selectedOrigins, selectedProcesses, maxPrice, sortBy]);

 const originOptions = [...new Set(products.map(p => language === 'ar' ? p.origin_country_ar : p.origin_country_en).filter(Boolean))];
 const processOptions = [...new Set(products.map(p => language === 'ar' ? p.process_ar : p.process_en).filter(Boolean))];

const resetFilters = () => {
  setSelectedCategory('');
  setSearchQuery('');
  setSelectedOrigins([]);
  setSelectedProcesses([]);
  setMaxPrice(0);
  setSortBy('featured');
  };

const hasActiveFilters =
  Boolean(selectedCategory) ||
  Boolean(searchQuery) ||
  selectedOrigins.length > 0 ||
  selectedProcesses.length > 0 ||
  maxPrice > 0;

 return (
 <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

 {/* Page Title Bar */}
 <div className="p-8 rounded-3xl bg-gradient-to-r from-[#F0FAFA] via-[#E8F2F2] to-[#F0FAFA] border border-[#E8F2F2] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl sm:text-4xl font-extrabold font-serif animate-cup-fill">
 {selectedCategory
 ? categories.find(c => c.slug === selectedCategory)?.[language === 'ar' ? 'name_ar' : 'name_en'] || t('معرض المحاصيل', 'Crop Catalog')
 : t('جميع المحاصيل والمنتجات', 'All Specialty Crops & Gear')}
 </h1>
 <p className="text-xs sm:text-sm text-[#6B8C8E] mt-1">
 {t('استكشف أجود محاصيل القهوة المختصة وأدوات التحضير الاحترافية', 'Explore 85+ score specialty coffee micro-lots and brewing equipment')}
 </p>
 </div>

 {/* Quick Search Input */}
 <div className="relative w-full sm:w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8C8E]" />
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder={t('تصفية بالاسم أو الإيحاء...', 'Search by name or note...')}
 className="w-full placeholder-[#6B8C8E]/50 focus:outline-none focus:border-[#6CC6C9]"
 />
 {searchQuery && (
 <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8C8E]">
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Toolbar: Counter, Sort & Mobile Filter Button */}
 <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
 <span className="text-xs text-[#4A6869]">
 {t('عرض', 'Showing')} <strong className="text-[#6CC6C9] font-bold">{filteredProducts.length}</strong> {t('منتج', 'products')}
 </span>

 <div className="flex items-center gap-3">
 {/* Mobile Filter Button */}
 <button
 onClick={() => setMobileFilterOpen(true)}
 className="lg:hidden p-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
 >
 <SlidersHorizontal className="w-4 h-4 text-[#6CC6C9]" />
 <span>{t('الفلاتر', 'Filters')}</span>
 </button>

 {/* Sort Dropdown */}
 <div className="flex items-center gap-2 text-xs">
 <span className="hidden sm:inline text-[#6B8C8E]">{t('ترتيب حسب:', 'Sort By:')}</span>
 <select
 value={sortBy}
 onChange={e => setSortBy(e.target.value)}
 className="bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#6CC6C9] cursor-pointer"
 >
 <option value="featured">{t('الأبرز والترشيحات', 'Featured')}</option>
 <option value="newest">{t('الأحدث تحميصاً', 'Newest Roasts')}</option>
 <option value="price_low">{t('السعر: من الأقل للأعلى', 'Price: Low to High')}</option>
 <option value="price_high">{t('السعر: من الأعلى للأقل', 'Price: High to Low')}</option>
 <option value="rating">{t('الأعلى تقييماً', 'Highest Rated')}</option>
 </select>
 </div>
 </div>
 </div>

 {/* Active Filter Pills */}
 {hasActiveFilters && (
 <div className="flex items-center gap-2 flex-wrap text-xs">
 <span className="text-[#6B8C8E] font-bold">{t('الفلاتر النشطة:', 'Active Filters:')}</span>

 {selectedCategory && (
 <span className="inline-flex items-center gap-1 bg-[#0E5257]/20 text-[#6CC6C9] px-2.5 py-1 rounded-lg border border-[#0E5257]/40">
 {categories.find(c => c.slug === selectedCategory)?.[language === 'ar' ? 'name_ar' : 'name_en']}
 <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
 </span>
 )}

 {selectedOrigins.map(o => (
 <span key={o} className="inline-flex items-center gap-1 bg-[#F0FAFA] text-[#1A2E30] px-2.5 py-1 rounded-lg border border-[#E8F2F2]">
 {o}
 <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedOrigins(selectedOrigins.filter(item => item !== o))} />
 </span>
 ))}

 {selectedProcesses.map(p => (
 <span key={p} className="inline-flex items-center gap-1 bg-[#F0FAFA] text-[#1A2E30] px-2.5 py-1 rounded-lg border border-[#E8F2F2]">
 {p}
 <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedProcesses(selectedProcesses.filter(item => item !== p))} />
 </span>
 ))}

 <button
 onClick={resetFilters}
 className="text-red-400 hover:underline text-xs flex items-center gap-1 cursor-pointer"
 >
 <RefreshCw className="w-3 h-3" />
 <span>{t('إعادة ضبط الكل', 'Reset All')}</span>
 </button>
 </div>
 )}

 {/* Main Layout: Sidebar Filters + Products Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

 {/* Desktop Filter Sidebar */}
 <div className="hidden lg:block space-y-6 bg-[#F0FAFA] border border-[#E8F2F2] rounded-3xl p-6 h-fit sticky top-28">

 <div className="flex items-center justify-between border-b border-[#E8F2F2] pb-3">
 <div className="flex items-center gap-2 font-bold text-sm text-[#1A2E30]">
 <SlidersHorizontal className="w-4 h-4 text-[#6CC6C9]" />
 <span>{t('فلاتر التصفية', 'Catalog Filters')}</span>
 </div>
 {hasActiveFilters && (
 <button onClick={resetFilters} className="text-[11px] text-red-400 hover:underline cursor-pointer">
 {t('تفريغ', 'Clear')}
 </button>
 )}
 </div>

 {/* Categories list */}
 <div className="space-y-2">
 <h4 className="font-bold text-xs text-[#6CC6C9] uppercase">{t('الأقسام الرئيسيّة', 'Categories')}</h4>
 <div className="space-y-1">
 <button
 onClick={() => setSelectedCategory('')}
 className={`w-full text-start px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${!selectedCategory ? 'bg-[#0E5257] text-white font-bold' : 'text-[#4A6869] hover:bg-[#FFFFFF]'
 }`}
 >
 {t('جميع المنتجات', 'All Products')}
 </button>
 {categories.map(cat => (
 <button
 key={cat.id}
 onClick={() => setSelectedCategory(cat.slug)}
 className={`w-full text-start px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${selectedCategory === cat.slug ? 'bg-[#0E5257] text-white font-bold' : 'text-[#4A6869] hover:bg-[#FFFFFF]'
 }`}
 >
 {language === 'ar' ? cat.name_ar : cat.name_en}
 </button>
 ))}
 </div>
 </div>

 {/* Country of Origin Filter */}
 <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
 <h4 className="font-bold text-xs text-[#6CC6C9] uppercase">{t('بلد المنشأ', 'Country of Origin')}</h4>
 <div className="space-y-1.5">
 {originOptions.map(country => {
 const checked = selectedOrigins.includes(country);
 return (
 <label key={country} className="flex items-center gap-2 text-xs text-[#4A6869] cursor-pointer">
 <input
 type="checkbox"
 checked={checked}
 onChange={e => {
 if (e.target.checked) setSelectedOrigins([...selectedOrigins, country]);
 else setSelectedOrigins(selectedOrigins.filter(o => o !== country));
 }}
 className="rounded border-[#E8F2F2] bg-[#FFFFFF] text-[#0E5257] focus:ring-0"
 />
 <span>{country}</span>
 </label>
 );
 })}
 </div>
 </div>

 {/* Processing Method Filter */}
 <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
 <h4 className="font-bold text-xs text-[#6CC6C9] uppercase">{t('نوع المعالجة', 'Processing Method')}</h4>
 <div className="space-y-1.5">
 {processOptions.map(proc => {
 const checked = selectedProcesses.includes(proc);
 return (
 <label key={proc} className="flex items-center gap-2 text-xs text-[#4A6869] cursor-pointer">
 <input
 type="checkbox"
 checked={checked}
 onChange={e => {
 if (e.target.checked) setSelectedProcesses([...selectedProcesses, proc]);
 else setSelectedProcesses(selectedProcesses.filter(p => p !== proc));
 }}
 className="rounded border-[#E8F2F2] bg-[#FFFFFF] text-[#0E5257] focus:ring-0"
 />
 <span>{proc}</span>
 </label>
 );
 })}
 </div>
 </div>

{/* Price Max Slider */}
  <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
  <div className="flex justify-between text-xs font-bold">
  <span className="text-[#6CC6C9] uppercase">{t('حد السعر الأقصى', 'Max Price')}:</span>
  <span className="text-white">{maxPrice > 0 ? formatPrice(maxPrice) : t('لا حد', 'No limit')}</span>
  </div>
  <input
  type="range"
  min={30}
  max={1000}
  step={10}
  value={maxPrice}
  onChange={e => setMaxPrice(Number(e.target.value))}
  className="w-full accent-[#0E5257] cursor-pointer"
  />
  </div>

 </div>

 {/* Product Grid Area */}
 <div className="lg:col-span-3">
 <ProductGrid
 products={filteredProducts}
 onNavigate={onNavigate}
 onQuickView={prod => setQuickViewProduct(prod)}
 loading={loading}
 />
 </div>

 </div>

 </div>

 {/* Mobile Drawer Filter Modal */}
 {mobileFilterOpen && (
 <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
 <div className="relative w-full max-w-xs bg-[#FFFFFF] text-[#1A2E30] h-full p-6 space-y-6 overflow-y-auto border-l border-[#E8F2F2] shadow-2xl z-50">

 <div className="flex items-center justify-between border-b border-[#E8F2F2] pb-3">
 <h3 className="font-bold text-base text-[#1A2E30]">{t('تصفية النتائج', 'Filter Results')}</h3>
 <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-[#6B8C8E]">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Mobile Category List */}
 <div className="space-y-2">
 <h4 className="font-bold text-xs text-[#6CC6C9] uppercase">{t('القسم', 'Category')}</h4>
 <div className="space-y-1">
 <button
 onClick={() => { setSelectedCategory(''); setMobileFilterOpen(false); }}
 className={`w-full text-start p-2 rounded-xl text-xs ${!selectedCategory ? 'bg-[#0E5257] font-bold text-[#1A2E30]' : 'text-[#4A6869]'}`}
 >
 {t('الكل', 'All')}
 </button>
 {categories.map(cat => (
 <button
 key={cat.id}
 onClick={() => { setSelectedCategory(cat.slug); setMobileFilterOpen(false); }}
 className={`w-full text-start p-2 rounded-xl text-xs ${selectedCategory === cat.slug ? 'bg-[#0E5257] font-bold text-[#1A2E30]' : 'text-[#4A6869]'}`}
 >
 {language === 'ar' ? cat.name_ar : cat.name_en}
 </button>
 ))}
 </div>
 </div>

 <button
 onClick={() => setMobileFilterOpen(false)}
 className="w-full bg-[#0E5257] text-white py-3 rounded-xl text-xs font-bold cursor-pointer"
 >
 {t('عرض النتائج', 'Apply Filters')}
 </button>

 </div>
 </div>
 )}

 {/* Quick View Modal */}
 <ProductQuickViewModal
 product={quickViewProduct}
 onClose={() => setQuickViewProduct(null)}
 onNavigate={onNavigate}
 />
 </div>
 );
};

export default ProductListingPage;
