import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Product, Category } from '../types';
import ProductGrid from '../components/storefront/ProductGrid';
import ProductQuickViewModal from '../components/storefront/ProductQuickViewModal';
import { fetchAllProducts, fetchCategories } from '../utils/catalogApi';
import {
  X,
  SlidersHorizontal,
  Search,
  RefreshCw
} from 'lucide-react';

interface ProductListingPageProps {
  onNavigate: (path: string) => void;
  initialCategory?: string;
  initialSearch?: string;
}

/** How many cards to render per batch. The catalogue is ~475 products. */
const PAGE_STEP = 24;

const text = (v: unknown) => String(v ?? '').toLowerCase();

const priceOf = (p: any): number => {
  const sale = Number(p?.sale_price);
  const base = Number(p?.price ?? 0);
  if (Number.isFinite(sale) && sale > 0) return sale;
  return Number.isFinite(base) ? base : 0;
};

/** Category slug of a product. The API returns a `categories` array; the
 *  legacy flat `category_slug` is kept as a fallback. */
const slugOf = (p: any): string => p?.category_slug || p?.categories?.[0]?.slug || '';

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
  const [error, setError] = useState('');

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_STEP);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    // The listing needs the *whole* catalogue: the API pages at 24 items and
    // the filters below run in the browser, so a single call would filter a
    // 24-item slice and report a bogus count.
    Promise.all([fetchAllProducts(), fetchCategories()])
      .then(([allProducts, allCategories]) => {
        if (cancelled) return;
        setProducts(allProducts as Product[]);
        setCategories(allCategories as Category[]);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(t('تعذّر تحميل المنتجات، حاول مرة أخرى.', 'Could not load products, please try again.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [t]);

  // Reset paging whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_STEP);
  }, [selectedCategory, searchQuery, selectedOrigins, selectedProcesses, maxPrice, sortBy]);

  /** Real price bounds — a hardcoded 30..1000 slider made every machine
   *  (2k–60k SAR) unreachable as soon as it was touched. */
  const priceBounds = useMemo(() => {
    const values = products.map(priceOf).filter((n) => n > 0);
    if (!values.length) return { min: 0, max: 1000 };
    const min = Math.floor(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    return { min, max: max > min ? max : min + 100 };
  }, [products]);

  const priceCeiling = maxPrice > 0 ? maxPrice : priceBounds.max;

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category Filter
    if (selectedCategory) {
      result = result.filter((p) => slugOf(p) === selectedCategory);
    }

    // Search Query — name, sku, category, origin, process, tasting notes.
    const q = text(searchQuery).trim();
    if (q) {
      result = result.filter((p: any) => {
        const haystack = [
          p.name_ar, p.name_en, p.sku,
          p.categories?.[0]?.name,
          p.origin_country_ar, p.origin_country_en,
          p.process_ar, p.process_en,
          ...(Array.isArray(p.tasting_notes_ar) ? p.tasting_notes_ar : []),
          ...(Array.isArray(p.tasting_notes_en) ? p.tasting_notes_en : []),
        ];
        return haystack.some((v) => text(v).includes(q));
      });
    }

    // Origins Filter
    if (selectedOrigins.length > 0) {
      result = result.filter((p: any) =>
        selectedOrigins.includes(language === 'ar' ? p.origin_country_ar : p.origin_country_en));
    }

    // Processes Filter
    if (selectedProcesses.length > 0) {
      result = result.filter((p: any) =>
        selectedProcesses.includes(language === 'ar' ? p.process_ar : p.process_en));
    }

    // Price Max Filter
    if (maxPrice > 0) {
      result = result.filter((p) => priceOf(p) <= maxPrice);
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case 'price_high':
        result.sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case 'newest':
        result.sort((a, b) => Number(b.is_new ? 1 : 0) - Number(a.is_new ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
        break;
      default: // featured: featured first, then in stock, then alphabetical
        result.sort((a: any, b: any) =>
          Number(b.is_featured ? 1 : 0) - Number(a.is_featured ? 1 : 0) ||
          Number(b.stock > 0 ? 1 : 0) - Number(a.stock > 0 ? 1 : 0) ||
          String(a.name_en || a.name_ar || '').localeCompare(String(b.name_en || b.name_ar || ''))
        );
    }

    return result;
  }, [products, selectedCategory, searchQuery, selectedOrigins, selectedProcesses, maxPrice, sortBy, language]);

  /** Product count per category, so the tabs can show real numbers. */
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const slug = slugOf(p);
      if (!slug) continue;
      counts.set(slug, (counts.get(slug) || 0) + 1);
    }
    // `/api/categories` ships its own per-category product list. Use it only
    // for categories the product page never covered, so the tab count and the
    // result count below can never disagree.
    for (const cat of categories as any[]) {
      const slug = cat?.slug;
      if (!slug || counts.has(slug)) continue;
      const apiCount = Number(cat?.product_count ?? (Array.isArray(cat?.products) ? cat.products.length : 0));
      if (apiCount > 0) counts.set(slug, apiCount);
    }
    return counts;
  }, [products, categories]);

  const originOptions = useMemo(
    () => [...new Set(products.map((p: any) => (language === 'ar' ? p.origin_country_ar : p.origin_country_en)).filter(Boolean))] as string[],
    [products, language]
  );
  const processOptions = useMemo(
    () => [...new Set(products.map((p: any) => (language === 'ar' ? p.process_ar : p.process_en)).filter(Boolean))] as string[],
    [products, language]
  );

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

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const remaining = filteredProducts.length - visibleProducts.length;
  const categoryLabel = (cat: Category) => (language === 'ar' ? cat.name_ar : cat.name_en);

  return (
    <div className="bg-[#FFFFFF] text-[#1A2E30] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Page Title Bar */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#F0FAFA] via-[#E8F2F2] to-[#F0FAFA] border border-[#E8F2F2] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif animate-cup-fill">
              {selectedCategory
                ? categoryLabel(categories.find((c) => c.slug === selectedCategory) || ({} as Category)) ||
                  t('معرض المحاصيل', 'Crop Catalog')
                : t('جميع المحاصيل والمنتجات', 'All Specialty Crops & Gear')}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B8C8E] mt-1">
              {t(
                'استكشف أجود محاصيل القهوة المختصة وأدوات التحضير الاحترافية',
                'Explore specialty coffee micro-lots and professional brewing equipment'
              )}
            </p>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8C8E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('تصفية بالاسم أو الإيحاء...', 'Search by name or note...')}
            className="w-full placeholder-[#6B8C8E]/50 focus:outline-none focus:border-[#6CC6C9]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8C8E]"
              aria-label={t('مسح البحث', 'Clear search')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Category Tabs */}
        <div className="mt-4 overflow-x-auto no-scrollbar scroll-snap-x pb-2">
          <div className="flex gap-2 px-1 min-w-max scroll-snap-start">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap scroll-snap-start ${
                !selectedCategory
                  ? 'bg-[#0E5257] text-white font-bold shadow-lg shadow-[#0E5257]/40'
                  : 'bg-[#FFFFFF] border border-[#E8F2F2] text-[#4A6869] hover:bg-[#F0FAFA]'
              }`}
            >
              {t('جميع الأقسام', 'All Categories')}
              <span className="ms-1.5 opacity-70">({products.length})</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap scroll-snap-start ${
                  selectedCategory === cat.slug
                    ? 'bg-[#0E5257] text-white font-bold shadow-lg shadow-[#0E5257]/40'
                    : 'bg-[#FFFFFF] border border-[#E8F2F2] text-[#4A6869] hover:bg-[#F0FAFA]'
                }`}
              >
                {categoryLabel(cat)}
                <span className="ms-1.5 opacity-70">({categoryCounts.get(cat.slug) || 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: Counter, Sort & Mobile Filter Button */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F0FAFA] border border-[#E8F2F2]">
          <span className="text-xs text-[#4A6869]">
            {t('عرض', 'Showing')}{' '}
            <strong className="text-[#6CC6C9] font-bold">{visibleProducts.length}</strong>{' '}
            {t('من', 'of')}{' '}
            <strong className="text-[#6CC6C9] font-bold">{filteredProducts.length}</strong>{' '}
            {t('منتج', 'products')}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden p-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#6CC6C9]" />
              <span>{t('الفلاتر', 'Filters')}</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="hidden sm:inline text-[#6B8C8E]">{t('ترتيب حسب:', 'Sort By:')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                {categoryLabel(categories.find((c) => c.slug === selectedCategory) || ({} as Category))}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </span>
            )}

            {selectedOrigins.map((o) => (
              <span key={o} className="inline-flex items-center gap-1 bg-[#F0FAFA] text-[#1A2E30] px-2.5 py-1 rounded-lg border border-[#E8F2F2]">
                {o}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedOrigins(selectedOrigins.filter((item) => item !== o))} />
              </span>
            ))}

            {selectedProcesses.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 bg-[#F0FAFA] text-[#1A2E30] px-2.5 py-1 rounded-lg border border-[#E8F2F2]">
                {p}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedProcesses(selectedProcesses.filter((item) => item !== p))} />
              </span>
            ))}

            {maxPrice > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#F0FAFA] text-[#1A2E30] px-2.5 py-1 rounded-lg border border-[#E8F2F2]">
                {t('حتى', 'Up to')} {formatPrice(maxPrice)}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxPrice(0)} />
              </span>
            )}

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
                  className={`w-full text-start px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    !selectedCategory ? 'bg-[#0E5257] text-white font-bold' : 'text-[#4A6869] hover:bg-[#FFFFFF]'
                  }`}
                >
                  {t('جميع المنتجات', 'All Products')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedCategory === cat.slug ? 'bg-[#0E5257] text-white font-bold' : 'text-[#4A6869] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <span>{categoryLabel(cat)}</span>
                    <span className="opacity-60 text-[10px]">{categoryCounts.get(cat.slug) || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Country of Origin Filter */}
            {originOptions.length > 0 && (
              <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
                <h4 className="font-bold text-xs text-[#6CC6C9] uppercase">{t('بلد المنشأ', 'Country of Origin')}</h4>
                <div className="space-y-1.5">
                  {originOptions.map((country) => {
                    const checked = selectedOrigins.includes(country);
                    return (
                      <label key={country} className="flex items-center gap-2 text-xs text-[#4A6869] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedOrigins([...selectedOrigins, country]);
                            else setSelectedOrigins(selectedOrigins.filter((o) => o !== country));
                          }}
                          className="rounded border-[#E8F2F2] bg-[#FFFFFF] text-[#0E5257] focus:ring-0"
                        />
                        <span>{country}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Processing Method Filter */}
            {processOptions.length > 0 && (
              <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
                <h4 className="font-bold text-xs text-[#6CC6C9] uppercase">{t('نوع المعالجة', 'Processing Method')}</h4>
                <div className="space-y-1.5">
                  {processOptions.map((proc) => {
                    const checked = selectedProcesses.includes(proc);
                    return (
                      <label key={proc} className="flex items-center gap-2 text-xs text-[#4A6869] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProcesses([...selectedProcesses, proc]);
                            else setSelectedProcesses(selectedProcesses.filter((p) => p !== proc));
                          }}
                          className="rounded border-[#E8F2F2] bg-[#FFFFFF] text-[#0E5257] focus:ring-0"
                        />
                        <span>{proc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Max Slider — bounds derived from the catalogue */}
            <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#6CC6C9] uppercase">{t('حد السعر الأقصى', 'Max Price')}:</span>
                <span className="text-[#1A2E30]">{maxPrice > 0 ? formatPrice(maxPrice) : t('لا حد', 'No limit')}</span>
              </div>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={Math.max(1, Math.round((priceBounds.max - priceBounds.min) / 100))}
                value={priceCeiling}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMaxPrice(next >= priceBounds.max ? 0 : next);
                }}
                className="w-full accent-[#0E5257] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6B8C8E]">
                <span>{formatPrice(priceBounds.min)}</span>
                <span>{formatPrice(priceBounds.max)}</span>
              </div>
            </div>

          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3 space-y-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <ProductGrid
              products={visibleProducts}
              onNavigate={onNavigate}
              onQuickView={(prod) => setQuickViewProduct(prod)}
              loading={loading}
            />

            {remaining > 0 && (
              <div className="text-center">
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_STEP)}
                  className="px-6 py-3 rounded-xl bg-[#0E5257] text-white text-xs font-bold hover:bg-[#0B4145] transition cursor-pointer"
                >
                  {t('عرض المزيد', 'Load more')} ({remaining})
                </button>
              </div>
            )}
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
                  className={`w-full text-start p-2 rounded-xl text-xs ${!selectedCategory ? 'bg-[#0E5257] font-bold text-white' : 'text-[#4A6869]'}`}
                >
                  {t('الكل', 'All')} ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); setMobileFilterOpen(false); }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs ${selectedCategory === cat.slug ? 'bg-[#0E5257] font-bold text-white' : 'text-[#4A6869]'}`}
                  >
                    <span>{categoryLabel(cat)}</span>
                    <span className="opacity-60 text-[10px]">{categoryCounts.get(cat.slug) || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-[#E8F2F2] pt-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#6CC6C9] uppercase">{t('حد السعر الأقصى', 'Max Price')}:</span>
                <span className="text-[#1A2E30]">{maxPrice > 0 ? formatPrice(maxPrice) : t('لا حد', 'No limit')}</span>
              </div>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={Math.max(1, Math.round((priceBounds.max - priceBounds.min) / 100))}
                value={priceCeiling}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMaxPrice(next >= priceBounds.max ? 0 : next);
                }}
                className="w-full accent-[#0E5257] cursor-pointer"
              />
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
