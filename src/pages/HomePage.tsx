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

const DEFAULT_SECTIONS: HomepageSection[] = [
 {
 id: 'sec-hero',
 type: 'hero_slider',
 is_enabled: true,
 sort_order: 1,
 config: {
 slides: [
 {
 id: 'slide-1',
 title_ar: 'محاصيل إثيوبية وكولومبية نادرة بدرجات تقييم 85+ SCA',
 title_en: 'Rare 85+ SCA Micro-lots Sourced From Ethiopia & Colombia',
 subtitle_ar: 'محمصة حديثاً بعناية فائقة لتجربة إشراق فاكهي واستخلاص متوازن',
 subtitle_en: 'Freshly roasted micro-lots crafted for pure flavor clarity and rich crema',
 badge_ar: 'محاصيل الموسم الجديد',
 badge_en: 'New Harvest Crop',
 image_desktop: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80',
 image_mobile: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
 cta_text_ar: 'تسوق المحاصيل النادرة',
 cta_text_en: 'Explore Specialty Beans',
 cta_link: '/products?category=single-origin'
 }
 ]
 }
 },
 {
 id: 'sec-benefits', type: 'benefits', is_enabled: true, sort_order: 2, config: {
 items: [
 { icon: 'Coffee', title_ar: 'قهوة مختصة 100%', title_en: '100% Specialty Coffee', desc_ar: 'محاصيل سينجل أوريجين فاخرة من أفضل المزارع العالمية', desc_en: 'Premium single-origin crops from world-class farms' },
 { icon: 'Truck', title_ar: 'شحن سريع لباب بيتك', title_en: 'Fast Home Delivery', desc_ar: 'توصيل سريع واحترافي داخل المملكة العربية السعودية', desc_en: 'Fast professional delivery across Saudi Arabia' },
 { icon: 'ShieldCheck', title_ar: 'جودة مضمونة 100%', title_en: '100% Quality Guaranteed', desc_ar: 'نضمن جودة وطزاجة كل كيس قهوة نرسله لعملائنا', desc_en: 'We guarantee freshness and quality in every bag' },
 { icon: 'RotateCcw', title_ar: 'استرجاع سهل وسريع', title_en: 'Easy Returns', desc_ar: 'سياسة استرجاع مرنة خلال 7 أيام من تاريخ الشراء', desc_en: 'Flexible 7-day return policy from purchase date' }
 ]
 }
 },
 { id: 'sec-categories', type: 'featured_categories', title_ar: 'تصفح حسب الفئات والأقسام', title_en: 'Shop by Category', is_enabled: true, sort_order: 3, config: {} },
 { id: 'sec-bestsellers', type: 'product_carousel', title_ar: 'الأكثر مبيعاً ورغبةً لدى العملاء', title_en: 'Bestseller Micro-Lots & Gear', subtitle_ar: 'المحاصيل والأدوات المفضلة لمجتمع عشاق القهوة', subtitle_en: 'Top rated beans and barista equipment', is_enabled: true, sort_order: 4, config: { collection: 'bestseller' } },
 { id: 'sec-quiz', type: 'coffee_quiz', title_ar: 'محتار في اختيار محصولك المناسب؟', title_en: 'Not sure which crop fits your taste?', is_enabled: true, sort_order: 5, config: {} },
 {
 id: 'sec-values', type: 'values_carousel', is_enabled: true, sort_order: 6, config: {
 items: [
 { icon: 'Leaf', title_ar: 'مصداقية و تجارة عادل', title_en: 'Direct Trade', desc_ar: 'نعمل مباشرة مع المزارع بدون وسطاء لضمان عوائد عادلة', desc_en: 'Working directly with farms ensuring fair farmer income' },
 { icon: 'Flame', title_ar: 'تحميص طازج أسبوعياً', title_en: 'Fresh Weekly Roast', desc_ar: 'نحمص المحاصيل كل أسبوع لضمان أقصى طزاجة', desc_en: 'We roast fresh every week for maximum freshness' },
 { icon: 'Award', title_ar: 'جودة SCA معتمدة', title_en: 'SCA Certified Quality', desc_ar: 'نختار كل محصول بأعلى معايير جودة السبيشياليتي', desc_en: 'Every crop scored above 84 points by SCA standards' },
 { icon: 'Coffee', title_ar: 'تحميص يدوي بعناية', title_en: 'Artisan Hand Roasted', desc_ar: 'كل دفعة محمصة يدوياً بخبرة وعناية فائقة', desc_en: 'Every batch artisan roasted with extreme care' },
 { icon: 'Heart', title_ar: 'مجتمع القهوة', title_en: 'Coffee Community', desc_ar: 'نبني مجتمع عشاق القهوة المختصة في المملكة', desc_en: "Building Saudi Arabia's specialty coffee community" },
 { icon: 'Recycle', title_ar: 'استدامة بيئية', title_en: 'Eco-Sustainable', desc_ar: 'تغليف صديق للبيئة وممارسات مستدامة في كل مرحلة', desc_en: 'Eco-friendly packaging and sustainable practices' }
 ]
 }
 },
 { id: 'sec-new', type: 'product_carousel', title_ar: 'أحدث المحاصيل والمنتجات', title_en: 'New Arrivals & Fresh Crops', subtitle_ar: 'وصل حديثاً محاصيل فاخرة محمصة أسبوعياً', subtitle_en: 'Freshly roasted weekly micro-lots', is_enabled: true, sort_order: 7, config: { collection: 'new' } },
 { id: 'sec-story', type: 'roastery_story', is_enabled: true, sort_order: 8, config: {} },
 {
 id: 'sec-testimonials', type: 'testimonials', is_enabled: true, sort_order: 9, config: {
 items: [
 { name_ar: 'سعود الحربي', name_en: 'Saud Al-Harbi', role_ar: 'باريستا ومحب قهوة', role_en: 'Barista & Coffee Enthusiast', rating: 5, comment_ar: 'أفضل قهوة مختصة جربتها في السعودية. محصول إثيوبيا شلشلي كان خرافي مع تحضير V60.', comment_en: "Best specialty coffee I've tried in Saudi Arabia. The Ethiopia Chelchele was incredible with V60." },
 { name_ar: 'نورة القحطاني', name_en: 'Noura Al-Qahtani', role_ar: 'باريستا منزلي', role_en: 'Home Barista', rating: 5, comment_ar: 'بوكس الاكتشاف كان هدية مثالية. كل محصول كان أجمل من الثاني. التغليف فخم جداً.', comment_en: 'The Discovery Box was a perfect gift. Every crop was better than the last. Premium packaging too.' },
 { name_ar: 'فهد العتيبي', name_en: 'Fahd Al-Otaibi', role_ar: 'محمم قهوة', role_en: 'Coffee Roaster', rating: 5, comment_ar: 'جودة التحميص ممتازة. استخدمت الإسبرسو بلند他们在拿铁 وطلع كريمي وغني.', comment_en: "Excellent roast quality. I use their espresso blend for lattes and it's rich and creamy." }
 ]
 }
 },
 { id: 'sec-newsletter', type: 'newsletter', is_enabled: true, sort_order: 10, config: {} }
];

const KNOWN_SECTION_TYPES = new Set([
  'hero_slider', 'featured_categories', 'product_carousel', 'values_carousel',
  'coffee_quiz', 'roastery_story', 'banner', 'benefits', 'testimonials', 'newsletter',
]);

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_SECTIONS);
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
