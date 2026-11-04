import React, { useState, useEffect } from 'react';
import { HomepageSection, Product } from '../types';
import HeroSlider from '../components/homepage/HeroSlider';
import BenefitsBar from '../components/homepage/BenefitsBar';
import CoffeeFinderCallout from '../components/homepage/CoffeeFinderCallout';
import FeaturedCategories from '../components/homepage/FeaturedCategories';
import ProductCarouselSection from '../components/homepage/ProductCarouselSection';
import ValuesCarouselSection from '../components/homepage/ValuesCarouselSection';
import RoasteryStorySection from '../components/homepage/RoasteryStorySection';
import TestimonialsSection from '../components/homepage/TestimonialsSection';
import NewsletterSection from '../components/homepage/NewsletterSection';
import ProductQuickViewModal from '../components/storefront/ProductQuickViewModal';
import BannerDisplay from '../components/homepage/BannerDisplay';

interface HomePageProps {
 onNavigate: (path: string) => void;
}

const KNOWN_SECTION_TYPES = new Set([
  'hero_slider', 'featured_categories', 'product_carousel', 'values_carousel',
  'coffee_quiz', 'roastery_story', 'banner', 'benefits', 'testimonials', 'newsletter',
]);

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/api/public/homepage')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const list: any[] = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.sections) ? data.sections : []);
        // Merge backend sections into defaults: backend wins on matching
        // type (+collection for carousels), defaults fill the rest. An
        // unrecognized payload keeps the defaults instead of blanking the page.
        const valid = list.filter(s => s && KNOWN_SECTION_TYPES.has(s.type));
        if (valid.length === 0) return;
        setSections(prev => {
          const remaining = [...valid].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const merged = prev.map(def => {
            const idx = remaining.findIndex(
              s => s.type === def.type && ((s.config?.collection || '') === (def.config?.collection || ''))
            );
            if (idx >= 0) {
              const [match] = remaining.splice(idx, 1);
              return { ...match, id: match.id || def.id } as HomepageSection;
            }
            return def;
          });
          const extras = remaining.filter(s => s.is_enabled !== false);
          return [...merged, ...extras];
        });
      })
      .catch(err => console.error('Failed to load homepage sections:', err));
  }, []);

 return (
 <div className="space-y-0 bg-[#FFFFFF]">
 <BannerDisplay position="hero" onNavigate={onNavigate} />
 {sections
 .filter(sec => sec.is_enabled)
 .map(sec => {
 switch (sec.type) {
 case 'hero_slider':
 return (
 <HeroSlider
 key={sec.id}
 slides={sec.config?.slides || []}
 onNavigate={onNavigate}
 />
 );

 case 'benefits':
 return <BenefitsBar key={sec.id} items={sec.config?.items} />;

 case 'coffee_quiz':
 return (
 <CoffeeFinderCallout
 key={sec.id}
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
 key={sec.id}
 onNavigate={onNavigate}
 title_ar={sec.title_ar}
 title_en={sec.title_en}
 />
 );

 case 'product_carousel':
 return (
 <ProductCarouselSection
 key={sec.id}
 title_ar={sec.title_ar || 'أحدث المحاصيل والمنتجات'}
 title_en={sec.title_en || 'New Arrivals & Fresh Crops'}
 subtitle_ar={sec.subtitle_ar}
 subtitle_en={sec.subtitle_en}
 collectionType={sec.config?.collection || 'new'}
 categorySlug={sec.config?.categorySlug}
 badge_ar={sec.config?.badge_ar || (sec.config?.collection === 'bestseller' ? 'الأعلى طلباً' : 'وصل حديثاً')}
 badge_en={sec.config?.badge_en || (sec.config?.collection === 'bestseller' ? 'Top Rated' : 'New Arrival')}
 onNavigate={onNavigate}
 onQuickView={prod => setQuickViewProduct(prod)}
 />
 );

 case 'values_carousel':
 return <ValuesCarouselSection key={sec.id} onNavigate={onNavigate} items={sec.config?.items} />;

 case 'roastery_story':
 return (
 <RoasteryStorySection
 key={sec.id}
 title_ar={sec.title_ar}
 title_en={sec.title_en}
 subtitle_ar={sec.subtitle_ar}
 subtitle_en={sec.subtitle_en}
 video_url={sec.config?.video_url}
 onNavigate={onNavigate}
 />
 );

 case 'testimonials':
 return <TestimonialsSection key={sec.id} items={sec.config?.items} />;

 case 'newsletter':
 return <NewsletterSection key={sec.id} />;

          default:
            return null;
        }
      })}

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
