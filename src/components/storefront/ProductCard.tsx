import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { Product, GrindType } from '../../types';
import { grindLabels } from '../../utils/coffee';
import { useReviewSummary } from '../../hooks/useReviewSummary';
import BrandLoader from '../common/BrandLoader';
import {
 Heart,
 ShoppingBag,
 Star,
 Eye,
 Check,
 ChevronDown
} from 'lucide-react';

interface ProductCardProps {
 product: Product;
 onNavigate: (path: string) => void;
 onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate, onQuickView }) => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();
 const { addToCart } = useCart();
 const { toggleWishlist, isInWishlist } = useWishlist();
 const { user } = useAuth();
 const { openAuth } = useUI();

 const [selectedGrind, setSelectedGrind] = useState<GrindType>(product.grind_options?.[0] || 'beans');
 const [selectedWeight, setSelectedWeight] = useState<string>(product.weight_options?.[0]?.value || '250g');
 const [showGrindPopover, setShowGrindPopover] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const primaryImage = product.images?.[0] || '';

  useEffect(() => {
    setImgLoaded(false);
  }, [product.id, primaryImage]);

  const isLiked = isInWishlist(product.id);
  const reviewSummary = useReviewSummary(product.id);
  const shownReviewCount = reviewSummary ? reviewSummary.count : product.review_count;
  const shownRating =
    reviewSummary && reviewSummary.count > 0 ? reviewSummary.avg.toFixed(1) : product.rating;
  const hasRatings = shownReviewCount > 0 || Number(shownRating) > 0;
 const currentPrice = product.sale_price ?? product.price;
 const hasDiscount = product.sale_price && product.sale_price < product.price;
 const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;

 const handleWishlistClick = (e: React.MouseEvent) => {
 e.stopPropagation();
 if (!user) {
 openAuth({
 message: t('سجّل الدخول أو أنشئ حساباً لحفظ المنتجات في قائمة المفضلة', 'Login or create an account to save products to your wishlist'),
 onSuccess: () => toggleWishlist(product.id)
 });
 return;
 }
 toggleWishlist(product.id);
 };

 const handleAddToCart = (e: React.MouseEvent) => {
 e.stopPropagation();
 addToCart(product, selectedWeight, selectedGrind, 1);
 setAddedSuccess(true);
 setTimeout(() => setAddedSuccess(false), 1800);
 };

 return (
 <div
 onClick={() => onNavigate(`/products/${product.slug}`)}
 className="group relative bg-[#F0FAFA] border border-[#E8F2F2] hover:border-[#6CC6C9]/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-500 flex flex-col cursor-pointer brand-glow"
 >
  {/* Top Image Box */}
  <div className="relative aspect-square bg-[#FFFFFF] overflow-hidden">
  {/* Brand spinner until the product photo loads */}
  {!imgLoaded && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FFFFFF]">
  <BrandLoader size={56} />
  </div>
  )}
  {/* Primary Image */}
  <img
  src={primaryImage}
  alt={product.name_ar}
  onLoad={() => setImgLoaded(true)}
  onError={() => setImgLoaded(true)}
  className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
  />

 {/* Secondary Image on Hover if available */}
 {product.images[1] && (
 <img
 src={product.images[1]}
 alt={product.name_ar}
 className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
 />
 )}

 {/* Overlay Dark Gradient */}
 <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF]/80 via-transparent to-transparent opacity-60" />

 {/* Top Right Badges */}
 <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 items-end">
 {product.is_new && (
 <span className="bg-[#0E5257] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow uppercase">
 {t('جديد', 'NEW')}
 </span>
 )}
 {product.is_bestseller && (
 <span className="bg-[#6CC6C9] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow uppercase">
 {t('الأكثر مبيعاً', 'BESTSELLER')}
 </span>
 )}
 {hasDiscount && (
 <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow">
 -{discountPercent}%
 </span>
 )}
 </div>

 {/* Top Left Wishlist Button */}
 <button
 onClick={handleWishlistClick}
 className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition z-10 cursor-pointer ${isLiked
 ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
 : ' hover:bg-[#0E5257]'
 }`}
 title={t('إضافة للمفضلة', 'Wishlist')}
 >
 <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
 </button>

 {/* Quick View Button on Image Hover */}
 {onQuickView && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 onQuickView(product);
 }}
 className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition opacity-0 group-hover:opacity-100 shadow-xl flex items-center gap-1.5 z-10 cursor-pointer"
 >
 <Eye className="w-3.5 h-3.5" />
 <span>{t('نظرة سريعة', 'Quick View')}</span>
 </button>
 )}
 </div>

 {/* Content Section */}
 <div className="p-4 flex-1 flex flex-col justify-between space-y-3">

 <div>
 {/* Origin & Process Pill Bar */}
 <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
 <span className="text-[10px] font-bold bg-[#0E5257]/20 text-[#6CC6C9] px-2 py-0.5 rounded">
 {language === 'ar' ? product.origin_country_ar : product.origin_country_en}
 </span>
 <span className="text-[10px] text-[#6B8C8E]">
 • {language === 'ar' ? product.process_ar : product.process_en}
 </span>
 </div>

 {/* Title */}
 <h3 className="font-bold text-sm sm:text-base text-[#1A2E30] group-hover:text-[#6CC6C9] transition line-clamp-1">
 {language === 'ar' ? product.name_ar : product.name_en}
 </h3>

 {/* Tasting Notes Pills */}
 <div className="flex items-center gap-1 mt-2 flex-wrap">
 {(language === 'ar' ? product.tasting_notes_ar : product.tasting_notes_en).slice(0, 3).map((note, idx) => (
 <span
 key={idx}
 className="text-[10px] bg-[#FFFFFF] text-[#4A6869] px-2 py-0.5 rounded border border-[#E8F2F2]"
 >
 {note}
 </span>
 ))}
 </div>
 </div>

 {/* Price & Add to Cart Action */}
 <div className="pt-2 border-t border-[#E8F2F2] space-y-2">

 {/* Rating & Stock */}
 <div className="flex items-center justify-between text-xs text-[#6B8C8E]">
  <div className="flex items-center gap-1 text-yellow-500 font-bold">
  <Star className="w-3.5 h-3.5 fill-current" />
  {hasRatings ? (
  <>
  <span>{shownRating}</span>
  <span className="text-[10px] text-[#6B8C8E]">({shownReviewCount})</span>
  </>
  ) : (
  <span className="text-[10px] text-[#6B8C8E]">{t('لا تقييمات بعد', 'No reviews yet')}</span>
  )}
  </div>

 {product.stock <= 5 ? (
 <span className="text-[10px] text-amber-400 font-bold animate-pulse">
 {t('متبقي كمية محدودة!', 'Low stock!')}
 </span>
 ) : (
 <span className="text-[10px] text-emerald-400">
 {t('متوفر طازج', 'Fresh In Stock')}
 </span>
 )}
 </div>

 {/* Price & Button Bar */}
 <div className="flex items-center justify-between gap-2">
 <div>
 <div className="font-extrabold text-base sm:text-lg text-[#6CC6C9]">
 {formatPrice(currentPrice)}
 </div>
 {hasDiscount && (
 <div className="text-[11px] text-[#6B8C8E] line-through">
 {formatPrice(product.price)}
 </div>
 )}
 </div>

 {/* Grind Popover Toggle & Quick Add */}
 <div className="relative">
 <button
 onClick={handleAddToCart}
 className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer ${addedSuccess
 ? 'bg-emerald-600 text-white'
 : 'bg-[#0E5257] hover:bg-[#2B7D82] text-white shadow-[#0E5257]/30'
 }`}
 >
 {addedSuccess ? (
 <>
 <Check className="w-4 h-4 animate-bounce" />
 <span className="hidden sm:inline">{t('تمت الإضافة!', 'Added!')}</span>
 </>
 ) : (
 <>
 <ShoppingBag className="w-4 h-4" />
 <span>{t('إضافة للسلة', 'Add')}</span>
 </>
 )}
 </button>
 </div>
 </div>

 </div>

 </div>
 </div>
 );
};

export default ProductCard;
