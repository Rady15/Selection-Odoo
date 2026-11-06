import React, { useState, useEffect } from 'react';
import { HomepageSection, Product } from '../types';
import HeroSlider from '../components/homepage/HeroSlider';
import BenefitsBar from '../components/homepage/BenefitsBar';
import CoffeeFinderCallout from '../components/homepage/CoffeeFinderCallout';
import FeaturedCategories from '../components/homepage/FeaturedCategories';
import ProductCarouselSection from '../components/homepage/ProductCarouselSection';
import ValuesCarouselSection from '../components/homepage/ValuesCarouselSection';
import RoasteryStorySection from '../components/homepage/RoasteryStorySection';
import VideoSection from '../components/homepage/VideoSection';
import TestimonialsSection from '../components/homepage/TestimonialsSection';
import NewsletterSection from '../components/homepage/NewsletterSection';
import ProductQuickViewModal from '../components/storefront/ProductQuickViewModal';
import BannerDisplay from '../components/homepage/BannerDisplay';

interface HomePageProps {
 onNavigate: (path: string) => void;
}

const KNOWN_SECTION_TYPES = new Set([
  'hero_slider', 'featured_categories', 'product_carousel', 'values_carousel',
  'coffee_quiz', 'roastery_story', 'video', 'banner', 'benefits', 'testimonials', 'newsletter',
]);

/**
 * Rendered when the CMS is unreachable or returns nothing usable, so the
 * homepage is never blank. Once the API answers with blocks, its list — and its
 * order — replaces this entirely: the CMS is the source of truth.
 */
const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: 'default-hero',
    type: 'hero_slider',
    is_enabled: true,
    sort_order: 0,
    config: {
      autoplay: true,
      interval: 6000,
      slides: [
        {
          id: 'default-slide',
          title_ar: 'قهوة مختصة بمعايير عالمية',
          title_en: 'Specialty Coffee, Sourced With Intent',
          subtitle_ar: 'محاصيل سينجل أوريجين من أفضل المزارع، تُحمّص طازجة كل أسبوع.',
          subtitle_en: 'Single-origin micro-lots from world-class farms, roasted fresh every week.',
          cta_text_ar: 'تسوق الآن',
          cta_text_en: 'Shop Now',
          cta_link: '/products',
          image_desktop: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80',
          image_mobile: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=960&q=80',
          badge_ar: 'سليكشن',
          badge_en: 'Selection',
        },
      ],
    },
  },
  { id: 'default-categories', type: 'featured_categories', is_enabled: true, sort_order: 10, config: {} },
  {
    id: 'default-new',
    type: 'product_carousel',
    is_enabled: true,
    sort_order: 20,
    title_ar: 'أحدث المحاصيل والمنتجات',
    title_en: 'New Arrivals & Fresh Crops',
    config: { collection: 'new' },
  },
  { id: 'default-quiz', type: 'coffee_quiz', is_enabled: true, sort_order: 30, config: {} },
  { id: 'default-story', type: 'roastery_story', is_enabled: true, sort_order: 40, config: {} },
  { id: 'default-newsletter', type: 'newsletter', is_enabled: true, sort_order: 50, config: {} },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_SECTIONS);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/public/homepage')
      .then(res => (res.ok ? res.json() : null))
      .then(payload => {
        if (cancelled) return;
        const list: any[] = Array.isArray(payload)
          ? payload
          : (payload && Array.isArray(payload.sections) ? payload.sections : []);
        // One section per CMS block, already ordered by the API wrapper.
        // Unknown block types are dropped rather than forced into a hero.
        const valid = list.filter(s => s && KNOWN_SECTION_TYPES.has(s.type));
        if (valid.length === 0) return; // keep the defaults
        setSections(
          [...valid].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) as HomepageSection[]
        );
      })
      .catch(err => console.error('Failed to load homepage sections:', err));

    return () => { cancelled = true; };
  }, []);

  /** One renderer per CMS block type. Each receives the data its block carried. */
  const renderSection = (sec: HomepageSection) => {
    switch (sec.type) {
      case 'hero_slider':
        return (
          <HeroSlider
            slides={sec.config?.slides || []}
            autoplay={sec.config?.autoplay}
            interval={sec.config?.interval}
            onNavigate={onNavigate}
          />
        );

      case 'benefits':
        return <BenefitsBar items={sec.config?.items} />;

      case 'coffee_quiz':
        return (
          <CoffeeFinderCallout
            onNavigate={onNavigate}
            title_ar={sec.title_ar}
            title_en={sec.title_en}
            subtitle_ar={sec.subtitle_ar}
            subtitle_en={sec.subtitle_en}
          />
        );

      case 'featured_categories':
        return (
          <FeaturedCategories
            onNavigate={onNavigate}
            title_ar={sec.title_ar}
            title_en={sec.title_en}
            subtitle_ar={sec.subtitle_ar}
            subtitle_en={sec.subtitle_en}
            categories={sec.config?.categories}
          />
        );

      case 'product_carousel':
        return (
          <ProductCarouselSection
            title_ar={sec.title_ar || 'أحدث المحاصيل والمنتجات'}
            title_en={sec.title_en || 'New Arrivals & Fresh Crops'}
            subtitle_ar={sec.subtitle_ar}
            subtitle_en={sec.subtitle_en}
            collectionType={sec.config?.collection || 'new'}
            categorySlug={sec.config?.categorySlug}
            products={sec.config?.products}
            badge_ar={sec.config?.badge_ar || (sec.config?.collection === 'bestseller' ? 'الأعلى طلباً' : 'وصل حديثاً')}
            badge_en={sec.config?.badge_en || (sec.config?.collection === 'bestseller' ? 'Top Rated' : 'New Arrival')}
            onNavigate={onNavigate}
            onQuickView={prod => setQuickViewProduct(prod)}
          />
        );

      case 'values_carousel':
        return <ValuesCarouselSection onNavigate={onNavigate} items={sec.config?.items} />;

      case 'video':
        return (
          <VideoSection
            title_ar={sec.title_ar}
            title_en={sec.title_en}
            subtitle_ar={sec.subtitle_ar}
            subtitle_en={sec.subtitle_en}
            video_url={sec.config?.video_url}
            poster={sec.config?.image}
          />
        );

      case 'roastery_story':
        return (
          <RoasteryStorySection
            title_ar={sec.title_ar}
            title_en={sec.title_en}
            subtitle_ar={sec.subtitle_ar}
            subtitle_en={sec.subtitle_en}
            video_url={sec.config?.video_url}
            image={sec.config?.image}
            onNavigate={onNavigate}
          />
        );

      case 'testimonials':
        return <TestimonialsSection items={sec.config?.items} />;

      case 'newsletter':
        return <NewsletterSection />;

      default:
        return null;
    }
  };

 return (
 <div className="space-y-0 bg-[#FFFFFF]">
 <BannerDisplay position="hero" onNavigate={onNavigate} />
 {sections
 .filter(sec => sec.is_enabled !== false)
 .map(sec => (
   // `contents` keeps the wrapper out of the layout while giving each block a
   // stable hook for debugging and for the homepage verification test.
   <div key={sec.id} className="contents" data-section-type={sec.type} data-sort-order={sec.sort_order}>
     {renderSection(sec)}
   </div>
 ))}

      <BannerDisplay position="footer" onNavigate={onNavigate} />

      {/* Quick View Modal Overlay */}
 <ProductQuickViewModal
 product={quickViewProduct}
 onClose={() => setQuickViewProduct(null)}
 onNavigate={onNavigate}
 />
 </div>
 );
};

export default HomePage;
