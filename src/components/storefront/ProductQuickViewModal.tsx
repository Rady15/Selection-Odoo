import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { Product, GrindType } from '../../types';
import { grindLabels } from '../../utils/coffee';
import FlavorChart from './FlavorChart';
import {
 X,
 Star,
 ShoppingBag,
 Check,
 Plus,
 Minus,
 Truck,
 ArrowLeft,
 ArrowRight
} from 'lucide-react';

interface ProductQuickViewModalProps {
 product: Product | null;
 onClose: () => void;
 onNavigate: (path: string) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose, onNavigate }) => {
 const { language, t } = useLanguage();
 const { formatPrice } = useCurrency();
 const { addToCart } = useCart();

 const [selectedWeight, setSelectedWeight] = useState<string>(product?.weight_options?.[0]?.value || '250g');
 const [selectedGrind, setSelectedGrind] = useState<GrindType>(product?.grind_options?.[0] || 'beans');
 const [quantity, setQuantity] = useState(1);
 const [activeImageIdx, setActiveImageIdx] = useState(0);
 const [addedSuccess, setAddedSuccess] = useState(false);

 if (!product) return null;

 const weightOpt = product.weight_options?.find(w => w.value === selectedWeight) || product.weight_options?.[0];
 const unitPrice = (product.sale_price ?? product.price) + (weightOpt ? weightOpt.priceModifier : 0);

 const handleAddToCart = () => {
 addToCart(product, selectedWeight, selectedGrind, quantity);
 setAddedSuccess(true);
 setTimeout(() => {
 setAddedSuccess(false);
 onClose();
 }, 1200);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
 onClick={onClose}
 />

 {/* Modal Container */}
 <div className="relative w-full max-w-4xl bg-[#FFFFFF] text-[#1A2E30] border border-[#E8F2F2] rounded-3xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 p-6 gap-6">

 {/* Close Button */}
 <button
 onClick={onClose}
 className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[#E8F2F2] transition cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>

 {/* Gallery Column */}
 <div className="space-y-3">
 <div className="aspect-square rounded-2xl bg-[#F0FAFA] overflow-hidden border border-[#E8F2F2] relative">
 <img
 src={product.images[activeImageIdx] || product.images[0]}
 alt={product.name_ar}
 className="w-full h-full object-cover"
 />
 </div>

 {/* Thumbnails */}
 {product.images.length > 1 && (
 <div className="flex gap-2">
 {product.images.map((img, idx) => (
 <button
 key={idx}
 onClick={() => setActiveImageIdx(idx)}
 className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${activeImageIdx === idx ? 'border-[#6CC6C9]' : 'border-[#E8F2F2] opacity-60'
 }`}
 >
 <img src={img} alt="" className="w-full h-full object-cover" />
 </button>
 ))}
 </div>
 )}

 {/* Flavor Profile Chart */}
 {product.flavor_profile && (
 <div className="p-3 bg-[#F0FAFA] border border-[#E8F2F2] rounded-xl">
 <h5 className="font-bold text-xs text-[#6CC6C9] mb-2 uppercase">
 {t('مخطط نكهة الكوب', 'Cup Flavor Attributes')}
 </h5>
 <FlavorChart profile={product.flavor_profile} />
 </div>
 )}
 </div>

 {/* Product Info & Config Column */}
 <div className="flex flex-col justify-between space-y-4">

 <div className="space-y-3">
 {/* Origin & Process Badge */}
 <div className="flex items-center gap-2">
 <span className="text-xs bg-[#0E5257] text-white px-2.5 py-0.5 rounded-md font-bold">
 {language === 'ar' ? product.origin_country_ar : product.origin_country_en}
 </span>
 <span className="text-xs text-[#4A6869] font-medium">
 {language === 'ar' ? product.process_ar : product.process_en}
 </span>
 </div>

 {/* Title */}
 <h3 className="font-extrabold text-xl text-[#1A2E30]">
 {language === 'ar' ? product.name_ar : product.name_en}
 </h3>

 <p className="text-xs text-[#6B8C8E] leading-relaxed">
 {language === 'ar' ? product.subtitle_ar : product.subtitle_en}
 </p>

 {/* Price */}
 <div className="flex items-baseline gap-2 pt-1">
 <span className="font-extrabold text-2xl text-[#6CC6C9]">
 {formatPrice(unitPrice * quantity)}
 </span>
 {product.sale_price && (
 <span className="text-xs text-[#6B8C8E] line-through">
 {formatPrice(product.price)}
 </span>
 )}
 </div>

 {/* Tasting Notes */}
 <div className="space-y-1">
 <span className="text-xs font-bold text-[#6B8C8E] uppercase">{t('الإيحاءات', 'Tasting Notes')}:</span>
 <div className="flex flex-wrap gap-1.5 pt-1">
 {(language === 'ar' ? product.tasting_notes_ar || [] : product.tasting_notes_en || []).map((note, i) => (
 <span key={i} className="text-xs bg-[#F0FAFA] text-[#6CC6C9] px-2.5 py-1 rounded-lg border border-[#E8F2F2] font-medium">
 {note}
 </span>
 ))}
 </div>
 </div>

 {/* Weight Selection */}
 {(product.weight_options || []).length > 0 && (
 <div className="space-y-1.5 pt-2">
 <span className="text-xs font-bold text-[#6B8C8E]">{product.unit_type === 'piece' ? t('اختر عدد الحبات','Select Pieces') : product.unit_type === 'box' ? t('اختر حجم البوكس','Select Box Size') : t('اختر خيار البيع','Select Selling Option')}:</span>
 <div className="grid grid-cols-3 gap-2">
 {product.weight_options?.map(w => (
 <button
 key={w.value}
 onClick={() => setSelectedWeight(w.value)}
 className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${selectedWeight === w.value
 ? 'bg-[#0E5257] text-white border-[#6CC6C9]'
 : 'bg-[#F0FAFA] text-[#4A6869] border-[#E8F2F2] hover:border-[#0E5257]'
 }`}
 >
 {language === 'ar' ? w.label_ar : w.label_en}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Grind Selection */}
 {(product.grind_options || []).length > 0 && (
 <div className="space-y-1.5 pt-2">
 <span className="text-xs font-bold text-[#6B8C8E]">{t('درجة الطحن', 'Grind Type')}:</span>
 <select
 value={selectedGrind}
 onChange={e => setSelectedGrind(e.target.value as GrindType)}
 className="w-full bg-[#F0FAFA] text-[#1A2E30] border border-[#E8F2F2] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#6CC6C9] cursor-pointer"
 >
 {product.grind_options.map(g => (
 <option key={g} value={g}>
 {grindLabels[g]?.[language] || g}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Add To Cart & View Details Actions */}
 <div className="pt-4 border-t border-[#E8F2F2] space-y-2">

 <div className="flex gap-2">
 {/* Quantity */}
 <div className="flex items-center border border-[#E8F2F2] rounded-xl bg-[#F0FAFA] px-2">
 <button
 onClick={() => setQuantity(Math.max(1, quantity - 1))}
 className="p-2 hover:text-[#6CC6C9] transition cursor-pointer"
 >
 <Minus className="w-4 h-4" />
 </button>
 <span className="px-3 text-sm font-bold text-[#1A2E30]">{quantity}</span>
 <button
 onClick={() => setQuantity(quantity + 1)}
 className="p-2 hover:text-[#6CC6C9] transition cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 </button>
 </div>

 {/* Add Button */}
 <button
 onClick={handleAddToCart}
 className={`flex-1 py-3 rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${addedSuccess
 ? 'bg-emerald-600 text-white'
 : 'bg-[#0E5257] hover:bg-[#2B7D82] text-white shadow-[#0E5257]/30'
 }`}
 >
 {addedSuccess ? (
 <>
 <Check className="w-4 h-4" />
 <span>{t('تمت الإضافة بنجاح!', 'Added Successfully!')}</span>
 </>
 ) : (
 <>
 <ShoppingBag className="w-4 h-4" />
 <span>{t('إضافة لسلة التسوق', 'Add to Shopping Cart')}</span>
 </>
 )}
 </button>
 </div>

 <button
 onClick={() => {
 onNavigate(`/products/${product.slug}`);
 onClose();
 }}
 className="w-full text-center text-xs text-[#6CC6C9] hover:underline pt-2 cursor-pointer"
 >
 {t('عرض جميع المواصفات والتقييمات الكاملة ←', 'View Full Details & Reviews →')}
 </button>

 </div>

 </div>

 </div>
 </div>
 );
};

export default ProductQuickViewModal;
