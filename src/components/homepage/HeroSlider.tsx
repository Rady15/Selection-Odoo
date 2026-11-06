import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HeroSlide } from '../../types';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { cleanText, cleanUrl } from '../../utils/text';

interface HeroSliderProps {
  slides: HeroSlide[];
  onNavigate: (path: string) => void;
  /** From the CMS block configuration. */
  autoplay?: boolean;
  interval?: number;
}

/** Crossfade length. Long enough to read as a dissolve, short enough to feel snappy. */
const FADE_MS = 900;
/** Slow zoom applied to the active slide only (Ken Burns). */
const KEN_BURNS_MS = 9000;
const MIN_INTERVAL = 2500;

const resolveSources = (slide: HeroSlide): string[] => {
  const chain = [
    ...(Array.isArray(slide?.sources) ? slide.sources : []),
    slide?.image_desktop,
    slide?.fallback_image,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
  return [...new Set(chain)];
};

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  onNavigate,
  autoplay = true,
  interval = 6000,
}) => {
  const { language } = useLanguage();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  // Per-slide pointer into the fallback chain, advanced when a source 404s or
  // turns out to be one of Odoo's 256px placeholders.
  const [sourceIndex, setSourceIndex] = useState<Record<string, number>>({});

  const items = useMemo(() => (Array.isArray(slides) ? slides.filter(Boolean) : []), [slides]);
  const count = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  // A shrinking slide list (CMS edit) must not leave the index out of range.
  useEffect(() => {
    if (count > 0 && index > count - 1) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Autoplay. Paused on hover and while the tab is in the background so the
  // visitor never returns to a slide they never saw.
  useEffect(() => {
    if (!autoplay || count < 2 || hovered || tabHidden) return;
    const delay = Number.isFinite(Number(interval)) && Number(interval) >= MIN_INTERVAL
      ? Number(interval)
      : 6000;
    const timer = window.setInterval(() => setIndex((prev) => (prev + 1) % count), delay);
    return () => window.clearInterval(timer);
  }, [autoplay, count, hovered, tabHidden, interval]);

  const advanceSource = useCallback((slideId: string, max: number) => {
    setSourceIndex((prev) => {
      const current = prev[slideId] ?? 0;
      if (current >= max - 1) return prev;
      return { ...prev, [slideId]: current + 1 };
    });
  }, []);

  if (count === 0) return null;

  const rtl = language === 'ar';

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0B4145] h-[62vh] min-h-[440px] max-h-[760px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-roledescription="carousel"
      aria-label={rtl ? 'أبرز العروض' : 'Featured highlights'}
      data-testid="hero-slider"
    >
      {/* Every slide stays mounted and crossfades on opacity. Previously the
          slides unmounted/remounted (AnimatePresence mode="wait"), which left
          a white gap between frames and restarted the image request each
          time — that is what made the change look like a flash, not a fade. */}
      {items.map((slide, i) => {
        const active = i === index;
        const sources = resolveSources(slide);
        const src = sources[Math.min(sourceIndex[slide.id] ?? 0, Math.max(sources.length - 1, 0))] || '';

        const badge = cleanText(slide.badge_ar) || cleanText(slide.badge_en);
        const titleAr = cleanText(slide.title_ar);
        const titleEn = cleanText(slide.title_en);
        const title = rtl ? titleAr || titleEn : titleEn || titleAr;
        const subtitleAr = cleanText(slide.subtitle_ar);
        const subtitleEn = cleanText(slide.subtitle_en);
        const subtitle = rtl ? subtitleAr || subtitleEn : subtitleEn || subtitleAr;
        const ctaText = rtl
          ? cleanText(slide.cta_text_ar) || cleanText(slide.cta_text_en)
          : cleanText(slide.cta_text_en) || cleanText(slide.cta_text_ar);
        const ctaLink = cleanUrl(slide.cta_link) || cleanUrl(slide.link_url);

        return (
          <div
            key={slide.id || i}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{
              opacity: active ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
              pointerEvents: active ? 'auto' : 'none',
              zIndex: active ? 2 : 1,
            }}
            aria-hidden={!active}
            // Hidden slides stay mounted (that is what makes the crossfade
            // seamless), so they must not be tabbable or announced.
            inert={!active}
            data-slide-index={i}
            data-active={active ? 'true' : 'false'}
          >
            {src && (
              <img
                src={src}
                alt={title || ''}
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
                style={{
                  transform: active ? 'scale(1.06)' : 'scale(1)',
                  transitionProperty: 'transform',
                  transitionTimingFunction: 'linear',
                  transitionDuration: `${KEN_BURNS_MS}ms`,
                }}
                decoding="async"
                fetchPriority={i === 0 ? 'high' : 'low'}
                onLoad={(event) => {
                  // Odoo's default placeholder is 256px wide; a real banner is
                  // 1000px+. Anything smaller is not the image we want.
                  const el = event.currentTarget;
                  if (el.naturalWidth > 0 && el.naturalWidth < 600) advanceSource(slide.id, sources.length);
                }}
                onError={() => advanceSource(slide.id, sources.length)}
              />
            )}

            {/* Legibility scrim — stronger at the bottom where the CTA sits. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />

            {/* Slide copy. Rendered per slide so it crossfades with the image
                instead of popping in a frame later.
                Many CMS banners already have the headline baked into the
                artwork, so a CTA with no headline sits low instead of landing
                on top of the logo. */}
            <div
              className={`absolute inset-0 flex flex-col items-center px-5 sm:px-10 text-center ${
                title || subtitle ? 'justify-center' : 'justify-end pb-16 sm:pb-20'
              }`}
            >
              <div className="max-w-3xl space-y-3 sm:space-y-5">
                {badge && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white/90 text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    {badge}
                  </span>
                )}

                {title && (
                  <h1
                    dir="auto"
                    className="text-2xl sm:text-4xl lg:text-6xl font-extrabold font-serif leading-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
                  >
                    {title}
                  </h1>
                )}

                {subtitle && (
                  <p
                    dir="auto"
                    className="text-xs sm:text-base lg:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]"
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {ctaText && ctaLink && (
                <button
                  onClick={() => {
                    if (/^https?:\/\//i.test(ctaLink)) {
                      window.open(ctaLink, '_blank', 'noopener,noreferrer');
                    } else {
                      onNavigate(ctaLink);
                    }
                  }}
                  className="mt-6 sm:mt-8 inline-flex items-center gap-2 bg-[#0E5257] hover:bg-[#2B7D82] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-xs sm:text-base font-bold transition-colors duration-300 shadow-2xl shadow-black/40 cursor-pointer active:scale-95"
                >
                  <span dir="auto" className="max-w-[60vw] truncate">{ctaText}</span>
                  {rtl ? <ArrowLeft className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            className="absolute top-1/2 -translate-y-1/2 start-2 sm:start-4 z-10 p-2 sm:p-2.5 rounded-full bg-black/25 hover:bg-black/45 border border-white/25 text-white backdrop-blur transition cursor-pointer"
            aria-label={rtl ? 'الشريحة السابقة' : 'Previous slide'}
            data-testid="hero-prev"
          >
            {rtl ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={() => goTo(index + 1)}
            className="absolute top-1/2 -translate-y-1/2 end-2 sm:end-4 z-10 p-2 sm:p-2.5 rounded-full bg-black/25 hover:bg-black/45 border border-white/25 text-white backdrop-blur transition cursor-pointer"
            aria-label={rtl ? 'الشريحة التالية' : 'Next slide'}
            data-testid="hero-next"
          >
            {rtl ? <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {items.map((slide, i) => (
              <button
                key={slide.id || i}
                onClick={() => goTo(i)}
                aria-label={rtl ? `الشريحة ${i + 1}` : `Slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? 'w-8 bg-[#6CC6C9]' : 'w-2 bg-white/45 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSlider;
