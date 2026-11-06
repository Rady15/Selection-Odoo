import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedTitle from '../common/AnimatedTitle';
import { Play } from 'lucide-react';
import { cleanText } from '../../utils/text';

interface VideoSectionProps {
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  /** Already converted to an embeddable URL by the API wrapper. */
  video_url?: string;
  poster?: string;
}

const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80';

/**
 * Full-width video block (`type: "video"` in the CMS).
 *
 * The iframe is only mounted after a click: an embedded YouTube player costs
 * ~1 MB and would otherwise load on every homepage visit.
 */
export const VideoSection: React.FC<VideoSectionProps> = ({
  title_ar,
  title_en,
  subtitle_ar,
  subtitle_en,
  video_url,
  poster,
}) => {
  const { language, t } = useLanguage();
  const [playing, setPlaying] = useState(false);

  const src = cleanText(video_url);
  // A `video` block with no usable URL has nothing to show; the story section
  // covers the text-only case.
  if (!src) return null;

  const title = language === 'ar' ? cleanText(title_ar) || cleanText(title_en) : cleanText(title_en) || cleanText(title_ar);
  const subtitle = language === 'ar' ? cleanText(subtitle_ar) || cleanText(subtitle_en) : cleanText(subtitle_en) || cleanText(subtitle_ar);
  const posterSrc = cleanText(poster) || DEFAULT_POSTER;
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(src);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="py-12 bg-[#FFFFFF] border-b border-[#E8F2F2]/40"
      data-testid="homepage-video"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {(title || subtitle) && (
          <AnimatedTitle
            badge={t('من داخل المحمصة', 'Inside The Roastery')}
            title={title || t('شاهد كيف نحمّص قهوتنا', 'See How We Roast')}
            subtitle={subtitle || undefined}
          />
        )}

        <div className="relative rounded-3xl overflow-hidden border border-[#E8F2F2] shadow-2xl aspect-video bg-[#0B4145] group">
          {playing ? (
            isFile ? (
              <video src={src} className="w-full h-full object-cover" controls autoPlay playsInline />
            ) : (
              <iframe
                src={`${src}${src.includes('?') ? '&' : '?'}autoplay=1`}
                title={title || 'Selection Coffee'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <>
              <img
                src={posterSrc}
                alt={title || 'Selection Coffee'}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center">
                <button
                  onClick={() => setPlaying(true)}
                  className="w-20 h-20 rounded-full bg-[#0E5257] hover:bg-[#6CC6C9] text-white flex items-center justify-center transition transform hover:scale-110 shadow-2xl shadow-black/50 cursor-pointer"
                  aria-label={t('تشغيل الفيديو', 'Play video')}
                >
                  <Play className="w-8 h-8 fill-current ms-1" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default VideoSection;
